/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://ageszwwbtawphfmtmrfj.supabase.co";
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Stripe Payment Links ──────────────────────────────────────────────────────
const SHIFT_LINKS = {
  standard: "https://buy.stripe.com/bJebIUffv5u6fWK0Wva7C08",
  evening:  "https://buy.stripe.com/00w28kgjz7Ce8uicFda7C09",
  weekend:  "https://buy.stripe.com/aFa00cd7naOq7qedJha7C0c",
  emergency:"https://buy.stripe.com/8x26oA6IZ8Gi8ui9t1a7C0b",
};
const BUNDLE_LINKS = {
  three: "https://buy.stripe.com/9B66oA7N38Gi4e25cLa7C0d",
  five:  "https://buy.stripe.com/5kQcMY8R7bSu5i6bB9a7C0a",
  eight: "https://buy.stripe.com/4gM3co4AR6yacKydJha7C07",
};

// ── Pricing ───────────────────────────────────────────────────────────────────
const PRICES = {
  standard:  14,
  evening:   14,
  weekend:   19,
  emergency: 24,
};
const BUNDLE_PRICES = { three: 35, five: 55, eight: 80 };

// ── WA Regions ────────────────────────────────────────────────────────────────
const REGIONS = [
  "Perth Metro – North",
  "Perth Metro – South",
  "Perth Metro – East",
  "Perth Metro – CBD",
  "Pilbara",
  "Kimberley",
  "Goldfields",
  "Wheatbelt",
  "South West",
  "Great Southern",
];

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:    "#0A1628",
  teal:    "#0D9488",
  tealLt:  "#14B8A6",
  amber:   "#F59E0B",
  slate:   "#1E293B",
  slateM:  "#334155",
  slateL:  "#475569",
  border:  "#1E3A5F",
  surface: "#112240",
  white:   "#F8FAFC",
  muted:   "#94A3B8",
  red:     "#EF4444",
  green:   "#22C55E",
  purple:  "#8B5CF6",
};

// ─────────────────────────────────────────────────────────────────────────────
// Tiny style helpers
// ─────────────────────────────────────────────────────────────────────────────
const btn = (bg, fg = "#fff", extra = {}) => ({
  background: bg,
  color: fg,
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  transition: "opacity .15s",
  ...extra,
});
const input = {
  width: "100%",
  background: C.slate,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.white,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: 20,
};
const label = { fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 600 };
const fieldGroup = { marginBottom: 14 };

