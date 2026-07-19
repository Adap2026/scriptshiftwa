// api/notify-shift.js
// Sends shift notifications (Resend email + APNs push) for a single shift.
// Called by:
//   - api/stripe-webhook.js  after a paid shift is inserted
//   - src/App.js             after a free shift is inserted
//
// Safe to call from the browser: it accepts only a shiftId, re-reads the shift
// server-side with the service role key, and refuses to notify the same shift twice.
//
// REQUIRED DB CHANGE — run once in the Supabase SQL editor:
//   alter table shifts add column if not exists notified_at timestamptz;

import { sendPushToAll } from "../lib/apns.js";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const maxDuration = 60;

const supaHeaders = {
  "Content-Type": "application/json",
  apikey: SUPA_SERVICE_KEY,
  Authorization: `Bearer ${SUPA_SERVICE_KEY}`,
};

// Build one email payload for a pharmacist (used by the batch sender below).
function buildEmail(pharmacist, shift) {
  const { email, full_name } = pharmacist;
  const shiftDate = shift.shift_date || "TBC";
  const shiftType = shift.type || "Standard";
  const rate = shift.rate ? `$${shift.rate}/hr` : "Negotiable";
  const location = shift.location || shift.region || "WA";

  return {
    from: "ScriptShift WA <hello@scriptshiftwa.com.au>",
    to: [email],
    subject: `New ${shiftType} Shift \u2014 ${shift.pharmacy_name} (${shiftDate})`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0E0F13;color:#fff;padding:32px;border-radius:12px;">
        <div style="margin-bottom:24px;">
          <span style="font-size:22px;font-weight:700;color:#F0A500;">ScriptShift</span>
          <span style="font-size:14px;color:#888;margin-left:8px;">Western Australia</span>
        </div>
        <h2 style="color:#fff;margin-bottom:6px;">New shift matches your profile</h2>
        <p style="color:#aaa;font-size:14px;margin-bottom:24px;">Hi ${full_name || "there"}, a new shift has been posted that matches your software and region preferences.</p>
        <div style="background:#16181F;border:1px solid #252830;border-radius:10px;padding:20px;margin-bottom:24px;">
          <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:4px;">${shift.pharmacy_name}</div>
          <div style="font-size:13px;color:#aaa;margin-bottom:16px;">\ud83d\udccd ${location}</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;font-size:13px;color:#888;">Date</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shiftDate}${shift.date_to && shift.date_to !== shiftDate ? ` \u2192 ${shift.date_to}` : ""}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#888;">Hours</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shift.start_time || "09:00"} \u2013 ${shift.end_time || "17:00"}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#888;">Rate</td><td style="padding:6px 0;font-size:13px;color:#F0A500;font-weight:700;">${rate}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#888;">Type</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shiftType}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#888;">Software</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shift.software || "Any"}</td></tr>
            ${shift.notes ? `<tr><td style="padding:6px 0;font-size:13px;color:#888;vertical-align:top;">Notes</td><td style="padding:6px 0;font-size:13px;color:#fff;">${shift.notes}</td></tr>` : ""}
          </table>
        </div>
        <a href="https://www.scriptshiftwa.com.au" style="display:inline-block;background:#F0A500;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">Apply Now \u2192</a>
        <p style="color:#555;font-size:11px;margin-top:24px;">You're receiving this because your profile matches this shift. <a href="https://www.scriptshiftwa.com.au" style="color:#555;">Manage preferences</a> \u00b7 ScriptShift Technologies Pty Ltd \u00b7 ABN 21 698 500 542</p>
      </div>
    `,
  };
}

// Resend's batch endpoint takes up to 100 emails in ONE request, which avoids
// the 2-requests-per-second rate limit that silently dropped sends before.
async function sendBatch(emails) {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(emails),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Resend batch failed (${res.status}):`, text);
    return 0;
  }
  console.log(`Resend batch accepted ${emails.length} emails`);
  return emails.length;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const shiftId = body?.shiftId;
  if (!shiftId) return res.status(400).json({ error: "shiftId required" });

  // 1. Re-read the shift server-side (never trust the caller's copy)
  let shift = null;
  try {
    const shiftRes = await fetch(
      `${SUPA_URL}/rest/v1/shifts?id=eq.${shiftId}&select=*`,
      { headers: supaHeaders }
    );
    if (!shiftRes.ok) throw new Error(await shiftRes.text());
    const rows = await shiftRes.json();
    shift = Array.isArray(rows) ? rows[0] : rows;
  } catch (e) {
    console.error("notify-shift: could not load shift —", e.message);
    return res.status(500).json({ error: "Could not load shift" });
  }

  if (!shift) return res.status(404).json({ error: "Shift not found" });
  if (shift.status !== "active") {
    return res.status(200).json({ skipped: "shift not active" });
  }
  if (shift.notified_at) {
    return res.status(200).json({ skipped: "already notified" });
  }

  // 2. Claim it immediately so a double-call can't double-send
  await fetch(`${SUPA_URL}/rest/v1/shifts?id=eq.${shiftId}`, {
    method: "PATCH",
    headers: supaHeaders,
    body: JSON.stringify({ notified_at: new Date().toISOString() }),
  });

  // 3. Fetch matching pharmacists and email them
  let matchedCount = 0;
  let emailed = 0;
  try {
    const profilesRes = await fetch(
      `${SUPA_URL}/rest/v1/profiles?role=eq.pharmacist&select=email,full_name,software,regions`,
      { headers: supaHeaders }
    );
    const pharmacists = await profilesRes.json();

    if (Array.isArray(pharmacists)) {
      const shiftSoftware = (shift.software || "").toLowerCase();
      const shiftRegion = (shift.region || "").toLowerCase();

      const matching = pharmacists.filter(p => {
        if (!p.email) return false;
        const pSoftware = (p.software || "").toLowerCase();
        const pRegions = Array.isArray(p.regions)
          ? p.regions.join(",").toLowerCase()
          : (p.regions || "").toLowerCase();

        // Match if pharmacist knows the required software OR shift has no software requirement
        const softwareMatch = !shiftSoftware || pSoftware.includes(shiftSoftware) || shiftSoftware.includes("any");
        // Match if pharmacist covers the region OR pharmacist has no region set
        const regionMatch = !pRegions || pRegions.includes(shiftRegion) || pRegions.includes("western australia");

        return softwareMatch && regionMatch;
      });

      matchedCount = matching.length;
      console.log(`notify-shift: sending to ${matching.length}/${pharmacists.length} pharmacists for shift ${shiftId}`);

      // Send via Resend's batch endpoint: 100 per request, so one request
      // covers the whole list and we never hit the per-second rate limit.
      const payloads = matching.map(p => buildEmail(p, shift));
      for (let i = 0; i < payloads.length; i += 100) {
        const batch = payloads.slice(i, i + 100);
        emailed += await sendBatch(batch);
        if (i + 100 < payloads.length) await new Promise(r => setTimeout(r, 600));
      }
    }
  } catch (e) {
    console.warn("notify-shift: email stage failed —", e.message);
  }

  // 4. Native push to registered iOS devices
  let push = { sent: 0, failed: 0 };
  try {
    push = await sendPushToAll({
      title: "New shift posted",
      body: `${shift.pharmacy_name || "A WA pharmacy"} — ${shift.shift_date || "new shift"}${shift.location ? " · " + shift.location : ""}`,
      url: "https://www.scriptshiftwa.com.au/browse",
    });
  } catch (e) {
    console.error("notify-shift: push stage failed —", e.message);
  }

  return res.status(200).json({ ok: true, matched: matchedCount, emailed, push });
}
