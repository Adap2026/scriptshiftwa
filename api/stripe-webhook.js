// api/stripe-webhook.js
// Vercel serverless function — receives Stripe webhook events and inserts shifts into Supabase
// Deploy by placing this file at /api/stripe-webhook.js in your GitHub repo root

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key — bypasses RLS
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

  // Verify webhook signature
  let event;
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Only handle successful payments
  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;
  const clientRef = session.client_reference_id || "";

  console.log("Payment success for:", clientRef);

  // The pending shift data was embedded in client_reference_id as JSON (base64 encoded)
  // Format: we store it as base64(JSON) in the client_reference_id field
  let shiftData = null;
  try {
    // Try to decode base64 JSON from client_reference_id
    const decoded = Buffer.from(clientRef, "base64").toString("utf-8");
    shiftData = JSON.parse(decoded);
  } catch (e) {
    console.log("client_reference_id is not base64 JSON, using metadata instead");
    // Fall back to session metadata
    shiftData = session.metadata || null;
  }

  if (!shiftData || !shiftData.owner_id) {
    console.warn("No shift data found in payment session");
    return res.status(200).json({ received: true, warning: "No shift data" });
  }

  // Insert shift into Supabase using service role key (bypasses RLS)
  try {
    const insertRes = await fetch(`${SUPA_URL}/rest/v1/shifts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPA_SERVICE_KEY,
        "Authorization": `Bearer ${SUPA_SERVICE_KEY}`,
        "Prefer": "return=minimal",
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

    console.log("Shift inserted successfully for:", shiftData.pharmacy_name);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Insert error:", err);
    return res.status(500).json({ error: err.message });
  }
}