// ─────────────────────────────────────────────────────────────────────────────
// Badge component
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ type }) {
  const map = {
    standard:  [C.teal,   "Standard"],
    evening:   [C.purple, "Evening"],
    weekend:   [C.amber,  "Weekend"],
    emergency: [C.red,    "Emergency"],
  };
  const [bg, label] = map[type] || [C.slateL, type];
  return (
    <span style={{
      background: bg + "22", color: bg, border: `1px solid ${bg}44`,
      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legal Modal
// ─────────────────────────────────────────────────────────────────────────────
function LegalModal({ title, children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000a", zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        maxWidth: 680, width: "100%", maxHeight: "80vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ margin: 0, color: C.white, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ ...btn(C.slateM), padding: "6px 14px" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shift Card
// ─────────────────────────────────────────────────────────────────────────────
function ShiftCard({ shift }) {
  const typeKey = (shift.shift_type || "standard").toLowerCase().replace(" ", "");
  const link = SHIFT_LINKS[typeKey] || "#";
  return (
    <div style={{
      ...card,
      display: "flex", flexDirection: "column", gap: 12,
      transition: "border-color .2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.white, marginBottom: 4 }}>
            {shift.pharmacy_name || "Pharmacy"}
          </div>
          <div style={{ color: C.muted, fontSize: 13 }}>
            📍 {shift.suburb || "Perth"}, {shift.region || "Perth Metro"}
          </div>
        </div>
        <Badge type={typeKey} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <InfoPill icon="📅" label="Date" value={shift.shift_date || "TBC"} />
        <InfoPill icon="🕐" label="Hours" value={`${shift.start_time || "8:00"} – ${shift.end_time || "17:00"}`} />
        <InfoPill icon="💰" label="Rate" value={`$${shift.rate || PRICES[typeKey] || 14}/hr`} />
        <InfoPill icon="🏥" label="Software" value={shift.software || "Fred/Minfos"} />
      </div>

      {shift.notes && (
        <div style={{ background: C.slate, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.muted }}>
          {shift.notes}
        </div>
      )}

      <a href={link} target="_blank" rel="noreferrer"
        style={{
          ...btn(C.teal, "#fff", { textAlign: "center", textDecoration: "none", display: "block" }),
        }}
      >
        Apply & Pay — ${PRICES[typeKey] || 14} AUD incl. GST
      </a>
    </div>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div style={{ background: C.slate, borderRadius: 8, padding: "8px 12px" }}>
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{icon} {label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Post a Shift Modal
// ─────────────────────────────────────────────────────────────────────────────
function PostShiftModal({ user, onClose, onPosted }) {
  const [step, setStep] = useState(1); // 1=details, 2=bundle/pay
  const [form, setForm] = useState({
    pharmacy_name: "",
    suburb: "",
    region: REGIONS[0],
    shift_type: "standard",
    shift_date: "",
    start_time: "08:00",
    end_time: "17:00",
    software: "",
    rate: "",
    notes: "",
    bundle: "none",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.pharmacy_name || !form.shift_date) {
      setError("Pharmacy name and date are required.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: dbErr } = await supabase.from("shifts").insert([{
      ...form,
      owner_id: user.id,
      owner_email: user.email,
      status: "pending_payment",
    }]);
    setLoading(false);
    if (dbErr) { setError(dbErr.message); return; }
    setStep(2);
  };

  const payLink = form.bundle === "none"
    ? SHIFT_LINKS[form.shift_type] || "#"
    : BUNDLE_LINKS[form.bundle] || "#";
  const payAmount = form.bundle === "none"
    ? PRICES[form.shift_type]
    : BUNDLE_PRICES[form.bundle];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000b", zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        maxWidth: 560, width: "100%", maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ margin: 0, color: C.white }}>
            {step === 1 ? "Post a Shift" : "Choose Payment"}
          </h3>
          <button onClick={onClose} style={{ ...btn(C.slateM), padding: "6px 14px" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {step === 1 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ ...fieldGroup, gridColumn: "1/-1" }}>
                  <label style={label}>Pharmacy Name *</label>
                  <input style={input} value={form.pharmacy_name} onChange={set("pharmacy_name")} placeholder="e.g. Karratha Pharmacy" />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Suburb *</label>
                  <input style={input} value={form.suburb} onChange={set("suburb")} placeholder="e.g. Joondalup" />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Region</label>
                  <select style={input} value={form.region} onChange={set("region")}>
                    {REGIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Shift Type</label>
                  <select style={input} value={form.shift_type} onChange={set("shift_type")}>
                    <option value="standard">Standard ($14)</option>
                    <option value="evening">Evening ($14)</option>
                    <option value="weekend">Weekend ($19)</option>
                    <option value="emergency">Emergency ($24)</option>
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Date *</label>
                  <input style={input} type="date" value={form.shift_date} onChange={set("shift_date")} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Start Time</label>
                  <input style={input} type="time" value={form.start_time} onChange={set("start_time")} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>End Time</label>
                  <input style={input} type="time" value={form.end_time} onChange={set("end_time")} />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Dispensing Software</label>
                  <input style={input} value={form.software} onChange={set("software")} placeholder="Fred, Minfos, Z, Lots..." />
                </div>
                <div style={fieldGroup}>
                  <label style={label}>Hourly Rate ($)</label>
                  <input style={input} type="number" value={form.rate} onChange={set("rate")} placeholder="e.g. 60" />
                </div>
                <div style={{ ...fieldGroup, gridColumn: "1/-1" }}>
                  <label style={label}>Notes</label>
                  <textarea style={{ ...input, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={set("notes")} placeholder="Any special requirements..." />
                </div>
              </div>
              {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}
              <button onClick={handleSubmit} disabled={loading}
                style={{ ...btn(C.teal, "#fff", { width: "100%", padding: 14, fontSize: 15 }) }}>
                {loading ? "Saving…" : "Continue to Payment →"}
              </button>
            </>
          ) : (
            <>
              <p style={{ color: C.muted, fontSize: 14, marginTop: 0 }}>
                Your shift has been saved. Choose a listing option and complete payment to go live.
              </p>
              {/* Bundle options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {[
                  { key: "none",  label: "Single Shift",   price: PRICES[form.shift_type], desc: "One shift listing" },
                  { key: "three", label: "3-Day Bundle",   price: 35, desc: "Save vs 3 singles" },
                  { key: "five",  label: "5-Day Bundle",   price: 55, desc: "Most popular" },
                  { key: "eight", label: "8-Day Bundle",   price: 80, desc: "Best value" },
                ].map((opt) => (
                  <div key={opt.key}
                    onClick={() => setForm((f) => ({ ...f, bundle: opt.key }))}
                    style={{
                      ...card,
                      cursor: "pointer",
                      borderColor: form.bundle === opt.key ? C.teal : C.border,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.white }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{opt.desc}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: C.tealLt, fontSize: 18 }}>${opt.price}</div>
                  </div>
                ))}
              </div>
              <a href={payLink} target="_blank" rel="noreferrer"
                style={{ ...btn(C.amber, C.navy, { width: "100%", padding: 14, fontSize: 15, textAlign: "center", textDecoration: "none", display: "block" }) }}>
                Pay ${payAmount} AUD (incl. GST) via Stripe →
              </a>
              <button onClick={() => { onPosted(); onClose(); }}
                style={{ ...btn("transparent", C.muted, { width: "100%", padding: 10, marginTop: 8, border: `1px solid ${C.border}` }) }}>
                Done (I have paid)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Modal (3-step pharmacist registration)
// ─────────────────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "", password: "",
    full_name: "", ahpra: "", phone: "",
    role: "pharmacist", // or owner
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async () => {
    setLoading(true); setError("");
    const { data, error: e } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setLoading(false);
    if (e) { setError(e.message); return; }
    onAuth(data.user);
  };

  const handleRegisterStep = async () => {
    if (step === 1) {
      if (!form.email || !form.password) { setError("Email and password required."); return; }
      setStep(2); setError("");
    } else if (step === 2) {
      if (!form.full_name || !form.ahpra) { setError("Name and AHPRA number required."); return; }
      setStep(3); setError("");
    } else {
      if (!termsAccepted) { setError("Please accept the Terms & Conditions to continue."); return; }
      setLoading(true); setError("");
      const { data, error: e } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (e) { setLoading(false); setError(e.message); return; }
      // Save profile
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: form.full_name,
          ahpra: form.ahpra,
          phone: form.phone,
          role: form.role,
        });
      }
      setLoading(false);
      onAuth(data.user);
    }
  };

  const steps = ["Account", "Details", "Confirm"];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000b", zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        maxWidth: 440, width: "100%",
      }}>
        <div style={{
          padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", gap: 16 }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setStep(1); setError(""); }}
                style={{ ...btn("transparent", mode === m ? C.tealLt : C.muted, { padding: "4px 0", borderBottom: mode === m ? `2px solid ${C.tealLt}` : "none", borderRadius: 0 }) }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ ...btn(C.slateM), padding: "6px 14px" }}>✕</button>
        </div>

        <div style={{ padding: "24px" }}>
          {mode === "login" ? (
            <>
              <div style={fieldGroup}>
                <label style={label}>Email</label>
                <input style={input} type="email" value={form.email} onChange={set("email")} />
              </div>
              <div style={fieldGroup}>
                <label style={label}>Password</label>
                <input style={input} type="password" value={form.password} onChange={set("password")} />
              </div>
              {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}
              <button onClick={handleLogin} disabled={loading}
                style={{ ...btn(C.teal, "#fff", { width: "100%", padding: 13 }) }}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </>
          ) : (
            <>
              {/* Step progress */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {steps.map((s, i) => (
                  <div key={s} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{
                      height: 3, borderRadius: 2, marginBottom: 4,
                      background: i + 1 <= step ? C.teal : C.slateM,
                    }} />
                    <span style={{ fontSize: 11, color: i + 1 <= step ? C.tealLt : C.muted }}>{s}</span>
                  </div>
                ))}
              </div>

              {step === 1 && (
                <>
                  <div style={fieldGroup}>
                    <label style={label}>I am a</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["pharmacist", "owner"].map((r) => (
                        <button key={r} onClick={() => setForm((f) => ({ ...f, role: r }))}
                          style={{ ...btn(form.role === r ? C.teal : C.slateM, form.role === r ? "#fff" : C.muted, { flex: 1, padding: 10 }) }}>
                          {r === "pharmacist" ? "💊 Pharmacist" : "🏥 Pharmacy Owner"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Email</label>
                    <input style={input} type="email" value={form.email} onChange={set("email")} />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Password</label>
                    <input style={input} type="password" value={form.password} onChange={set("password")} />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div style={fieldGroup}>
                    <label style={label}>Full Name *</label>
                    <input style={input} value={form.full_name} onChange={set("full_name")} placeholder="As per AHPRA registration" />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>AHPRA Registration Number *</label>
                    <input style={input} value={form.ahpra} onChange={set("ahpra")} placeholder="PHAxxxxxxxxx" />
                  </div>
                  <div style={fieldGroup}>
                    <label style={label}>Mobile Phone</label>
                    <input style={input} type="tel" value={form.phone} onChange={set("phone")} placeholder="04xx xxx xxx" />
                  </div>
                </>
              )}

              {step === 3 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <h4 style={{ color: C.white, margin: "0 0 8px" }}>Almost there!</h4>
                  <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
                    Please review and accept the Terms & Conditions before creating your account.
                  </p>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", textAlign: "left", marginBottom: 16 }}>
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                      style={{ marginTop: 2, accentColor: C.teal, width: 16, height: 16 }} />
                    <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                      I agree to the ScriptShift WA{" "}
                      <a href="#" style={{ color: C.tealLt }}>Terms of Service</a>,{" "}
                      <a href="#" style={{ color: C.tealLt }}>Privacy Policy</a>, and{" "}
                      <a href="#" style={{ color: C.tealLt }}>Refund Policy</a>.
                    </span>
                  </label>
                  <p style={{ color: C.muted, fontSize: 12 }}>
                    Operated by ScriptShift Technologies Pty Ltd (ABN 21 698 500 542)
                  </p>
                </div>
              )}

              {error && <p style={{ color: C.red, fontSize: 13 }}>{error}</p>}

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {step > 1 && (
                  <button onClick={() => setStep((s) => s - 1)}
                    style={{ ...btn(C.slateM, C.white, { flex: 1, padding: 12 }) }}>
                    ← Back
                  </button>
                )}
                <button onClick={handleRegisterStep} disabled={loading}
                  style={{ ...btn(C.teal, "#fff", { flex: 2, padding: 12 }) }}>
                  {loading ? "Creating…" : step < 3 ? "Next →" : "Create Account"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [legal, setLegal] = useState(null); // "terms" | "privacy" | "refund"
  const [filter, setFilter] = useState({ region: "all", type: "all", search: "" });

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Load shifts ────────────────────────────────────────────────────────────
  const loadShifts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("shifts")
      .select("*")
      .eq("status", "active")
      .order("shift_date", { ascending: true });
    setShifts(data || []);
    setLiveCount(data?.length || 0);
    setLoading(false);
  };

  useEffect(() => { loadShifts(); }, []);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel("shifts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, loadShifts)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // ── Filtered shifts ────────────────────────────────────────────────────────
  const filtered = shifts.filter((s) => {
    const regionOk = filter.region === "all" || s.region === filter.region;
    const typeOk   = filter.type === "all" || s.shift_type === filter.type;
    const searchOk = !filter.search ||
      (s.pharmacy_name || "").toLowerCase().includes(filter.search.toLowerCase()) ||
      (s.suburb || "").toLowerCase().includes(filter.search.toLowerCase());
    return regionOk && typeOk && searchOk;
  });

  // ── Styles ─────────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.navy}; color: ${C.white}; font-family: 'DM Sans', sans-serif; }
    a { color: inherit; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${C.navy}; }
    ::-webkit-scrollbar-thumb { background: ${C.slateM}; border-radius: 3px; }
    input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }
    input[type=time]::-webkit-calendar-picker-indicator { filter: invert(1); }
    select option { background: ${C.slate}; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  `;

  return (
    <>
      <style>{styles}</style>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: C.teal, borderRadius: 8, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700,
          }}>Rx</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>ScriptShift <span style={{ color: C.teal }}>WA</span></span>
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.slate, borderRadius: 20, padding: "3px 10px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 12, color: C.muted, fontFamily: "'DM Mono', monospace" }}>
              {liveCount} live
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: C.muted, display: "none" /* hide on mobile */ }}>{user.email}</span>
              <button onClick={() => setShowPost(true)}
                style={btn(C.teal, "#fff")}>+ Post Shift</button>
              <button onClick={signOut}
                style={btn(C.slateM, C.muted)}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => setShowAuth(true)}
                style={btn(C.teal, "#fff")}>Sign In / Register</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.slate} 100%)`,
        borderBottom: `1px solid ${C.border}`,
        padding: "48px 24px 40px",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 40px)", fontWeight: 700, letterSpacing: -1, marginBottom: 12 }}>
          WA's Pharmacy Shift Marketplace
        </h1>
        <p style={{ color: C.muted, fontSize: 16, maxWidth: 560, margin: "0 auto 28px" }}>
          Connecting locum pharmacists with pharmacy owners across Perth Metro, Pilbara, Kimberley & Goldfields — in real time.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { label: "Live Shifts", value: liveCount },
            { label: "Regions Covered", value: 10 },
            { label: "Listing from", value: "$14" },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.tealLt, fontFamily: "'DM Mono', monospace" }}>{value}</div>
              <div style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "14px 24px",
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
      }}>
        <input
          style={{ ...input, width: 220, flex: "0 0 220px" }}
          placeholder="🔍 Search pharmacy / suburb…"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
        />
        <select style={{ ...input, width: 180, flex: "0 0 180px" }}
          value={filter.region}
          onChange={(e) => setFilter((f) => ({ ...f, region: e.target.value }))}>
          <option value="all">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={{ ...input, width: 150, flex: "0 0 150px" }}
          value={filter.type}
          onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}>
          <option value="all">All Types</option>
          <option value="standard">Standard</option>
          <option value="evening">Evening</option>
          <option value="weekend">Weekend</option>
          <option value="emergency">Emergency</option>
        </select>
        {user && (
          <button onClick={() => setShowPost(true)}
            style={{ ...btn(C.amber, C.navy), marginLeft: "auto" }}>
            + Post a Shift
          </button>
        )}
      </div>

      {/* ── Shift Grid ────────────────────────────────────────────────────────── */}
      <main style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>Loading live shifts…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
            <h3 style={{ color: C.white, marginBottom: 8 }}>No shifts listed yet</h3>
            <p style={{ color: C.muted, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
              Be the first to post a shift and connect with qualified WA pharmacists.
            </p>
            <button
              onClick={() => user ? setShowPost(true) : setShowAuth(true)}
              style={btn(C.teal, "#fff", { padding: "12px 28px", fontSize: 15 })}>
              Post the First Shift →
            </button>
          </div>
        ) : (
          <>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
              Showing {filtered.length} shift{filtered.length !== 1 ? "s" : ""}
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}>
              {filtered.map((s) => <ShiftCard key={s.id} shift={s} />)}
            </div>
          </>
        )}
      </main>

      {/* ── Pricing Banner ───────────────────────────────────────────────────── */}
      <section style={{
        background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        padding: "40px 24px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: 8, fontSize: 22 }}>Transparent Listing Fees</h2>
          <p style={{ textAlign: "center", color: C.muted, fontSize: 14, marginBottom: 28 }}>
            All prices GST-inclusive. Secure payment via Stripe.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              { label: "Standard Shift",   price: 14, icon: "☀️",  sub: "Mon–Fri business hours" },
              { label: "Evening Shift",    price: 14, icon: "🌙",  sub: "After-hours weekday" },
              { label: "Weekend Shift",    price: 19, icon: "📅",  sub: "Saturday or Sunday" },
              { label: "Emergency Shift",  price: 24, icon: "🚨",  sub: "Same-day urgent cover" },
              { label: "3-Day Bundle",     price: 35, icon: "📦",  sub: "Save $7 vs singles" },
              { label: "5-Day Bundle",     price: 55, icon: "⭐",  sub: "Most popular" },
              { label: "8-Day Bundle",     price: 80, icon: "💎",  sub: "Best value" },
            ].map(({ label, price, icon, sub }) => (
              <div key={label} style={{
                ...card, textAlign: "center", padding: 16,
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontWeight: 700, color: C.white, fontSize: 14, marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 700, color: C.tealLt, fontSize: 22, marginBottom: 4 }}>${price}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{
        background: C.navy, borderTop: `1px solid ${C.border}`,
        padding: "32px 24px", textAlign: "center",
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          ScriptShift <span style={{ color: C.teal }}>WA</span>
        </div>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
          ScriptShift Technologies Pty Ltd · ABN 21 698 500 542
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            ["Terms of Service", "terms"],
            ["Privacy Policy", "privacy"],
            ["Refund Policy", "refund"],
          ].map(([name, key]) => (
            <button key={key} onClick={() => setLegal(key)}
              style={{ ...btn("transparent", C.muted, { padding: 0, fontSize: 12 }) }}>
              {name}
            </button>
          ))}
          <a href="mailto:hello@scriptshiftwa.com.au"
            style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>
            hello@scriptshiftwa.com.au
          </a>
        </div>
        <p style={{ color: C.slateL, fontSize: 11, marginTop: 16 }}>
          © {new Date().getFullYear()} ScriptShift Technologies Pty Ltd. All rights reserved.
        </p>
      </footer>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={(u) => { setUser(u); setShowAuth(false); }}
        />
      )}
      {showPost && user && (
        <PostShiftModal
          user={user}
          onClose={() => setShowPost(false)}
          onPosted={loadShifts}
        />
      )}

      {/* Legal modals */}
      {legal === "terms" && (
        <LegalModal title="Terms of Service" onClose={() => setLegal(null)}>
          <p><strong>ScriptShift Technologies Pty Ltd</strong> (ABN 21 698 500 542), trading as ScriptShift WA.</p>
          <br />
          <p>By using ScriptShift WA you agree to these terms. This platform connects pharmacy owners with locum pharmacists in Western Australia. All shift listings are posted by pharmacy owners and ScriptShift WA does not employ pharmacists. Payment is processed securely via Stripe. Listing fees are non-refundable except as stated in our Refund Policy. Users must hold a current AHPRA registration to practise as a pharmacist. ScriptShift WA is not responsible for employment relationships formed through the platform. All pricing is in AUD and inclusive of GST (10%). For queries, contact hello@scriptshiftwa.com.au.</p>
        </LegalModal>
      )}
      {legal === "privacy" && (
        <LegalModal title="Privacy Policy" onClose={() => setLegal(null)}>
          <p>ScriptShift Technologies Pty Ltd collects personal information including name, email, AHPRA number, and phone number to facilitate platform registration and shift matching. Your data is stored securely on Supabase (Sydney region) and is never sold to third parties. Payment information is handled entirely by Stripe and is not stored on our servers. You may request deletion of your account and data by emailing hello@scriptshiftwa.com.au. We comply with the Australian Privacy Act 1988.</p>
        </LegalModal>
      )}
      {legal === "refund" && (
        <LegalModal title="Refund Policy" onClose={() => setLegal(null)}>
          <p>Listing fees paid to ScriptShift WA are generally non-refundable once a shift has been published. If a shift listing cannot be fulfilled due to a technical error on our part, a full refund will be issued within 5–10 business days. Bundle listings are non-refundable after any shift in the bundle has been posted. To request a refund, contact hello@scriptshiftwa.com.au within 7 days of purchase with your order reference.</p>
        </LegalModal>
      )}
    </>
  );
}
