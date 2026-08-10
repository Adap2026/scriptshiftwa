// api/calendar-feed.js
// GET /api/calendar-feed?token=xxxx
//
// A user's calendar can contain two kinds of accepted shifts:
//   (a) shifts they OWN (owner_id = user) that have an accepted application
//   (b) shifts they APPLIED to (applications.pharmacist_id = user, status='accepted')
// A single ScriptShift user can appear in both sets, so we query both and
// merge — there's no separate "owner" role to key off.
//
// Uses the service role key (same pattern as your stripe-webhook /
// notify-shift functions) so it can read across owner_id and
// pharmacist_id regardless of RLS.

const { createClient } = require('@supabase/supabase-js');
const { buildCalendarFeed } = require('../lib/ics');

const SUPA_URL = process.env.SUPA_URL || 'https://ageszwwbtawphfmtmrfj.supabase.co';
const supabase = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

module.exports = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    res.status(400).send('Missing token');
    return;
  }

  const { data: tokenRow, error: tokenErr } = await supabase
    .from('calendar_feed_tokens')
    .select('user_id')
    .eq('token', token)
    .single();

  if (tokenErr || !tokenRow) {
    res.status(404).send('Unknown or revoked calendar token');
    return;
  }

  const userId = tokenRow.user_id;
  const shiftCols = 'id, pharmacy_name, location, shift_date, date_to, start_time, end_time, rate, software, status';

  // (a) Shifts this user owns, that have at least one accepted application
  const ownedPromise = supabase
    .from('shifts')
    .select(`${shiftCols}, applications!inner(status)`)
    .eq('owner_id', userId)
    .eq('applications.status', 'accepted');

  // (b) Shifts this user applied to and was accepted for
  const appliedPromise = supabase
    .from('applications')
    .select(`shift_id, status, shifts(${shiftCols})`)
    .eq('pharmacist_id', userId)
    .eq('status', 'accepted');

  const [{ data: ownedShifts, error: ownedErr }, { data: appliedRows, error: appliedErr }] =
    await Promise.all([ownedPromise, appliedPromise]);

  if (ownedErr || appliedErr) {
    res.status(500).send('Failed to load shifts');
    return;
  }

  const fromApplied = (appliedRows || [])
    .map((row) => row.shifts)
    .filter(Boolean);

  // Merge + dedupe by shift id (a user could theoretically show up in both
  // sets if e.g. AHPRA data changes — cheap safety net)
  const merged = new Map();
  [...(ownedShifts || []), ...fromApplied].forEach((shift) => {
    merged.set(shift.id, shift);
  });

  const icsBody = buildCalendarFeed([...merged.values()], 'ScriptShift WA – My Shifts');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="scriptshiftwa.ics"');
  res.setHeader('Cache-Control', 'public, max-age=900');
  res.status(200).send(icsBody);
};
