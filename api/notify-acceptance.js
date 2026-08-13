// api/notify-acceptance.js
//
// Fires when a pharmacist's application is accepted. Sends both the
// pharmacist and the pharmacy owner an email with a link to subscribe
// to their ScriptShift calendar feed.
//
// NOTES:
// - No .ics attachment: Resend's batch endpoint doesn't support attachments.
// - No `resend` npm package: it isn't in package.json, so this calls
//   Resend's HTTP API directly with fetch — same approach notify-shift.js
//   already uses for its batch sends.
// - Uses whichever Resend key env var is set. Your Resend key has
//   historically been stored under the non-standard name
//   ScriptShift_Webhook alongside RESEND_API_KEY — this checks both so it
//   works regardless of which one is actually populated.

const { createClient } = require('@supabase/supabase-js');

const SUPA_URL = process.env.SUPA_URL || 'https://ageszwwbtawphfmtmrfj.supabase.co';
const supabase = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const RESEND_API_KEY = process.env.ScriptShift_Webhook || process.env.RESEND_API_KEY;

module.exports = async (req, res) => {
  const { applicationId } = req.body;
  if (!applicationId) return res.status(400).json({ error: 'Missing applicationId' });

  if (!RESEND_API_KEY) {
    console.warn('notify-acceptance: no Resend API key found in env (checked ScriptShift_Webhook, RESEND_API_KEY)');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('id, pharmacist_id, status, shifts(id, owner_id, pharmacy_name, location, shift_date, date_to, start_time, end_time, rate, software)')
    .eq('id', applicationId)
    .single();

  if (appErr || !app || app.status !== 'accepted') {
    return res.status(404).json({ error: 'Application not found or not accepted' });
  }

  const shift = app.shifts;

  const [{ data: pharmacist }, { data: owner }] = await Promise.all([
    supabase.from('profiles').select('email, full_name').eq('id', app.pharmacist_id).single(),
    supabase.from('profiles').select('email, full_name').eq('id', shift.owner_id).single(),
  ]);

  async function feedTokenFor(userId) {
    const { data } = await supabase.from('calendar_feed_tokens').select('token').eq('user_id', userId).single();
    if (data) return data.token;
    const { data: created } = await supabase.from('calendar_feed_tokens').insert({ user_id: userId }).select('token').single();
    return created?.token;
  }

  const [pharmacistToken, ownerToken] = await Promise.all([
    feedTokenFor(app.pharmacist_id),
    feedTokenFor(shift.owner_id),
  ]);

  const feedUrl = (token) => `https://www.scriptshiftwa.com.au/api/calendar-feed?token=${token}`;

  const emails = [
    {
      from: 'ScriptShift WA <shifts@scriptshiftwa.com.au>',
      to: pharmacist.email,
      subject: `Shift confirmed – ${shift.pharmacy_name} on ${shift.shift_date}`,
      html: `
        <p>Your shift at ${shift.pharmacy_name} on ${shift.shift_date} (${shift.start_time}–${shift.end_time}) is confirmed.</p>
        <p><a href="${feedUrl(pharmacistToken)}">Subscribe to your ScriptShift calendar</a> to see this and every future accepted shift automatically — it stays in sync even after a shift is marked filled.</p>
      `,
    },
    {
      from: 'ScriptShift WA <shifts@scriptshiftwa.com.au>',
      to: owner.email,
      subject: `Shift filled – ${shift.shift_date}`,
      html: `
        <p>Your shift on ${shift.shift_date} (${shift.start_time}–${shift.end_time}) has been accepted.</p>
        <p><a href="${feedUrl(ownerToken)}">Subscribe to your pharmacy's roster calendar</a> to keep a running schedule of every accepted shift.</p>
      `,
    },
  ];

  try {
    const resendRes = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emails),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.warn('notify-acceptance: Resend send failed:', resendRes.status, errText);
      return res.status(502).json({ error: 'Email send failed' });
    }
  } catch (e) {
    console.warn('notify-acceptance: Resend request error:', e);
    return res.status(502).json({ error: 'Email send failed' });
  }

  res.status(200).json({ ok: true });
};
