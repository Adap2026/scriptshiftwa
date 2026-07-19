// api/create-checkout-session.js
//
// Creates a Stripe Checkout Session priced as (daily rate × number of listing days).
//
// This replaces the old fixed-price Payment Links (STRIPE_PAYMENT_LINKS /
// BUNDLE_LINKS). There are no bundles and no volume discounts: the line item is
// a single per-day listing fee with quantity = number of days, so the Stripe
// checkout page reads e.g. "Standard shift listing × 3" rather than "3-Day Bundle".
//
// Requires env vars (already present if the existing webhook works):
//   STRIPE_SECRET_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (used only to verify the caller's JWT)

const DAILY_RATES_CENTS = {
  Standard:  900,   // $9.00 AUD per listing day
  Weekend:  1400,   // $14.00 AUD per listing day
  Emergency: 1900,  // $19.00 AUD per listing day
};

const RATE_DESCRIPTION = {
  Standard:  "Standard shift listing — per day",
  Weekend:   "Weekend shift listing — per day",
  Emergency: "Emergency shift listing — per day",
};

const MAX_DAYS = 60;

// Recompute day count server-side. Never trust the client's number.
function dayCount(from, to) {
  if (!from) return 0;
  const start = new Date(from + "T00:00:00Z");
  const end = new Date((to || from) + "T00:00:00Z");
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

async function verifyUser(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await verifyUser(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "Not signed in." });

  const { shift, origin } = req.body || {};
  if (!shift || typeof shift !== "object") {
    return res.status(400).json({ error: "Missing shift payload." });
  }

  // Evening has been folded into Standard — anything unrecognised bills as Standard.
  const type = DAILY_RATES_CENTS[shift.type] ? shift.type : "Standard";
  const unitAmount = DAILY_RATES_CENTS[type];

  const days = dayCount(shift.shift_date, shift.date_to);
  if (days < 1) return res.status(400).json({ error: "Invalid shift date range." });
  if (days > MAX_DAYS) {
    return res.status(400).json({ error: `Listings are limited to ${MAX_DAYS} days.` });
  }

  // The shift row is written by the webhook after payment succeeds, not here.
  // Stripe metadata has a 500-char limit per value, so the payload is split
  // across a few keys rather than stuffed into one.
  const shiftForMeta = {
    owner_id: user.id,
    posted_by: user.id,
    pharmacy_name: String(shift.pharmacy_name || "").slice(0, 120),
    location: String(shift.location || "").slice(0, 120),
    region: shift.region === "Regional" ? "Regional" : "Metro",
    shift_date: shift.shift_date,
    date_to: shift.date_to || shift.shift_date,
    start_time: shift.start_time,
    end_time: shift.end_time,
    rate: String(shift.rate || ""),
    type,
    software: String(shift.software || "").slice(0, 60),
    travel_paid: !!shift.travel_paid,
    accommodation: !!shift.accommodation,
    notes: String(shift.notes || "").slice(0, 400),
    status: "active",
    payment_status: "paid",
  };

  const encoded = Buffer.from(JSON.stringify(shiftForMeta)).toString("base64");
  const metadata = { owner_id: user.id, listing_days: String(days), listing_type: type };
  for (let i = 0; i * 480 < encoded.length; i++) {
    if (i >= 10) return res.status(400).json({ error: "Shift details too long." });
    metadata[`shift_${i}`] = encoded.slice(i * 480, (i + 1) * 480);
  }
  metadata.shift_chunks = String(Math.ceil(encoded.length / 480));

  const base = origin || `https://${req.headers.host}`;

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${base}/browse?payment=success`);
  params.append("cancel_url", `${base}/post?payment=cancelled`);
  params.append("client_reference_id", user.id);
  if (user.email) params.append("customer_email", user.email);

  params.append("line_items[0][quantity]", String(days));
  params.append("line_items[0][price_data][currency]", "aud");
  params.append("line_items[0][price_data][unit_amount]", String(unitAmount));
  params.append("line_items[0][price_data][product_data][name]", RATE_DESCRIPTION[type]);
  params.append(
    "line_items[0][price_data][product_data][description]",
    `Listing fee for a ${type.toLowerCase()} locum pharmacist shift at ${shiftForMeta.pharmacy_name || "your pharmacy"}, ${shiftForMeta.location || "WA"}. Covers ${days} listing day${days === 1 ? "" : "s"}.`
  );

  for (const [k, v] of Object.entries(metadata)) {
    params.append(`metadata[${k}]`, v);
    params.append(`payment_intent_data[metadata][${k}]`, v);
  }

  try {
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      console.error("Stripe session error:", session);
      return res
        .status(502)
        .json({ error: session?.error?.message || "Could not start checkout." });
    }

    return res.status(200).json({
      url: session.url,
      days,
      total_cents: unitAmount * days,
    });
  } catch (e) {
    console.error("create-checkout-session failed:", e);
    return res.status(500).json({ error: "Could not start checkout." });
  }
}
