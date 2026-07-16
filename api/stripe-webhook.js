// api/stripe-webhook.js
// Vercel serverless function — receives Stripe webhook events and inserts paid shifts
// into Supabase. Notifications (email + push) are delegated to /api/notify-shift,
// which is also called by the free-shift path in the app.

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
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

  // Roster manager support: posted_by is the acting user.
  // Falls back to owner_id for owner-posted shifts (and all
  // legacy checkouts created before this change).
  shiftData.posted_by = shiftData.posted_by || shiftData.owner_id;

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

  // Notify pharmacists (email + native push). Shared with the free-shift path.
  // Never fail the webhook response over this — the shift is already saved.
  try {
    if (insertedShift?.id) {
      const notifyRes = await fetch(
        "https://www.scriptshiftwa.com.au/api/notify-shift",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shiftId: insertedShift.id }),
        }
      );
      console.log("notify-shift responded:", notifyRes.status, await notifyRes.text());
    } else {
      console.warn("No inserted shift id — skipping notifications");
    }
  } catch (e) {
    console.warn("notify-shift call failed:", e.message);
  }

  return res.status(200).json({ success: true });
}
