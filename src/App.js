/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPA_URL = "https://ageszwwbtawphfmtmrfj.supabase.co";
const SUPA_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

function getSupabase() {
  if (typeof window !== "undefined" && window._supabaseClient) {
    return window._supabaseClient;
  }
  try {
    var mod = require("@supabase/supabase-js");
    var client = mod.createClient(SUPA_URL, SUPA_KEY);
    if (typeof window !== "undefined") window._supabaseClient = client;
    return client;
  } catch (e) {
    console.warn("Supabase not available:", e.message);
    return null;
  }
}

// ─── Stripe Payment Links ─────────────────────────────────────────────────────
var SHIFT_LINKS = {
  standard:  "https://buy.stripe.com/bJebIUffv5u6fWK0Wva7C08",
  evening:   "https://buy.stripe.com/00w28kgjz7Ce8uicFda7C09",
  weekend:   "https://buy.stripe.com/aFa00cd7naOq7qedJha7C0c",
  emergency: "https://buy.stripe.com/8x26oA6IZ8Gi8ui9t1a7C0b",
};
var BUNDLE_LINKS = {
  three: "https://buy.stripe.com/9B66oA7N38Gi4e25cLa7C0d",
  five:  "https://buy.stripe.com/5kQcMY8R7bSu5i6bB9a7C0a",
  eight: "https://buy.stripe.com/4gM3co4AR6yacKydJha7C07",
};
var PRICES = { standard: 9, evening: 9, weekend: 14, emergency: 19 };
var BUNDLE_PRICES = { three: 20, five: 30, eight: 45 };

var REGIONS = [
  "Perth Metro - North",
  "Perth Metro - South",
  "Perth Metro - East",
  "Perth Metro - CBD",
  "Pilbara",
  "Kimberley",
  "Goldfields",
  "Wheatbelt",
  "South West",
  "Great Southern",
];

// ─── Design tokens (gold/dark premium) ───────────────────────────────────────
var bg      = "#0E0F14";
var bgCard  = "#16181F";
var bgHero  = "#13151C";
var gold    = "#F0A500";
var goldLt  = "#F7C948";
var offwhite= "#E8E6DF";
var subtle  = "#2A2C35";
var border  = "#2A2C35";
var muted   = "#6B6F7E";
var mutedLt = "#9295A3";
var red     = "#E05252";
var green   = "#3DBE7A";

// ─── Style helpers ────────────────────────────────────────────────────────────
var inputSt = {
  width: "100%",
  background: subtle,
  border: "1px solid " + border,
  borderRadius: 6,
  color: offwhite,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

var cardSt = {
  background: bgCard,
  border: "1px solid " + border,
  borderRadius: 12,
  padding: 20,
};

function btn(bg2, fg, extra) {
  return Object.assign({
    background: bg2,
    color: fg || offwhite,
    border: "none",
    borderRadius: 6,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    transition: "opacity .15s, transform .1s",
  }, extra || {});
}

var lbl = {
  fontSize: 11,
  color: muted,
  marginBottom: 5,
  display: "block",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 1,
};

var field = { marginBottom: 16 };

// ─── Shift type config ────────────────────────────────────────────────────────
var TYPE_CONFIG = {
  standard:  { color: "#3DBE7A", label: "Standard" },
  evening:   { color: "#8B7CF6", label: "Evening" },
  weekend:   { color: gold,      label: "Weekend" },
  emergency: { color: "#E05252", label: "Emergency" },
};

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge(props) {
  var cfg = TYPE_CONFIG[props.type] || { color: muted, label: props.type };
  return React.createElement("span", {
    style: {
      background: cfg.color + "18",
      color: cfg.color,
      border: "1px solid " + cfg.color + "40",
      borderRadius: 4,
      padding: "3px 10px",
      fontSize: 10,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    }
  }, cfg.label);
}

// ─── Legal Modal ──────────────────────────────────────────────────────────────
function LegalModal(props) {
  return React.createElement("div", {
    style: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }
  },
    React.createElement("div", {
      style: {
        background: bgCard, border: "1px solid " + border, borderRadius: 16,
        maxWidth: 640, width: "100%", maxHeight: "80vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }
    },
      React.createElement("div", {
        style: {
          padding: "20px 28px", borderBottom: "1px solid " + border,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }
      },
        React.createElement("h3", { style: { margin: 0, color: offwhite, fontSize: 17, fontWeight: 700 } }, props.title),
        React.createElement("button", { onClick: props.onClose, style: btn(subtle, mutedLt, { padding: "6px 14px", fontSize: 13 }) }, "Close")
      ),
      React.createElement("div", {
        style: { padding: "24px 28px", overflowY: "auto", color: mutedLt, fontSize: 13, lineHeight: 1.9 }
      }, props.children)
    )
  );
}

// ─── Shift Card ───────────────────────────────────────────────────────────────
function ShiftCard(props) {
  var shift = props.shift;
  var typeKey = (shift.shift_type || "standard").toLowerCase().replace(/\s+/g, "");
  var link = SHIFT_LINKS[typeKey] || "https://scriptshiftwa.com.au";
  var price = PRICES[typeKey] || 9;
  var cfg = TYPE_CONFIG[typeKey] || TYPE_CONFIG.standard;

  return React.createElement("div", {
    style: Object.assign({}, cardSt, {
      display: "flex", flexDirection: "column", gap: 14,
      borderLeft: "3px solid " + cfg.color,
    })
  },
    React.createElement("div", {
      style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }
    },
      React.createElement("div", null,
        React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: offwhite, marginBottom: 3 } },
          shift.pharmacy_name || "Pharmacy"
        ),
        React.createElement("div", { style: { color: muted, fontSize: 12 } },
          "📍 " + (shift.suburb || "Perth") + "  ·  " + (shift.region || "Perth Metro")
        )
      ),
      React.createElement(Badge, { type: typeKey })
    ),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 } },
      [
        ["📅", "Date",     shift.shift_date || "TBC"],
        ["🕐", "Hours",    (shift.start_time || "08:00") + " – " + (shift.end_time || "17:00")],
        ["💰", "Rate",     "$" + (shift.rate || "60") + "/hr"],
        ["🖥",  "Software", shift.software || "Fred / Minfos"],
      ].map(function(pill) {
        return React.createElement("div", {
          key: pill[1],
          style: { background: subtle, borderRadius: 8, padding: "8px 10px" }
        },
          React.createElement("div", { style: { fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 } },
            pill[0] + " " + pill[1]
          ),
          React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: offwhite } }, pill[2])
        );
      })
    ),
    shift.notes ? React.createElement("div", {
      style: { background: subtle, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: mutedLt, fontStyle: "italic" }
    }, shift.notes) : null,
    React.createElement("button", {
      onClick: function() { window.open(link, "_blank", "noreferrer"); },
      style: btn(gold, bg, { width: "100%", padding: "11px 0", fontWeight: 700 }),
    }, "Apply — $" + price + " AUD incl. GST")
  );
}

