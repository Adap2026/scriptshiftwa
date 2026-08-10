// lib/ics.js
// Dependency-free ICS (iCalendar) builder for ScriptShift WA.
//
// Your `shifts` rows store shift_date ("YYYY-MM-DD"), optional date_to
// for multi-day blocks, and start_time/end_time as bare "HH:MM" strings
// interpreted in Australia/Perth local time (UTC+8, no DST — safe to
// hardcode the offset).

const PERTH_OFFSET_HOURS = 8;

function escapeText(str = '') {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line) {
  if (line.length <= 75) return line;
  let result = '';
  let remaining = line;
  while (remaining.length > 75) {
    result += remaining.slice(0, 75) + '\r\n ';
    remaining = remaining.slice(75);
  }
  return result + remaining;
}

// Combine a "YYYY-MM-DD" date + "HH:MM" Perth-local time into a UTC Date
function perthLocalToUTC(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '00:00').split(':').map(Number);
  // Perth is UTC+8 with no DST, so UTC = local - 8h
  return new Date(Date.UTC(year, month - 1, day, hour - PERTH_OFFSET_HOURS, minute));
}

function toICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Build a single VEVENT block for a shift row (as returned from Supabase).
 * @param {object} shift
 * @param {string} shift.id
 * @param {string} shift.pharmacy_name
 * @param {string} shift.location
 * @param {string} shift.shift_date - "YYYY-MM-DD"
 * @param {string} [shift.date_to] - "YYYY-MM-DD", defaults to shift_date
 * @param {string} shift.start_time - "HH:MM"
 * @param {string} shift.end_time - "HH:MM"
 * @param {number|string} shift.rate
 * @param {string} [shift.software]
 * @param {string} [shift.status] - shift lifecycle: 'active' | 'filled' | 'withdrawn'
 * @param {number} [shift.sequence]
 */
function buildShiftEvent(shift) {
  const startDate = shift.shift_date;
  const endDate = shift.date_to || shift.shift_date;

  const start = perthLocalToUTC(startDate, shift.start_time);
  const end = perthLocalToUTC(endDate, shift.end_time);

  const summary = `Locum Shift – ${shift.pharmacy_name}`;
  const descriptionParts = [
    `Rate: $${shift.rate}/hr`,
    shift.software ? `Software: ${shift.software}` : null,
    'Booked via ScriptShift WA',
  ].filter(Boolean);

  // shift.status is the SHIFT lifecycle (active/filled/withdrawn), not the
  // application status. We only ever pass accepted-application shifts in
  // here, so 'withdrawn' is the only state that should cancel the event.
  const status = shift.status === 'withdrawn' ? 'CANCELLED' : 'CONFIRMED';

  const lines = [
    'BEGIN:VEVENT',
    `UID:shift-${shift.id}@scriptshiftwa.com.au`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `LOCATION:${escapeText(shift.location || shift.pharmacy_name)}`,
    `DESCRIPTION:${escapeText(descriptionParts.join('\\n'))}`,
    `STATUS:${status}`,
    `SEQUENCE:${shift.sequence || 0}`,
    'END:VEVENT',
  ];

  return lines.map(foldLine).join('\r\n');
}

function buildCalendarFeed(shifts, calName = 'ScriptShift WA Shifts') {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScriptShift WA//Shift Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`,
    'X-WR-TIMEZONE:Australia/Perth',
    'X-PUBLISHED-TTL:PT30M',
    'REFRESH-INTERVAL;VALUE=DURATION:PT30M',
  ].map(foldLine).join('\r\n');

  const events = shifts.map(buildShiftEvent).join('\r\n');
  const footer = 'END:VCALENDAR';

  return [header, events, footer].filter(Boolean).join('\r\n') + '\r\n';
}

function buildSingleEventICS(shift) {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScriptShift WA//Shift Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ].map(foldLine).join('\r\n');

  return [header, buildShiftEvent(shift), 'END:VCALENDAR'].join('\r\n') + '\r\n';
}

module.exports = { buildCalendarFeed, buildSingleEventICS, buildShiftEvent };
