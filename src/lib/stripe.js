// ============================================================
// STRIPE SETUP
// ============================================================
// PharmShift WA charges pharmacy owners per shift posted.
// Pricing tiers:
//   Standard shift  → $9 AUD
//   Urgent shift    → $19 AUD
//   Weekend shift   → $14 AUD
//
// SETUP STEPS:
// 1. Create account at https://stripe.com/au
// 2. Get your Publishable Key from Dashboard → Developers → API Keys
// 3. Add to .env: REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
//
// BACKEND (required for real payments):
//   You need a small server-side function to create Checkout Sessions.
//   Use one of: Supabase Edge Functions, Vercel Serverless, or AWS Lambda.
//   See /supabase/functions/create-checkout/index.ts for the Edge Function.
//
// For testing, use Stripe test key: pk_test_xxx
// Test card: 4242 4242 4242 4242 | Any future date | Any CVC
// ============================================================

import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_KEY_HERE"
);

// Pricing map (AUD cents)
export const SHIFT_PRICES = {
  Standard: { amount: 900, label: "$9.00 AUD" },
  Weekend: { amount: 1400, label: "$14.00 AUD" },
  Emergency: { amount: 1900, label: "$19.00 AUD" },
  Evening: { amount: 900, label: "$9.00 AUD" },
};

// ============================================================
// CREATE CHECKOUT SESSION
// Calls your backend (Supabase Edge Function or API route)
// which creates the Stripe Checkout Session server-side.
// ============================================================
export const redirectToCheckout = async ({
  shiftType,
  pharmacyName,
  shiftDate,
  userId,
  shiftDraftId, // temp ID saved before payment
}) => {
  const price = SHIFT_PRICES[shiftType] || SHIFT_PRICES.Standard;

  // Call your backend endpoint to create the session
  const response = await fetch(
    `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        amount: price.amount,
        currency: "aud",
        description: `PharmShift WA – ${shiftType} shift at ${pharmacyName} on ${shiftDate}`,
        metadata: {
          user_id: userId,
          shift_draft_id: shiftDraftId,
          shift_type: shiftType,
        },
        success_url: `${window.location.origin}?payment=success&shift=${shiftDraftId}`,
        cancel_url: `${window.location.origin}?payment=cancelled`,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to create payment session");
  }

  const { sessionId } = await response.json();

  // Redirect to Stripe Checkout
  const stripe = await stripePromise;
  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;
};

// ============================================================
// STRIPE CHECKOUT UI COMPONENT
// Shown inside the Post a Shift flow before submission
// ============================================================
export function PaymentSummary({ shiftType, onPay, onCancel, loading }) {
  const price = SHIFT_PRICES[shiftType] || SHIFT_PRICES.Standard;

  const styles = {
    card: {
      background: "#F7F9FC",
      border: "1.5px solid #E2E8F0",
      borderRadius: 14,
      padding: 24,
      marginTop: 24,
    },
    title: {
      fontFamily: "'DM Serif Display', serif",
      fontSize: 20,
      color: "#0B1F3A",
      marginBottom: 6,
    },
    sub: { fontSize: 14, color: "#4A5568", marginBottom: 20, lineHeight: 1.6 },
    priceRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#FFFFFF",
      border: "1.5px solid #E2E8F0",
      borderRadius: 10,
      padding: "14px 18px",
      marginBottom: 16,
    },
    priceLabel: { fontSize: 14, color: "#4A5568" },
    priceAmount: { fontSize: 22, fontWeight: 700, color: "#0B1F3A" },
    note: {
      fontSize: 12,
      color: "#718096",
      marginBottom: 20,
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    btnRow: { display: "flex", gap: 10 },
    cancelBtn: {
      flex: 1,
      padding: "11px 0",
      borderRadius: 10,
      border: "1.5px solid #E2E8F0",
      background: "#FFFFFF",
      color: "#4A5568",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
    },
    payBtn: {
      flex: 2,
      padding: "11px 0",
      borderRadius: 10,
      border: "none",
      background: loading ? "#A0AEC0" : "#635BFF", // Stripe purple
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: 700,
      cursor: loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    stripeNote: {
      textAlign: "center",
      fontSize: 11,
      color: "#A0AEC0",
      marginTop: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    badge: {
      display: "inline-block",
      background: shiftType === "Emergency" ? "#FFF5F5" : "#F0FFF4",
      color: shiftType === "Emergency" ? "#C53030" : "#276749",
      border: `1px solid ${shiftType === "Emergency" ? "#FC8181" : "#68D391"}`,
      borderRadius: 8,
      padding: "3px 10px",
      fontSize: 12,
      fontWeight: 700,
      marginLeft: 8,
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.title}>
        Post this shift
        <span style={styles.badge}>{shiftType}</span>
      </div>
      <p style={styles.sub}>
        Your shift goes live instantly after payment. Verified pharmacists in WA
        are notified in real time.
      </p>

      <div style={styles.priceRow}>
        <span style={styles.priceLabel}>
          {shiftType} shift posting fee
        </span>
        <span style={styles.priceAmount}>{price.label}</span>
      </div>

      <div style={styles.note}>
        <span>🔒</span> One-time fee. No subscription. No commission on the
        pharmacist's rate.
      </div>

      <div style={styles.btnRow}>
        <button style={styles.cancelBtn} onClick={onCancel}>
          Back
        </button>
        <button style={styles.payBtn} onClick={onPay} disabled={loading}>
          {loading ? (
            "Redirecting..."
          ) : (
            <>
              <span>Pay {price.label}</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>

      <div style={styles.stripeNote}>
        <span>🔐</span> Secure payment powered by Stripe
      </div>
    </div>
  );
}