// ─── Post Shift Modal ─────────────────────────────────────────────────────────
function PostShiftModal(props) {
  var user = props.user;
  var onClose = props.onClose;
  var onPosted = props.onPosted;

  var [step, setStep] = useState(1);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [bundle, setBundle] = useState("none");
  var [form, setForm] = useState({
    pharmacy_name: "", suburb: "", region: REGIONS[0],
    shift_type: "standard", shift_date: "",
    start_time: "08:00", end_time: "17:00",
    software: "", rate: "", notes: "",
  });

  function setField(key) {
    return function(e) {
      setForm(function(f) { var n = Object.assign({}, f); n[key] = e.target.value; return n; });
    };
  }

  function handleSubmit() {
    if (!form.pharmacy_name || !form.shift_date) { setError("Pharmacy name and date required."); return; }
    setLoading(true); setError("");
    var sb = getSupabase();
    if (!sb) { setLoading(false); setStep(2); return; }
    sb.from("shifts").insert([Object.assign({}, form, {
      owner_id: user.id, owner_email: user.email, status: "pending_payment",
    })]).then(function(r) {
      setLoading(false);
      if (r.error) { setError(r.error.message); } else { setStep(2); }
    });
  }

  var payLink = bundle === "none"
    ? (SHIFT_LINKS[form.shift_type] || "https://scriptshiftwa.com.au")
    : (BUNDLE_LINKS[bundle] || "https://scriptshiftwa.com.au");
  var payAmount = bundle === "none"
    ? (PRICES[form.shift_type] || 9)
    : (BUNDLE_PRICES[bundle] || 20);

  var bundleOpts = [
    { key: "none",  label: "Single Shift",  price: PRICES[form.shift_type] || 9,  desc: "One shift listing" },
    { key: "three", label: "3-Day Bundle",  price: 20, desc: "Save vs 3 singles" },
    { key: "five",  label: "5-Day Bundle",  price: 30, desc: "Most popular" },
    { key: "eight", label: "8-Day Bundle",  price: 45, desc: "Best value" },
  ];

  return React.createElement("div", {
    style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }
  },
    React.createElement("div", {
      style: { background: bgCard, border: "1px solid " + border, borderRadius: 16, maxWidth: 560, width: "100%", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }
    },
      React.createElement("div", {
        style: { padding: "18px 24px", borderBottom: "1px solid " + border, display: "flex", justifyContent: "space-between", alignItems: "center" }
      },
        React.createElement("h3", { style: { margin: 0, color: offwhite, fontWeight: 700 } }, step === 1 ? "Post a Shift" : "Payment"),
        React.createElement("button", { onClick: onClose, style: btn(subtle, mutedLt, { padding: "6px 14px", fontSize: 13 }) }, "Close")
      ),
      React.createElement("div", { style: { padding: "20px 24px", overflowY: "auto", flex: 1 } },
        step === 1
          ? React.createElement("div", null,
              React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
                React.createElement("div", { style: Object.assign({}, field, { gridColumn: "1/-1" }) },
                  React.createElement("label", { style: lbl }, "Pharmacy Name *"),
                  React.createElement("input", { style: inputSt, value: form.pharmacy_name, onChange: setField("pharmacy_name"), placeholder: "e.g. Karratha Pharmacy" })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Suburb"),
                  React.createElement("input", { style: inputSt, value: form.suburb, onChange: setField("suburb"), placeholder: "e.g. Joondalup" })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Region"),
                  React.createElement("select", { style: inputSt, value: form.region, onChange: setField("region") },
                    REGIONS.map(function(r) { return React.createElement("option", { key: r, value: r }, r); })
                  )
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Shift Type"),
                  React.createElement("select", { style: inputSt, value: form.shift_type, onChange: setField("shift_type") },
                    React.createElement("option", { value: "standard" },  "Standard ($9)"),
                    React.createElement("option", { value: "evening" },   "Evening ($9)"),
                    React.createElement("option", { value: "weekend" },   "Weekend ($14)"),
                    React.createElement("option", { value: "emergency" }, "Emergency ($19)")
                  )
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Date *"),
                  React.createElement("input", { style: inputSt, type: "date", value: form.shift_date, onChange: setField("shift_date") })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Software"),
                  React.createElement("input", { style: inputSt, value: form.software, onChange: setField("software"), placeholder: "Fred, Minfos, Z..." })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Start Time"),
                  React.createElement("input", { style: inputSt, type: "time", value: form.start_time, onChange: setField("start_time") })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "End Time"),
                  React.createElement("input", { style: inputSt, type: "time", value: form.end_time, onChange: setField("end_time") })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Hourly Rate ($)"),
                  React.createElement("input", { style: inputSt, type: "number", value: form.rate, onChange: setField("rate"), placeholder: "e.g. 60" })
                ),
                React.createElement("div", { style: Object.assign({}, field, { gridColumn: "1/-1" }) },
                  React.createElement("label", { style: lbl }, "Notes"),
                  React.createElement("textarea", { style: Object.assign({}, inputSt, { minHeight: 72, resize: "vertical" }), value: form.notes, onChange: setField("notes"), placeholder: "Any special requirements..." })
                )
              ),
              error ? React.createElement("p", { style: { color: red, fontSize: 13, marginBottom: 12 } }, error) : null,
              React.createElement("button", { onClick: handleSubmit, disabled: loading, style: btn(gold, bg, { width: "100%", padding: 13, fontWeight: 700 }) },
                loading ? "Saving..." : "Continue to Payment →"
              )
            )
          : React.createElement("div", null,
              React.createElement("p", { style: { color: mutedLt, fontSize: 13, marginBottom: 16 } },
                "Shift saved. Choose a listing package and pay via Stripe to go live."
              ),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 } },
                bundleOpts.map(function(opt) {
                  return React.createElement("div", {
                    key: opt.key,
                    onClick: function() { setBundle(opt.key); },
                    style: Object.assign({}, cardSt, {
                      cursor: "pointer", padding: "14px 18px",
                      borderColor: bundle === opt.key ? gold : border,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    })
                  },
                    React.createElement("div", null,
                      React.createElement("div", { style: { fontWeight: 700, color: offwhite, fontSize: 14 } }, opt.label),
                      React.createElement("div", { style: { fontSize: 12, color: muted } }, opt.desc)
                    ),
                    React.createElement("div", { style: { fontWeight: 800, color: gold, fontSize: 20 } }, "$" + opt.price)
                  );
                })
              ),
              React.createElement("button", {
                onClick: function() { window.open(payLink, "_blank", "noreferrer"); },
                style: btn(gold, bg, { width: "100%", padding: 13, fontWeight: 700 }),
              }, "Pay $" + payAmount + " AUD via Stripe →"),
              React.createElement("button", {
                onClick: function() { onPosted(); onClose(); },
                style: btn("transparent", muted, { width: "100%", padding: 10, marginTop: 8, border: "1px solid " + border }),
              }, "I have already paid")
            )
      )
    )
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal(props) {
  var onClose = props.onClose;
  var onAuth = props.onAuth;
  var [mode, setMode] = useState("login");
  var [step, setStep] = useState(1);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [termsOk, setTermsOk] = useState(false);
  var [form, setForm] = useState({ email: "", password: "", full_name: "", ahpra: "", phone: "", role: "pharmacist" });

  function setField(key) {
    return function(e) { setForm(function(f) { var n = Object.assign({}, f); n[key] = e.target.value; return n; }); };
  }

  function handleLogin() {
    setLoading(true); setError("");
    var sb = getSupabase();
    if (!sb) { setLoading(false); setError("Connection error. Please check your internet."); return; }
    sb.auth.signInWithPassword({ email: form.email, password: form.password }).then(function(r) {
      setLoading(false);
      if (r.error) { setError(r.error.message); } else { onAuth(r.data.user); }
    });
  }

  function handleRegStep() {
    if (step === 1) {
      if (!form.email || !form.password) { setError("Email and password required."); return; }
      setStep(2); setError(""); return;
    }
    if (step === 2) {
      if (!form.full_name || !form.ahpra) { setError("Full name and AHPRA number required."); return; }
      setStep(3); setError(""); return;
    }
    if (!termsOk) { setError("Please accept the Terms & Conditions."); return; }
    setLoading(true); setError("");
    var sb = getSupabase();
    if (!sb) { setLoading(false); setError("Connection error."); return; }
    sb.auth.signUp({ email: form.email, password: form.password }).then(function(r) {
      if (r.error) { setLoading(false); setError(r.error.message); return; }
      var u = r.data.user;
      if (u) {
        sb.from("profiles").upsert({ id: u.id, full_name: form.full_name, ahpra: form.ahpra, phone: form.phone, role: form.role })
          .then(function() { setLoading(false); onAuth(u); });
      } else { setLoading(false); onAuth(null); }
    });
  }

  return React.createElement("div", {
    style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }
  },
    React.createElement("div", {
      style: { background: bgCard, border: "1px solid " + border, borderRadius: 16, maxWidth: 420, width: "100%" }
    },
      // Tabs header
      React.createElement("div", {
        style: { padding: "18px 24px", borderBottom: "1px solid " + border, display: "flex", justifyContent: "space-between", alignItems: "center" }
      },
        React.createElement("div", { style: { display: "flex", gap: 24 } },
          ["login", "register"].map(function(m) {
            return React.createElement("button", {
              key: m,
              onClick: function() { setMode(m); setStep(1); setError(""); },
              style: {
                background: "transparent", border: "none",
                borderBottom: mode === m ? "2px solid " + gold : "2px solid transparent",
                color: mode === m ? gold : muted,
                fontWeight: 700, cursor: "pointer", fontSize: 14, padding: "4px 0", fontFamily: "inherit",
              }
            }, m === "login" ? "Sign In" : "Register");
          })
        ),
        React.createElement("button", { onClick: onClose, style: btn(subtle, mutedLt, { padding: "6px 14px", fontSize: 13 }) }, "Close")
      ),
      React.createElement("div", { style: { padding: 24 } },
        mode === "login"
          ? React.createElement("div", null,
              React.createElement("div", { style: field },
                React.createElement("label", { style: lbl }, "Email"),
                React.createElement("input", { style: inputSt, type: "email", value: form.email, onChange: setField("email") })
              ),
              React.createElement("div", { style: field },
                React.createElement("label", { style: lbl }, "Password"),
                React.createElement("input", { style: inputSt, type: "password", value: form.password, onChange: setField("password") })
              ),
              error ? React.createElement("p", { style: { color: red, fontSize: 13, marginBottom: 12 } }, error) : null,
              React.createElement("button", { onClick: handleLogin, disabled: loading, style: btn(gold, bg, { width: "100%", padding: 13, fontWeight: 700 }) },
                loading ? "Signing in..." : "Sign In"
              )
            )
          : React.createElement("div", null,
              // Progress bar
              React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 24 } },
                ["Account", "Details", "Confirm"].map(function(s, i) {
                  return React.createElement("div", { key: s, style: { flex: 1 } },
                    React.createElement("div", { style: { height: 2, borderRadius: 2, background: i + 1 <= step ? gold : subtle, marginBottom: 4 } }),
                    React.createElement("div", { style: { fontSize: 10, color: i + 1 <= step ? gold : muted, textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 } }, s)
                  );
                })
              ),
              step === 1 ? React.createElement("div", null,
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "I am a"),
                  React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 4 } },
                    ["pharmacist", "owner"].map(function(r) {
                      return React.createElement("button", {
                        key: r,
                        onClick: function() { setForm(function(f) { return Object.assign({}, f, { role: r }); }); },
                        style: btn(form.role === r ? gold : subtle, form.role === r ? bg : muted, { flex: 1, padding: 10, fontWeight: 700 }),
                      }, r === "pharmacist" ? "Pharmacist" : "Pharmacy Owner");
                    })
                  )
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Email"),
                  React.createElement("input", { style: inputSt, type: "email", value: form.email, onChange: setField("email") })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Password"),
                  React.createElement("input", { style: inputSt, type: "password", value: form.password, onChange: setField("password") })
                )
              ) : null,
              step === 2 ? React.createElement("div", null,
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Full Name *"),
                  React.createElement("input", { style: inputSt, value: form.full_name, onChange: setField("full_name"), placeholder: "As per AHPRA registration" })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "AHPRA Number *"),
                  React.createElement("input", { style: inputSt, value: form.ahpra, onChange: setField("ahpra"), placeholder: "PHAxxxxxxxxx" })
                ),
                React.createElement("div", { style: field },
                  React.createElement("label", { style: lbl }, "Mobile Phone"),
                  React.createElement("input", { style: inputSt, type: "tel", value: form.phone, onChange: setField("phone"), placeholder: "04xx xxx xxx" })
                )
              ) : null,
              step === 3 ? React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontSize: 44, marginBottom: 12 } }, "✅"),
                React.createElement("h4", { style: { color: offwhite, margin: "0 0 8px", fontWeight: 700 } }, "Almost there!"),
                React.createElement("p", { style: { color: mutedLt, fontSize: 13, marginBottom: 20, lineHeight: 1.6 } },
                  "Review and accept the Terms & Conditions to create your account."
                ),
                React.createElement("label", {
                  style: { display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", textAlign: "left", marginBottom: 16 }
                },
                  React.createElement("input", {
                    type: "checkbox", checked: termsOk,
                    onChange: function(e) { setTermsOk(e.target.checked); },
                    style: { marginTop: 2, width: 16, height: 16, accentColor: gold },
                  }),
                  React.createElement("span", { style: { fontSize: 13, color: mutedLt, lineHeight: 1.6 } },
                    "I agree to the ScriptShift WA Terms of Service, Privacy Policy, and Refund Policy."
                  )
                ),
                React.createElement("p", { style: { color: muted, fontSize: 11 } },
                  "ScriptShift Technologies Pty Ltd (ABN 21 698 500 542)"
                )
              ) : null,
              error ? React.createElement("p", { style: { color: red, fontSize: 13, margin: "8px 0" } }, error) : null,
              React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                step > 1 ? React.createElement("button", {
                  onClick: function() { setStep(function(s) { return s - 1; }); },
                  style: btn(subtle, offwhite, { flex: 1, padding: 12 }),
                }, "Back") : null,
                React.createElement("button", {
                  onClick: handleRegStep, disabled: loading,
                  style: btn(gold, bg, { flex: 2, padding: 12, fontWeight: 700 }),
                }, loading ? "Creating..." : step < 3 ? "Next →" : "Create Account")
              )
            )
      )
    )
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  var [user, setUser]           = useState(null);
  var [shifts, setShifts]       = useState([]);
  var [liveCount, setLiveCount] = useState(0);
  var [loading, setLoading]     = useState(true);
  var [tab, setTab]             = useState("browse"); // browse | post | profile
  var [showAuth, setShowAuth]   = useState(false);
  var [showPost, setShowPost]   = useState(false);
  var [legal, setLegal]         = useState(null);
  var [filterRegion, setFilterRegion] = useState("all");
  var [filterType, setFilterType]     = useState("all");

  useEffect(function() {
    var sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    sb.auth.getSession().then(function(res) {
      setUser(res.data && res.data.session ? res.data.session.user : null);
    });
    var result = sb.auth.onAuthStateChange(function(e, session) {
      setUser(session ? session.user : null);
    });
    return function() {
      if (result.data && result.data.subscription) result.data.subscription.unsubscribe();
    };
  }, []);

  var loadShifts = useCallback(function() {
    setLoading(true);
    var sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    sb.from("shifts").select("*").eq("status", "active").order("shift_date", { ascending: true })
      .then(function(res) {
        var data = res.data || [];
        setShifts(data); setLiveCount(data.length); setLoading(false);
      });
  }, []);

  useEffect(function() { loadShifts(); }, [loadShifts]);

  useEffect(function() {
    var sb = getSupabase();
    if (!sb) return;
    var ch = sb.channel("shifts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, loadShifts)
      .subscribe();
    return function() { sb.removeChannel(ch); };
  }, [loadShifts]);

  function signOut() {
    var sb = getSupabase();
    if (sb) sb.auth.signOut();
    setUser(null);
  }

  var isMetro = function(r) { return (r || "").toLowerCase().indexOf("perth") !== -1; };

  var filtered = shifts.filter(function(s) {
    if (filterRegion === "metro" && !isMetro(s.region)) return false;
    if (filterRegion === "regional" && isMetro(s.region)) return false;
    if (filterType !== "all" && s.shift_type !== filterType) return false;
    return true;
  });

  // Global CSS
  var css = [
    "@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@500&display=swap');",
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    "body { background: " + bg + "; color: " + offwhite + "; font-family: 'Geist', sans-serif; -webkit-font-smoothing: antialiased; }",
    "::-webkit-scrollbar { width: 5px; }",
    "::-webkit-scrollbar-track { background: " + bg + "; }",
    "::-webkit-scrollbar-thumb { background: " + subtle + "; border-radius: 3px; }",
    "select option { background: " + bgCard + "; }",
    "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }",
    "@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }",
    "input[type=date]::-webkit-calendar-picker-indicator, input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.5); }",
    ".nav-link { background: transparent; border: none; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; padding: 4px 0; letter-spacing: 0.2px; transition: color .15s; }",
    ".shift-card-wrap { animation: fadeUp .35s ease both; }",
    ".filter-pill { background: transparent; border: 1px solid " + border + "; border-radius: 20px; color: " + muted + "; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; padding: 5px 14px; transition: all .15s; }",
    ".filter-pill.active { background: " + gold + "; border-color: " + gold + "; color: " + bg + "; }",
  ].join("\n");

  var pricingItems = [
    { label: "Standard",  price: 9,  icon: "☀️",  sub: "Mon–Fri business hours",   color: "#3DBE7A" },
    { label: "Evening",   price: 9,  icon: "🌙",  sub: "After-hours weekday",       color: "#8B7CF6" },
    { label: "Weekend",   price: 14, icon: "📅",  sub: "Saturday or Sunday",        color: gold },
    { label: "Emergency", price: 19, icon: "🚨",  sub: "Same-day urgent cover",     color: "#E05252" },
    { label: "3-Day Bundle", price: 20, icon: "📦", sub: "Save vs 3 singles",       color: gold },
    { label: "5-Day Bundle", price: 30, icon: "⭐", sub: "Most popular",            color: gold },
    { label: "8-Day Bundle", price: 45, icon: "💎", sub: "Best value",              color: gold },
  ];

  return React.createElement(React.Fragment, null,
    React.createElement("style", null, css),

    // ── Navbar ──────────────────────────────────────────────────────────────
    React.createElement("nav", {
      style: {
        background: bgCard, borderBottom: "1px solid " + border,
        padding: "0 32px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 80,
      }
    },
      // Left: logo
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } },
        React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8 } },
          React.createElement("span", {
            style: { fontFamily: "'Instrument Serif', serif", fontSize: 22, color: offwhite, fontWeight: 400, letterSpacing: -0.5 }
          }, "ScriptShift"),
          React.createElement("span", {
            style: { fontSize: 10, fontWeight: 800, color: muted, letterSpacing: 2, textTransform: "uppercase" }
          }, "Western Australia")
        ),
        React.createElement("div", {
          style: { display: "flex", alignItems: "center", gap: 6, background: subtle, borderRadius: 20, padding: "3px 10px", marginLeft: 4 }
        },
          React.createElement("div", { style: { width: 6, height: 6, borderRadius: "50%", background: green, animation: "pulse 2s infinite" } }),
          React.createElement("span", { style: { fontSize: 11, color: muted, fontFamily: "'Geist Mono', monospace" } },
            liveCount + " live"
          )
        )
      ),
      // Center: nav tabs
      React.createElement("div", { style: { display: "flex", gap: 28 } },
        [
          { id: "browse", label: "Browse Shifts" },
          { id: "post",   label: "Post a Shift" },
          { id: "pricing", label: "Pricing" },
          user ? { id: "profile", label: user.email ? user.email.split("@")[0] : "Account" } : null,
        ].filter(Boolean).map(function(t) {
          return React.createElement("button", {
            key: t.id,
            className: "nav-link",
            onClick: function() {
              if (t.id === "post") { user ? setShowPost(true) : setShowAuth(true); }
              else { setTab(t.id); }
            },
            style: {
              color: tab === t.id ? gold : mutedLt,
              borderBottom: tab === t.id ? "2px solid " + gold : "2px solid transparent",
              paddingBottom: 4,
            }
          }, t.label);
        })
      ),
      // Right: auth
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
        user
          ? React.createElement("button", { onClick: signOut, style: btn(subtle, mutedLt, { fontSize: 13, padding: "8px 16px" }) }, "Sign Out")
          : React.createElement("button", { onClick: function() { setShowAuth(true); }, style: btn(gold, bg, { fontWeight: 700, padding: "8px 20px" }) }, "Sign In / Register")
      )
    ),

    // ── Hero ─────────────────────────────────────────────────────────────────
    tab === "browse" ? React.createElement("div", {
      style: {
        background: bgHero,
        borderBottom: "1px solid " + border,
        padding: "56px 32px 48px",
      }
    },
      React.createElement("div", { style: { maxWidth: 900, margin: "0 auto" } },
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32 } },
          // Left text
          React.createElement("div", { style: { flex: "1 1 400px" } },
            React.createElement("div", {
              style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }
            },
              React.createElement("div", { style: { width: 8, height: 8, background: gold, borderRadius: 2, transform: "rotate(45deg)" } }),
              React.createElement("span", { style: { fontSize: 11, fontWeight: 800, color: gold, letterSpacing: 2, textTransform: "uppercase" } },
                "Real-Time · Western Australia"
              )
            ),
            React.createElement("h1", {
              style: { fontFamily: "'Instrument Serif', serif", fontSize: "clamp(30px,5vw,50px)", fontWeight: 400, lineHeight: 1.15, marginBottom: 16, color: offwhite }
            },
              "Connect pharmacies",
              React.createElement("br"),
              "with ",
              React.createElement("em", { style: { color: gold, fontStyle: "italic" } }, "great pharmacists")
            ),
            React.createElement("p", { style: { color: mutedLt, fontSize: 15, lineHeight: 1.7, maxWidth: 460 } },
              "Instant shift matching for locum pharmacists and pharmacy owners across Perth Metro, Pilbara, Kimberley and the Goldfields."
            )
          ),
          // Right: live counter box
          React.createElement("div", {
            style: {
              background: subtle, borderRadius: 12, padding: "24px 32px",
              textAlign: "center", border: "1px solid " + border, minWidth: 140,
            }
          },
            React.createElement("div", {
              style: { fontSize: 48, fontWeight: 800, color: offwhite, fontFamily: "'Geist Mono', monospace", lineHeight: 1 }
            }, liveCount),
            React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 6 } },
              "Live Shifts"
            )
          )
        )
      )
    ) : null,

    // ── Filter pills (browse tab) ─────────────────────────────────────────────
    tab === "browse" ? React.createElement("div", {
      style: { borderBottom: "1px solid " + border, padding: "14px 32px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        React.createElement("span", { style: { fontSize: 10, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1 } }, "Region"),
        ["all", "metro", "regional"].map(function(r) {
          return React.createElement("button", {
            key: r,
            className: "filter-pill" + (filterRegion === r ? " active" : ""),
            onClick: function() { setFilterRegion(r); },
          }, r === "all" ? "All" : r === "metro" ? "Metro" : "Regional");
        })
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        React.createElement("span", { style: { fontSize: 10, fontWeight: 800, color: muted, textTransform: "uppercase", letterSpacing: 1 } }, "Type"),
        ["all", "emergency", "standard", "weekend", "evening"].map(function(t) {
          return React.createElement("button", {
            key: t,
            className: "filter-pill" + (filterType === t ? " active" : ""),
            onClick: function() { setFilterType(t); },
          }, t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1));
        })
      ),
      user ? React.createElement("button", {
        onClick: function() { setShowPost(true); },
        style: btn(gold, bg, { marginLeft: "auto", padding: "8px 20px", fontWeight: 700, fontSize: 13 }),
      }, "+ Post a Shift") : null
    ) : null,

    // ── Shift grid ────────────────────────────────────────────────────────────
    tab === "browse" ? React.createElement("main", {
      style: { padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }
    },
      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: "80px 0", color: muted } },
            React.createElement("div", { style: { fontSize: 28, marginBottom: 12 } }, "⏳"),
            React.createElement("p", null, "Loading shifts...")
          )
        : filtered.length === 0
          ? React.createElement("div", { style: { textAlign: "center", padding: "80px 0" } },
              React.createElement("div", { style: { fontSize: 56, marginBottom: 16 } }, "💊"),
              React.createElement("h3", {
                style: { fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: offwhite, marginBottom: 8 }
              }, "No shifts posted yet"),
              React.createElement("p", { style: { color: muted, marginBottom: 28, fontSize: 14 } },
                "ScriptShift WA is open for business. Be the first pharmacy to post."
              ),
              React.createElement("button", {
                onClick: function() { user ? setShowPost(true) : setShowAuth(true); },
                style: btn(gold, bg, { padding: "12px 32px", fontWeight: 700 }),
              }, "Post the First Shift →")
            )
          : React.createElement("div", {
              style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }
            },
              filtered.map(function(s, i) {
                return React.createElement("div", { key: s.id, className: "shift-card-wrap", style: { animationDelay: (i * 0.05) + "s" } },
                  React.createElement(ShiftCard, { shift: s })
                );
              })
            )
    ) : null,

    // ── Pricing tab ───────────────────────────────────────────────────────────
    tab === "pricing" ? React.createElement("div", { style: { padding: "48px 32px", maxWidth: 900, margin: "0 auto" } },
      React.createElement("h2", {
        style: { fontFamily: "'Instrument Serif', serif", fontSize: 36, fontWeight: 400, color: offwhite, marginBottom: 8, textAlign: "center" }
      }, "Transparent Listing Fees"),
      React.createElement("p", { style: { color: muted, fontSize: 14, textAlign: "center", marginBottom: 40 } },
        "All prices GST-inclusive. Secure payment via Stripe."
      ),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 } },
        pricingItems.map(function(item) {
          return React.createElement("div", {
            key: item.label,
            style: Object.assign({}, cardSt, { textAlign: "center", padding: "24px 16px", borderTop: "2px solid " + item.color }),
          },
            React.createElement("div", { style: { fontSize: 28, marginBottom: 10 } }, item.icon),
            React.createElement("div", { style: { fontWeight: 700, color: offwhite, fontSize: 14, marginBottom: 8 } }, item.label + " Shift"),
            React.createElement("div", { style: { fontWeight: 800, color: item.color, fontSize: 28, marginBottom: 6 } }, "$" + item.price),
            React.createElement("div", { style: { fontSize: 11, color: muted } }, item.sub)
          );
        })
      )
    ) : null,

    // ── Footer ────────────────────────────────────────────────────────────────
    React.createElement("footer", {
      style: { background: bgCard, borderTop: "1px solid " + border, padding: "32px", marginTop: 40 }
    },
      React.createElement("div", { style: { maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 } },
        React.createElement("div", null,
          React.createElement("div", { style: { fontFamily: "'Instrument Serif', serif", fontSize: 18, color: offwhite, marginBottom: 4 } }, "ScriptShift WA"),
          React.createElement("div", { style: { fontSize: 12, color: muted } }, "ScriptShift Technologies Pty Ltd  ·  ABN 21 698 500 542")
        ),
        React.createElement("div", { style: { display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" } },
          [["Terms of Service", "terms"], ["Privacy Policy", "privacy"], ["Refund Policy", "refund"]].map(function(item) {
            return React.createElement("button", {
              key: item[1], onClick: function() { setLegal(item[1]); },
              style: { background: "transparent", border: "none", color: muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
            }, item[0]);
          }),
          React.createElement("button", {
            onClick: function() { window.location.href = "mailto:hello@scriptshiftwa.com.au"; },
            style: { background: "transparent", border: "none", color: muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
          }, "hello@scriptshiftwa.com.au")
        )
      ),
      React.createElement("div", { style: { maxWidth: 900, margin: "12px auto 0", color: "#3A3C47", fontSize: 11 } },
        "© " + new Date().getFullYear() + " ScriptShift Technologies Pty Ltd. All rights reserved."
      )
    ),

    // ── Modals ────────────────────────────────────────────────────────────────
    showAuth ? React.createElement(AuthModal, {
      onClose: function() { setShowAuth(false); },
      onAuth: function(u) { setUser(u); setShowAuth(false); },
    }) : null,

    showPost && user ? React.createElement(PostShiftModal, {
      user: user, onClose: function() { setShowPost(false); }, onPosted: loadShifts,
    }) : null,

    legal === "terms" ? React.createElement(LegalModal, { title: "Terms of Service", onClose: function() { setLegal(null); } },
      React.createElement("p", null, React.createElement("strong", null, "ScriptShift Technologies Pty Ltd"), " (ABN 21 698 500 542), trading as ScriptShift WA."),
      React.createElement("br"),
      React.createElement("p", null, "By using ScriptShift WA you agree to these terms. This platform connects pharmacy owners with locum pharmacists in Western Australia. ScriptShift WA does not employ pharmacists. Payment is processed securely via Stripe. Listing fees are non-refundable except as stated in our Refund Policy. Users must hold a current AHPRA registration to practise as a pharmacist. ScriptShift WA is not responsible for employment relationships formed through the platform. All pricing is in AUD and inclusive of GST. For queries contact hello@scriptshiftwa.com.au.")
    ) : null,

    legal === "privacy" ? React.createElement(LegalModal, { title: "Privacy Policy", onClose: function() { setLegal(null); } },
      React.createElement("p", null, "ScriptShift Technologies Pty Ltd collects personal information including name, email, AHPRA number, and phone number to facilitate platform registration and shift matching. Your data is stored securely on Supabase (Sydney region) and is never sold to third parties. Payment information is handled entirely by Stripe and is not stored on our servers. You may request deletion of your account by emailing hello@scriptshiftwa.com.au. We comply with the Australian Privacy Act 1988.")
    ) : null,

    legal === "refund" ? React.createElement(LegalModal, { title: "Refund Policy", onClose: function() { setLegal(null); } },
      React.createElement("p", null, "Listing fees paid to ScriptShift WA are generally non-refundable once a shift has been published. If a listing cannot be fulfilled due to a technical error on our part, a full refund will be issued within 5 to 10 business days. Bundle listings are non-refundable after any shift in the bundle has been posted. To request a refund, contact hello@scriptshiftwa.com.au within 7 days of purchase with your order reference.")
    ) : null
  );
}
