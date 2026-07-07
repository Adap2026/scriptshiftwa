// api/stripe-webhook.js
// Vercel serverless function — receives Stripe webhook events, inserts shifts into Supabase,
// and emails matching pharmacists about the new shift.
import { sendPushToAll } from "../lib/apns.js";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const RESEND_API_KEY = process.env.ScriptShift_Webhook;

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function sendShiftNotification(pharmacist, shift) {
  const { email, full_name, software, regions } = pharmacist;
  const shiftDate = shift.shift_date || "TBC";
  const shiftType = shift.type || "Standard";
  const rate = shift.rate ? `$${shift.rate}/hr` : "Negotiable";
  const location = shift.location || shift.region || "WA";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ScriptShift WA <hello@scriptshiftwa.com.au>",
        to: [email],
        subject: `New ${shiftType} Shift — ${shift.pharmacy_name} (${shiftDate})`,
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
              <div style="font-size:13px;color:#aaa;margin-bottom:16px;">📍 ${location}</div>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:6px 0;font-size:13px;color:#888;">Date</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shiftDate}${shift.date_to && shift.date_to !== shiftDate ? ` → ${shift.date_to}` : ""}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#888;">Hours</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shift.start_time || "09:00"} – ${shift.end_time || "17:00"}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#888;">Rate</td><td style="padding:6px 0;font-size:13px;color:#F0A500;font-weight:700;">${rate}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#888;">Type</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shiftType}</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#888;">Software</td><td style="padding:6px 0;font-size:13px;color:#fff;font-weight:600;">${shift.software || "Any"}</td></tr>
                ${shift.notes ? `<tr><td style="padding:6px 0;font-size:13px;color:#888;vertical-align:top;">Notes</td><td style="padding:6px 0;font-size:13px;color:#fff;">${shift.notes}</td></tr>` : ""}
              </table>
            </div>
            <a href="https://www.scriptshiftwa.com.au" style="display:inline-block;background:#F0A500;color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">Apply Now →</a>
            <p style="color:#555;font-size:11px;margin-top:24px;">You're receiving this because your profile matches this shift. <a href="https://www.scriptshiftwa.com.au" style="color:#555;">Manage preferences</a> · ScriptShift Technologies Pty Ltd · ABN 21 698 500 542</p>
          </div>
        `,
      }),
    });
    console.log("Notification sent to:", email);
  } catch (e) {
    console.warn("Failed to send notification to:", email, e.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const clientRef = session.client_reference_id || "";

  let shiftData = null;
  try {
    const decoded = Buffer.from(clientRef, "base64").toString("utf-8");
    shiftData = JSON.parse(decoded);
  } catch (e) {
    shiftData = session.metadata || null;
  }

  if (!shiftData || !shiftData.owner_id) {
    console.warn("No shift data found in payment session");
    return res.status(200).json({ received: true, warning: "No shift data" });
  }

  // Insert shift into Supabase
  let insertedShift = null;
  try {
    const insertRes = await fetch(`${SUPA_URL}/rest/v1/shifts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPA_SERVICE_KEY,
        "Authorization": `Bearer ${SUPA_SERVICE_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        ...shiftData,
        status: "active",
        payment_status: "paid",
        stripe_session_id: session.id,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      console.error("Supabase insert failed:", err);
      return res.status(500).json({ error: "Supabase insert failed", detail: err });
    }

    const inserted = await insertRes.json();
    insertedShift = Array.isArray(inserted) ? inserted[0] : inserted;
    console.log("Shift inserted:", insertedShift?.id);
  } catch (err) {
    console.error("Insert error:", err);
    return res.status(500).json({ error: err.message });
  }
  // Send native push to all registered iOS devices
    try {
      await sendPushToAll({
        title: "New shift posted",
        body: "A new locum shift is available — open ScriptShift WA to view",
        url: "https://www.scriptshiftwa.com.au/shifts",
      });
    } catch (pushErr) {
      console.error("Push send failed:", pushErr.message);
    }

  // Fetch matching pharmacists and send notifications
  try {
    const profilesRes = await fetch(
      `${SUPA_URL}/rest/v1/profiles?role=eq.pharmacist&select=email,full_name,software,regions`,
      {
        headers: {
          "apikey": SUPA_SERVICE_KEY,
          "Authorization": `Bearer ${SUPA_SERVICE_KEY}`,
        },
      }
    );
    const pharmacists = await profilesRes.json();

    if (Array.isArray(pharmacists)) {
      const shiftSoftware = (shiftData.software || "").toLowerCase();
      const shiftRegion = (shiftData.region || "").toLowerCase();

      const matching = pharmacists.filter(p => {
        if (!p.email) return false;
        const pSoftware = (p.software || "").toLowerCase();
        const pRegions = (p.regions || "").toLowerCase();

        // Match if pharmacist knows the required software OR shift has no software requirement
        const softwareMatch = !shiftSoftware || pSoftware.includes(shiftSoftware) || shiftSoftware.includes("any");
        // Match if pharmacist covers the region OR pharmacist has no region set
        const regionMatch = !pRegions || pRegions.includes(shiftRegion) || pRegions.includes("western australia");

        return softwareMatch && regionMatch;
      });

      console.log(`Sending notifications to ${matching.length} pharmacists`);

      // Send emails in parallel (max 10 at once to avoid rate limits)
      const chunks = [];
      for (let i = 0; i < matching.length; i += 10) chunks.push(matching.slice(i, i + 10));
      for (const chunk of chunks) {
        await Promise.all(chunk.map(p => sendShiftNotification(p, insertedShift || shiftData)));
      }
    }
  } catch (e) {
    console.warn("Notification error:", e.message);
    // Don't fail the response — shift was inserted successfully
  }

  return res.status(200).json({ success: true });
}
