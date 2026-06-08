/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";

// ─── Supabase (uses window.supabase if available, else graceful fallback) ────
const SUPA_URL = "https://ageszwwbtawphfmtmrfj.supabase.co";
const SUPA_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

function getSupabase() {
  if (typeof window !== "undefined" && window._supabaseClient) {
    return window._supabaseClient;
  }
  try {
    const { createClient } = require("@supabase/supabase-js");
    const client = createClient(SUPA_URL, SUPA_KEY);
    if (typeof window !== "undefined") window._supabaseClient = client;
    return client;
  } catch (e) {
    console.warn("Supabase not available:", e.message);
    return null;
  }
}

// ─── Stripe Payment Links ────────────────────────────────────────────────────
const SHIFT_LINKS = {
  standard:  "https://buy.stripe.com/bJebIUffv5u6fWK0Wva7C08",
  evening:   "https://buy.stripe.com/00w28kgjz7Ce8uicFda7C09",
  weekend:   "https://buy.stripe.com/aFa00cd7naOq7qedJha7C0c",
  emergency: "https://buy.stripe.com/8x26oA6IZ8Gi8ui9t1a7C0b",
};
const BUNDLE_LINKS = {
  three: "https://buy.stripe.com/9B66oA7N38Gi4e25cLa7C0d",
  five:  "https://buy.stripe.com/5kQcMY8R7bSu5i6bB9a7C0a",
  eight: "https://buy.stripe.com/4gM3co4AR6yacKydJha7C07",
};
const PRICES = { standard: 9, evening: 9, weekend: 14, emergency: 19 };
const BUNDLE_PRICES = { three: 20, five: 30, eight: 45 };

const REGIONS = [
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

// ─── Design Tokens ───────────────────────────────────────────────────────────
const navy   = "#0A1628";
const teal   = "#0D9488";
const tealLt = "#14B8A6";
const amber  = "#F59E0B";
const slate  = "#1E293B";
const slateM = "#334155";
const border = "#1E3A5F";
const surf   = "#112240";
const white  = "#F8FAFC";
const muted  = "#94A3B8";
const red    = "#EF4444";
const green  = "#22C55E";
const purple = "#8B5CF6";

// ─── Shared style objects ────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  background: slate,
  border: "1px solid " + border,
  borderRadius: 8,
  color: white,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const cardStyle = {
  background: surf,
  border: "1px solid " + border,
  borderRadius: 12,
  padding: 20,
};

function btnStyle(bg, fg, extra) {
  return Object.assign({
    background: bg,
    color: fg || "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "inherit",
    transition: "opacity .15s",
  }, extra || {});
}

const labelStyle = {
  fontSize: 12,
  color: muted,
  marginBottom: 4,
  display: "block",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const fieldStyle = { marginBottom: 14 };

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge(props) {
  var type = props.type || "standard";
  var map = {
    standard:  [teal,   "Standard"],
    evening:   [purple, "Evening"],
    weekend:   [amber,  "Weekend"],
    emergency: [red,    "Emergency"],
  };
  var entry = map[type] || [muted, type];
  var bg = entry[0];
  var lbl = entry[1];
  return React.createElement("span", {
    style: {
      background: bg + "22",
      color: bg,
      border: "1px solid " + bg + "44",
      borderRadius: 20,
      padding: "2px 10px",
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    }
  }, lbl);
}

// ─── InfoPill ────────────────────────────────────────────────────────────────
function InfoPill(props) {
  return React.createElement("div", {
    style: { background: slate, borderRadius: 8, padding: "8px 12px" }
  },
    React.createElement("div", {
      style: { fontSize: 10, color: muted, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }
    }, props.icon + " " + props.label),
    React.createElement("div", {
      style: { fontSize: 13, fontWeight: 600, color: white }
    }, props.value)
  );
}

// ─── Legal Modal ─────────────────────────────────────────────────────────────
function LegalModal(props) {
  return React.createElement("div", {
    style: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }
  },
    React.createElement("div", {
      style: {
        background: surf, border: "1px solid " + border, borderRadius: 16,
        maxWidth: 660, width: "100%", maxHeight: "80vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }
    },
      React.createElement("div", {
        style: {
          padding: "18px 24px", borderBottom: "1px solid " + border,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }
      },
        React.createElement("h3", { style: { margin: 0, color: white, fontSize: 18 } }, props.title),
        React.createElement("button", {
          onClick: props.onClose,
          style: btnStyle(slateM, muted, { padding: "6px 14px" })
        }, "Close")
      ),
      React.createElement("div", {
        style: { padding: "20px 24px", overflowY: "auto", color: muted, fontSize: 13, lineHeight: 1.8 }
      }, props.children)
    )
  );
}

// ─── Shift Card ──────────────────────────────────────────────────────────────
function ShiftCard(props) {
  var shift = props.shift;
  var typeKey = (shift.shift_type || "standard").toLowerCase().replace(/\s+/g, "");
  var link = SHIFT_LINKS[typeKey] || "https://scriptshiftwa.com.au/contact";
  var price = PRICES[typeKey] || 14;

  return React.createElement("div", {
    style: Object.assign({}, cardStyle, {
      display: "flex", flexDirection: "column", gap: 12,
    })
  },
    React.createElement("div", {
      style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }
    },
      React.createElement("div", null,
        React.createElement("div", {
          style: { fontWeight: 700, fontSize: 16, color: white, marginBottom: 4 }
        }, shift.pharmacy_name || "Pharmacy"),
        React.createElement("div", {
          style: { color: muted, fontSize: 13 }
        }, "📍 " + (shift.suburb || "Perth") + ", " + (shift.region || "Perth Metro"))
      ),
      React.createElement(Badge, { type: typeKey })
    ),
    React.createElement("div", {
      style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }
    },
      React.createElement(InfoPill, { icon: "📅", label: "Date", value: shift.shift_date || "TBC" }),
      React.createElement(InfoPill, { icon: "🕐", label: "Hours", value: (shift.start_time || "08:00") + " - " + (shift.end_time || "17:00") }),
      React.createElement(InfoPill, { icon: "💰", label: "Rate", value: "$" + (shift.rate || "60") + "/hr" }),
      React.createElement(InfoPill, { icon: "🖥", label: "Software", value: shift.software || "Fred/Minfos" })
    ),
    shift.notes ? React.createElement("div", {
      style: { background: slate, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: muted }
    }, shift.notes) : null,
    React.createElement("button", {
      onClick: function() { window.open(link, "_blank", "noreferrer"); },
      style: Object.assign({}, btnStyle(teal, "#fff"), {
        textAlign: "center", display: "block", padding: "11px 20px", width: "100%",
      })
    }, "Apply & Pay — $" + price + " AUD incl. GST")
  );
}

// ─── Post Shift Modal ────────────────────────────────────────────────────────
function PostShiftModal(props) {
  var user = props.user;
  var onClose = props.onClose;
  var onPosted = props.onPosted;

  var [step, setStep] = useState(1);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [bundle, setBundle] = useState("none");
  var [form, setForm] = useState({
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
  });

  function setField(key) {
    return function(e) {
      setForm(function(f) {
        var next = Object.assign({}, f);
        next[key] = e.target.value;
        return next;
      });
    };
  }

  function handleSubmit() {
    if (!form.pharmacy_name || !form.shift_date) {
      setError("Pharmacy name and date are required.");
      return;
    }
    setLoading(true);
    setError("");
    var supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setStep(2);
      return;
    }
    supabase.from("shifts").insert([Object.assign({}, form, {
      owner_id: user.id,
      owner_email: user.email,
      status: "pending_payment",
    })]).then(function(result) {
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
      } else {
        setStep(2);
      }
    });
  }

  var payLink = bundle === "none"
    ? (SHIFT_LINKS[form.shift_type] || "https://scriptshiftwa.com.au/contact")
    : (BUNDLE_LINKS[bundle] || "https://scriptshiftwa.com.au/contact");
  var payAmount = bundle === "none"
    ? (PRICES[form.shift_type] || 14)
    : (BUNDLE_PRICES[bundle] || 35);

  var bundleOptions = [
    { key: "none",  label: "Single Shift",  price: PRICES[form.shift_type] || 14, desc: "One shift listing" },
    { key: "three", label: "3-Day Bundle",  price: 35, desc: "Save vs 3 singles" },
    { key: "five",  label: "5-Day Bundle",  price: 55, desc: "Most popular" },
    { key: "eight", label: "8-Day Bundle",  price: 80, desc: "Best value" },
  ];

  return React.createElement("div", {
    style: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }
  },
    React.createElement("div", {
      style: {
        background: surf, border: "1px solid " + border, borderRadius: 16,
        maxWidth: 560, width: "100%", maxHeight: "90vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
      }
    },
      // Header
      React.createElement("div", {
        style: {
          padding: "18px 24px", borderBottom: "1px solid " + border,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }
      },
        React.createElement("h3", {
          style: { margin: 0, color: white }
        }, step === 1 ? "Post a Shift" : "Choose Payment"),
        React.createElement("button", {
          onClick: onClose,
          style: btnStyle(slateM, muted, { padding: "6px 14px" })
        }, "Close")
      ),
      // Body
      React.createElement("div", {
        style: { padding: "20px 24px", overflowY: "auto", flex: 1 }
      },
        step === 1
          ? React.createElement("div", null,
              React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
                React.createElement("div", { style: Object.assign({}, fieldStyle, { gridColumn: "1/-1" }) },
                  React.createElement("label", { style: labelStyle }, "Pharmacy Name *"),
                  React.createElement("input", {
                    style: inputStyle,
                    value: form.pharmacy_name,
                    onChange: setField("pharmacy_name"),
                    placeholder: "e.g. Karratha Pharmacy",
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Suburb"),
                  React.createElement("input", {
                    style: inputStyle,
                    value: form.suburb,
                    onChange: setField("suburb"),
                    placeholder: "e.g. Joondalup",
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Region"),
                  React.createElement("select", {
                    style: inputStyle,
                    value: form.region,
                    onChange: setField("region"),
                  }, REGIONS.map(function(r) {
                    return React.createElement("option", { key: r, value: r }, r);
                  }))
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Shift Type"),
                  React.createElement("select", {
                    style: inputStyle,
                    value: form.shift_type,
                    onChange: setField("shift_type"),
                  },
                    React.createElement("option", { value: "standard" },  "Standard ($9)"),
                    React.createElement("option", { value: "evening" },   "Evening ($9)"),
                    React.createElement("option", { value: "weekend" },   "Weekend ($14)"),
                    React.createElement("option", { value: "emergency" }, "Emergency ($19)")
                  )
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Date *"),
                  React.createElement("input", {
                    style: inputStyle, type: "date",
                    value: form.shift_date, onChange: setField("shift_date"),
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Dispensing Software"),
                  React.createElement("input", {
                    style: inputStyle,
                    value: form.software,
                    onChange: setField("software"),
                    placeholder: "Fred, Minfos, Z, Lots...",
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Start Time"),
                  React.createElement("input", {
                    style: inputStyle, type: "time",
                    value: form.start_time, onChange: setField("start_time"),
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "End Time"),
                  React.createElement("input", {
                    style: inputStyle, type: "time",
                    value: form.end_time, onChange: setField("end_time"),
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Hourly Rate ($)"),
                  React.createElement("input", {
                    style: inputStyle, type: "number",
                    value: form.rate, onChange: setField("rate"),
                    placeholder: "e.g. 60",
                  })
                ),
                React.createElement("div", { style: Object.assign({}, fieldStyle, { gridColumn: "1/-1" }) },
                  React.createElement("label", { style: labelStyle }, "Notes"),
                  React.createElement("textarea", {
                    style: Object.assign({}, inputStyle, { minHeight: 70, resize: "vertical" }),
                    value: form.notes,
                    onChange: setField("notes"),
                    placeholder: "Any special requirements...",
                  })
                )
              ),
              error ? React.createElement("p", { style: { color: red, fontSize: 13, marginBottom: 12 } }, error) : null,
              React.createElement("button", {
                onClick: handleSubmit,
                disabled: loading,
                style: btnStyle(teal, "#fff", { width: "100%", padding: 14, fontSize: 15 }),
              }, loading ? "Saving..." : "Continue to Payment")
            )
          : React.createElement("div", null,
              React.createElement("p", { style: { color: muted, fontSize: 14, marginTop: 0, marginBottom: 16 } },
                "Your shift has been saved. Choose a listing option and complete payment to go live."
              ),
              React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 } },
                bundleOptions.map(function(opt) {
                  return React.createElement("div", {
                    key: opt.key,
                    onClick: function() { setBundle(opt.key); },
                    style: Object.assign({}, cardStyle, {
                      cursor: "pointer",
                      borderColor: bundle === opt.key ? teal : border,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    })
                  },
                    React.createElement("div", null,
                      React.createElement("div", { style: { fontWeight: 700, color: white } }, opt.label),
                      React.createElement("div", { style: { fontSize: 12, color: muted } }, opt.desc)
                    ),
                    React.createElement("div", {
                      style: { fontWeight: 700, color: tealLt, fontSize: 22 }
                    }, "$" + opt.price)
                  );
                })
              ),
              React.createElement("button", {
                onClick: function() { window.open(payLink, "_blank", "noreferrer"); },
                style: Object.assign({}, btnStyle(amber, navy), {
                  width: "100%", padding: 14, fontSize: 15,
                }),
              }, "Pay $" + payAmount + " AUD (incl. GST) via Stripe"),
              React.createElement("button", {
                onClick: function() { onPosted(); onClose(); },
                style: btnStyle("transparent", muted, {
                  width: "100%", padding: 10, marginTop: 8,
                  border: "1px solid " + border,
                }),
              }, "Done (I have paid)")
            )
      )
    )
  );
}

// ─── Auth Modal ──────────────────────────────────────────────────────────────
function AuthModal(props) {
  var onClose = props.onClose;
  var onAuth = props.onAuth;

  var [mode, setMode] = useState("login");
  var [step, setStep] = useState(1);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [termsOk, setTermsOk] = useState(false);
  var [form, setForm] = useState({
    email: "", password: "",
    full_name: "", ahpra: "", phone: "",
    role: "pharmacist",
  });

  function setField(key) {
    return function(e) {
      setForm(function(f) {
        var next = Object.assign({}, f);
        next[key] = e.target.value;
        return next;
      });
    };
  }

  function handleLogin() {
    setLoading(true);
    setError("");
    var supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setError("Connection error. Please check your internet.");
      return;
    }
    supabase.auth.signInWithPassword({
      email: form.email, password: form.password,
    }).then(function(result) {
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
      } else {
        onAuth(result.data.user);
      }
    });
  }

  function handleRegisterStep() {
    if (step === 1) {
      if (!form.email || !form.password) {
        setError("Email and password required.");
        return;
      }
      setStep(2);
      setError("");
      return;
    }
    if (step === 2) {
      if (!form.full_name || !form.ahpra) {
        setError("Full name and AHPRA number required.");
        return;
      }
      setStep(3);
      setError("");
      return;
    }
    // step 3
    if (!termsOk) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }
    setLoading(true);
    setError("");
    var supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setError("Connection error.");
      return;
    }
    supabase.auth.signUp({
      email: form.email, password: form.password,
    }).then(function(result) {
      if (result.error) {
        setLoading(false);
        setError(result.error.message);
        return;
      }
      var newUser = result.data.user;
      if (newUser) {
        supabase.from("profiles").upsert({
          id: newUser.id,
          full_name: form.full_name,
          ahpra: form.ahpra,
          phone: form.phone,
          role: form.role,
        }).then(function() {
          setLoading(false);
          onAuth(newUser);
        });
      } else {
        setLoading(false);
        onAuth(null);
      }
    });
  }

  var stepLabels = ["Account", "Details", "Confirm"];

  return React.createElement("div", {
    style: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 900,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }
  },
    React.createElement("div", {
      style: {
        background: surf, border: "1px solid " + border, borderRadius: 16,
        maxWidth: 440, width: "100%",
      }
    },
      // Header tabs
      React.createElement("div", {
        style: {
          padding: "18px 24px", borderBottom: "1px solid " + border,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }
      },
        React.createElement("div", { style: { display: "flex", gap: 20 } },
          ["login", "register"].map(function(m) {
            return React.createElement("button", {
              key: m,
              onClick: function() { setMode(m); setStep(1); setError(""); },
              style: {
                background: "transparent",
                border: "none",
                borderBottom: mode === m ? "2px solid " + tealLt : "2px solid transparent",
                color: mode === m ? tealLt : muted,
                fontWeight: 600, cursor: "pointer", fontSize: 14,
                padding: "4px 0", fontFamily: "inherit",
              }
            }, m === "login" ? "Sign In" : "Register");
          })
        ),
        React.createElement("button", {
          onClick: onClose,
          style: btnStyle(slateM, muted, { padding: "6px 14px" })
        }, "Close")
      ),
      // Body
      React.createElement("div", { style: { padding: 24 } },
        mode === "login"
          ? React.createElement("div", null,
              React.createElement("div", { style: fieldStyle },
                React.createElement("label", { style: labelStyle }, "Email"),
                React.createElement("input", {
                  style: inputStyle, type: "email",
                  value: form.email, onChange: setField("email"),
                })
              ),
              React.createElement("div", { style: fieldStyle },
                React.createElement("label", { style: labelStyle }, "Password"),
                React.createElement("input", {
                  style: inputStyle, type: "password",
                  value: form.password, onChange: setField("password"),
                })
              ),
              error ? React.createElement("p", { style: { color: red, fontSize: 13, marginBottom: 12 } }, error) : null,
              React.createElement("button", {
                onClick: handleLogin, disabled: loading,
                style: btnStyle(teal, "#fff", { width: "100%", padding: 13 }),
              }, loading ? "Signing in..." : "Sign In")
            )
          : React.createElement("div", null,
              // Step progress bar
              React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 20 } },
                stepLabels.map(function(s, i) {
                  return React.createElement("div", { key: s, style: { flex: 1, textAlign: "center" } },
                    React.createElement("div", {
                      style: {
                        height: 3, borderRadius: 2, marginBottom: 4,
                        background: i + 1 <= step ? teal : slateM,
                      }
                    }),
                    React.createElement("span", {
                      style: { fontSize: 11, color: i + 1 <= step ? tealLt : muted }
                    }, s)
                  );
                })
              ),
              // Step 1: credentials
              step === 1 ? React.createElement("div", null,
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "I am a"),
                  React.createElement("div", { style: { display: "flex", gap: 8 } },
                    ["pharmacist", "owner"].map(function(r) {
                      return React.createElement("button", {
                        key: r,
                        onClick: function() { setForm(function(f) { return Object.assign({}, f, { role: r }); }); },
                        style: btnStyle(
                          form.role === r ? teal : slateM,
                          form.role === r ? "#fff" : muted,
                          { flex: 1, padding: 10 }
                        ),
                      }, r === "pharmacist" ? "Pharmacist" : "Pharmacy Owner");
                    })
                  )
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Email"),
                  React.createElement("input", {
                    style: inputStyle, type: "email",
                    value: form.email, onChange: setField("email"),
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Password"),
                  React.createElement("input", {
                    style: inputStyle, type: "password",
                    value: form.password, onChange: setField("password"),
                  })
                )
              ) : null,
              // Step 2: profile details
              step === 2 ? React.createElement("div", null,
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Full Name *"),
                  React.createElement("input", {
                    style: inputStyle,
                    value: form.full_name, onChange: setField("full_name"),
                    placeholder: "As per AHPRA registration",
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "AHPRA Number *"),
                  React.createElement("input", {
                    style: inputStyle,
                    value: form.ahpra, onChange: setField("ahpra"),
                    placeholder: "PHAxxxxxxxxx",
                  })
                ),
                React.createElement("div", { style: fieldStyle },
                  React.createElement("label", { style: labelStyle }, "Mobile Phone"),
                  React.createElement("input", {
                    style: inputStyle, type: "tel",
                    value: form.phone, onChange: setField("phone"),
                    placeholder: "04xx xxx xxx",
                  })
                )
              ) : null,
              // Step 3: T&Cs
              step === 3 ? React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontSize: 40, marginBottom: 12 } }, "✅"),
                React.createElement("h4", { style: { color: white, margin: "0 0 8px" } }, "Almost there!"),
                React.createElement("p", { style: { color: muted, fontSize: 13, marginBottom: 16 } },
                  "Please review and accept the Terms & Conditions before creating your account."
                ),
                React.createElement("label", {
                  style: {
                    display: "flex", alignItems: "flex-start", gap: 10,
                    cursor: "pointer", textAlign: "left", marginBottom: 16,
                  }
                },
                  React.createElement("input", {
                    type: "checkbox",
                    checked: termsOk,
                    onChange: function(e) { setTermsOk(e.target.checked); },
                    style: { marginTop: 2, width: 16, height: 16, accentColor: teal },
                  }),
                  React.createElement("span", { style: { fontSize: 13, color: muted, lineHeight: 1.5 } },
                    "I agree to the ScriptShift WA Terms of Service, Privacy Policy, and Refund Policy."
                  )
                ),
                React.createElement("p", { style: { color: muted, fontSize: 12 } },
                  "ScriptShift Technologies Pty Ltd (ABN 21 698 500 542)"
                )
              ) : null,
              error ? React.createElement("p", { style: { color: red, fontSize: 13, margin: "8px 0" } }, error) : null,
              React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 8 } },
                step > 1 ? React.createElement("button", {
                  onClick: function() { setStep(function(s) { return s - 1; }); },
                  style: btnStyle(slateM, white, { flex: 1, padding: 12 }),
                }, "Back") : null,
                React.createElement("button", {
                  onClick: handleRegisterStep, disabled: loading,
                  style: btnStyle(teal, "#fff", { flex: 2, padding: 12 }),
                }, loading ? "Creating..." : step < 3 ? "Next" : "Create Account")
              )
            )
      )
    )
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  var [user, setUser]         = useState(null);
  var [shifts, setShifts]     = useState([]);
  var [liveCount, setLiveCount] = useState(0);
  var [loading, setLoading]   = useState(true);
  var [showAuth, setShowAuth] = useState(false);
  var [showPost, setShowPost] = useState(false);
  var [legal, setLegal]       = useState(null);
  var [filterRegion, setFilterRegion] = useState("all");
  var [filterType, setFilterType]     = useState("all");
  var [filterSearch, setFilterSearch] = useState("");

  // Auth listener
  useEffect(function() {
    var supabase = getSupabase();
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(function(res) {
      setUser(res.data && res.data.session ? res.data.session.user : null);
    });

    var result = supabase.auth.onAuthStateChange(function(event, session) {
      setUser(session ? session.user : null);
    });
    var sub = result.data;
    return function() {
      if (sub && sub.subscription) sub.subscription.unsubscribe();
    };
  }, []);

  // Load shifts
  var loadShifts = useCallback(function() {
    setLoading(true);
    var supabase = getSupabase();
    if (!supabase) { setLoading(false); return; }
    supabase
      .from("shifts")
      .select("*")
      .eq("status", "active")
      .order("shift_date", { ascending: true })
      .then(function(res) {
        var data = res.data || [];
        setShifts(data);
        setLiveCount(data.length);
        setLoading(false);
      });
  }, []);

  useEffect(function() { loadShifts(); }, [loadShifts]);

  // Realtime subscription
  useEffect(function() {
    var supabase = getSupabase();
    if (!supabase) return;
    var channel = supabase
      .channel("shifts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, loadShifts)
      .subscribe();
    return function() { supabase.removeChannel(channel); };
  }, [loadShifts]);

  function signOut() {
    var supabase = getSupabase();
    if (supabase) supabase.auth.signOut();
    setUser(null);
  }

  // Filter shifts
  var filtered = shifts.filter(function(s) {
    var regionOk = filterRegion === "all" || s.region === filterRegion;
    var typeOk   = filterType === "all" || s.shift_type === filterType;
    var term     = filterSearch.toLowerCase();
    var searchOk = !term ||
      (s.pharmacy_name || "").toLowerCase().indexOf(term) !== -1 ||
      (s.suburb || "").toLowerCase().indexOf(term) !== -1;
    return regionOk && typeOk && searchOk;
  });

  var globalCss = [
    "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');",
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    "body { background: " + navy + "; color: " + white + "; font-family: 'DM Sans', sans-serif; }",
    "::-webkit-scrollbar { width: 6px; }",
    "::-webkit-scrollbar-track { background: " + navy + "; }",
    "::-webkit-scrollbar-thumb { background: " + slateM + "; border-radius: 3px; }",
    "select option { background: " + slate + "; }",
    "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }",
    "input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }",
    "input[type=time]::-webkit-calendar-picker-indicator { filter: invert(1); }",
  ].join("\n");

  var pricingItems = [
    { label: "Standard Shift",  price: 9,  icon: "☀️",  sub: "Mon-Fri business hours" },
    { label: "Evening Shift",   price: 9,  icon: "🌙",  sub: "After-hours weekday" },
    { label: "Weekend Shift",   price: 14, icon: "📅",  sub: "Saturday or Sunday" },
    { label: "Emergency Shift", price: 19, icon: "🚨",  sub: "Same-day urgent cover" },
    { label: "3-Day Bundle",    price: 20, icon: "📦",  sub: "Save vs 3 singles" },
    { label: "5-Day Bundle",    price: 30, icon: "⭐",  sub: "Most popular" },
    { label: "8-Day Bundle",    price: 45, icon: "💎",  sub: "Best value" },
  ];

  return React.createElement(React.Fragment, null,
    React.createElement("style", null, globalCss),

    // ── Navbar
    React.createElement("nav", {
      style: {
        background: surf, borderBottom: "1px solid " + border,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }
    },
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
        React.createElement("div", {
          style: {
            background: teal, borderRadius: 8, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 700, color: "#fff",
          }
        }, "Rx"),
        React.createElement("span", { style: { fontWeight: 700, fontSize: 18 } },
          "ScriptShift ",
          React.createElement("span", { style: { color: teal } }, "WA")
        ),
        React.createElement("div", {
          style: {
            display: "flex", alignItems: "center", gap: 6,
            background: slate, borderRadius: 20, padding: "3px 10px",
          }
        },
          React.createElement("div", {
            style: {
              width: 7, height: 7, borderRadius: "50%",
              background: green, animation: "pulse 2s infinite",
            }
          }),
          React.createElement("span", {
            style: { fontSize: 12, color: muted, fontFamily: "'DM Mono', monospace" }
          }, liveCount + " live")
        )
      ),
      React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
        user
          ? React.createElement(React.Fragment, null,
              React.createElement("button", {
                onClick: function() { setShowPost(true); },
                style: btnStyle(teal, "#fff"),
              }, "+ Post Shift"),
              React.createElement("button", {
                onClick: signOut,
                style: btnStyle(slateM, muted),
              }, "Sign Out")
            )
          : React.createElement("button", {
              onClick: function() { setShowAuth(true); },
              style: btnStyle(teal, "#fff"),
            }, "Sign In / Register")
      )
    ),

    // ── Hero
    React.createElement("div", {
      style: {
        background: "linear-gradient(135deg, " + navy + " 0%, " + slate + " 100%)",
        borderBottom: "1px solid " + border,
        padding: "48px 24px 40px",
        textAlign: "center",
      }
    },
      React.createElement("h1", {
        style: { fontSize: "clamp(22px,5vw,40px)", fontWeight: 700, letterSpacing: -1, marginBottom: 12 }
      }, "WA's Pharmacy Shift Marketplace"),
      React.createElement("p", {
        style: { color: muted, fontSize: 16, maxWidth: 560, margin: "0 auto 28px" }
      }, "Connecting locum pharmacists with pharmacy owners across Perth Metro, Pilbara, Kimberley and Goldfields in real time."),
      React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" } },
        [
          { label: "Live Shifts",      value: String(liveCount) },
          { label: "Regions Covered",  value: "10" },
          { label: "Listing from",     value: "$9" },
        ].map(function(stat) {
          return React.createElement("div", { key: stat.label, style: { textAlign: "center" } },
            React.createElement("div", {
              style: { fontSize: 28, fontWeight: 700, color: tealLt, fontFamily: "'DM Mono', monospace" }
            }, stat.value),
            React.createElement("div", {
              style: { fontSize: 12, color: muted, textTransform: "uppercase", letterSpacing: 0.5 }
            }, stat.label)
          );
        })
      )
    ),

    // ── Filter bar
    React.createElement("div", {
      style: {
        background: surf, borderBottom: "1px solid " + border,
        padding: "14px 24px",
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
      }
    },
      React.createElement("input", {
        style: Object.assign({}, inputStyle, { width: 220, flex: "0 0 auto" }),
        placeholder: "Search pharmacy / suburb...",
        value: filterSearch,
        onChange: function(e) { setFilterSearch(e.target.value); },
      }),
      React.createElement("select", {
        style: Object.assign({}, inputStyle, { width: 180, flex: "0 0 auto" }),
        value: filterRegion,
        onChange: function(e) { setFilterRegion(e.target.value); },
      },
        React.createElement("option", { value: "all" }, "All Regions"),
        REGIONS.map(function(r) {
          return React.createElement("option", { key: r, value: r }, r);
        })
      ),
      React.createElement("select", {
        style: Object.assign({}, inputStyle, { width: 150, flex: "0 0 auto" }),
        value: filterType,
        onChange: function(e) { setFilterType(e.target.value); },
      },
        React.createElement("option", { value: "all" }, "All Types"),
        React.createElement("option", { value: "standard" }, "Standard"),
        React.createElement("option", { value: "evening" }, "Evening"),
        React.createElement("option", { value: "weekend" }, "Weekend"),
        React.createElement("option", { value: "emergency" }, "Emergency")
      ),
      user ? React.createElement("button", {
        onClick: function() { setShowPost(true); },
        style: btnStyle(amber, navy, { marginLeft: "auto" }),
      }, "+ Post a Shift") : null
    ),

    // ── Shift grid
    React.createElement("main", {
      style: { padding: "24px", maxWidth: 1200, margin: "0 auto" }
    },
      loading
        ? React.createElement("div", { style: { textAlign: "center", padding: "80px 0", color: muted } },
            React.createElement("div", { style: { fontSize: 32, marginBottom: 12 } }, "⏳"),
            React.createElement("p", null, "Loading live shifts...")
          )
        : filtered.length === 0
          ? React.createElement("div", { style: { textAlign: "center", padding: "80px 0" } },
              React.createElement("div", { style: { fontSize: 48, marginBottom: 16 } }, "💊"),
              React.createElement("h3", { style: { color: white, marginBottom: 8 } }, "No shifts listed yet"),
              React.createElement("p", {
                style: { color: muted, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }
              }, "Be the first to post a shift and connect with qualified WA pharmacists."),
              React.createElement("button", {
                onClick: function() { user ? setShowPost(true) : setShowAuth(true); },
                style: btnStyle(teal, "#fff", { padding: "12px 28px", fontSize: 15 }),
              }, "Post the First Shift")
            )
          : React.createElement("div", null,
              React.createElement("p", { style: { color: muted, fontSize: 13, marginBottom: 16 } },
                "Showing " + filtered.length + " shift" + (filtered.length !== 1 ? "s" : "")
              ),
              React.createElement("div", {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }
              }, filtered.map(function(s) {
                return React.createElement(ShiftCard, { key: s.id, shift: s });
              }))
            )
    ),

    // ── Pricing section
    React.createElement("section", {
      style: {
        background: surf, borderTop: "1px solid " + border, borderBottom: "1px solid " + border,
        padding: "40px 24px",
      }
    },
      React.createElement("div", { style: { maxWidth: 900, margin: "0 auto" } },
        React.createElement("h2", { style: { textAlign: "center", marginBottom: 8, fontSize: 22 } },
          "Transparent Listing Fees"
        ),
        React.createElement("p", { style: { textAlign: "center", color: muted, fontSize: 14, marginBottom: 28 } },
          "All prices GST-inclusive. Secure payment via Stripe."
        ),
        React.createElement("div", {
          style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 12 }
        }, pricingItems.map(function(item) {
          return React.createElement("div", {
            key: item.label,
            style: Object.assign({}, cardStyle, { textAlign: "center", padding: 16 }),
          },
            React.createElement("div", { style: { fontSize: 24, marginBottom: 6 } }, item.icon),
            React.createElement("div", { style: { fontWeight: 700, color: white, fontSize: 14, marginBottom: 4 } }, item.label),
            React.createElement("div", { style: { fontWeight: 700, color: tealLt, fontSize: 22, marginBottom: 4 } }, "$" + item.price),
            React.createElement("div", { style: { fontSize: 11, color: muted } }, item.sub)
          );
        }))
      )
    ),

    // ── Footer
    React.createElement("footer", {
      style: {
        background: navy, borderTop: "1px solid " + border,
        padding: "32px 24px", textAlign: "center",
      }
    },
      React.createElement("div", { style: { fontWeight: 700, marginBottom: 4 } },
        "ScriptShift ", React.createElement("span", { style: { color: teal } }, "WA")
      ),
      React.createElement("p", { style: { color: muted, fontSize: 12, marginBottom: 16 } },
        "ScriptShift Technologies Pty Ltd  ABN 21 698 500 542"
      ),
      React.createElement("div", { style: { display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" } },
        [["Terms of Service", "terms"], ["Privacy Policy", "privacy"], ["Refund Policy", "refund"]].map(function(item) {
          return React.createElement("button", {
            key: item[1],
            onClick: function() { setLegal(item[1]); },
            style: { background: "transparent", border: "none", color: muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
          }, item[0]);
        }),
        React.createElement("button", {
          onClick: function() { window.location.href = "mailto:hello@scriptshiftwa.com.au"; },
          style: { fontSize: 12, color: muted, textDecoration: "none", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" },
        }, "hello@scriptshiftwa.com.au")
      ),
      React.createElement("p", { style: { color: "#475569", fontSize: 11, marginTop: 16 } },
        "© " + new Date().getFullYear() + " ScriptShift Technologies Pty Ltd. All rights reserved."
      )
    ),

    // ── Modals
    showAuth ? React.createElement(AuthModal, {
      onClose: function() { setShowAuth(false); },
      onAuth: function(u) { setUser(u); setShowAuth(false); },
    }) : null,

    showPost && user ? React.createElement(PostShiftModal, {
      user: user,
      onClose: function() { setShowPost(false); },
      onPosted: loadShifts,
    }) : null,

    legal === "terms" ? React.createElement(LegalModal, {
      title: "Terms of Service",
      onClose: function() { setLegal(null); },
    },
      React.createElement("p", null,
        React.createElement("strong", null, "ScriptShift Technologies Pty Ltd"),
        " (ABN 21 698 500 542), trading as ScriptShift WA."
      ),
      React.createElement("br"),
      React.createElement("p", null,
        "By using ScriptShift WA you agree to these terms. This platform connects pharmacy owners with locum pharmacists in Western Australia. ScriptShift WA does not employ pharmacists. Payment is processed securely via Stripe. Listing fees are non-refundable except as stated in our Refund Policy. Users must hold a current AHPRA registration to practise as a pharmacist. ScriptShift WA is not responsible for employment relationships formed through the platform. All pricing is in AUD and inclusive of GST. For queries, contact hello@scriptshiftwa.com.au."
      )
    ) : null,

    legal === "privacy" ? React.createElement(LegalModal, {
      title: "Privacy Policy",
      onClose: function() { setLegal(null); },
    },
      React.createElement("p", null,
        "ScriptShift Technologies Pty Ltd collects personal information including name, email, AHPRA number, and phone number to facilitate platform registration and shift matching. Your data is stored securely on Supabase (Sydney region) and is never sold to third parties. Payment information is handled entirely by Stripe and is not stored on our servers. You may request deletion of your account by emailing hello@scriptshiftwa.com.au. We comply with the Australian Privacy Act 1988."
      )
    ) : null,

    legal === "refund" ? React.createElement(LegalModal, {
      title: "Refund Policy",
      onClose: function() { setLegal(null); },
    },
      React.createElement("p", null,
        "Listing fees paid to ScriptShift WA are generally non-refundable once a shift has been published. If a listing cannot be fulfilled due to a technical error on our part, a full refund will be issued within 5 to 10 business days. Bundle listings are non-refundable after any shift in the bundle has been posted. To request a refund, contact hello@scriptshiftwa.com.au within 7 days of purchase with your order reference."
      )
    ) : null
  );
}
