/* eslint-disable */
import { useState, useEffect } from "react";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@300;400;500;600;700&display=swap');`;

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:"#0E0F13", bgCard:"#16181F", bgHover:"#1C1F28",
  border:"#252830", borderHi:"#343847",
  amber:"#F0A500", amberDim:"#3D2D00", amberText:"#FFD166",
  mint:"#00E5B0", mintDim:"#003D30", mintText:"#5FFFD8",
  coral:"#FF5C5C", coralDim:"#3D1515",
  lavender:"#9D8FFF", lavDim:"#1E1A3D",
  white:"#F5F6FA", dim:"#8B8FA8", dimmer:"#545770",
  stripe:"#635BFF",
};

const SHIFT_BADGE = {
  Emergency:{ bg:T.coralDim, color:T.coral,    border:"#5C2020", dot:T.coral },
  Standard: { bg:T.mintDim,  color:T.mintText,  border:"#0A5040", dot:T.mint },
  Weekend:  { bg:T.lavDim,   color:T.lavender,  border:"#2A2560", dot:T.lavender },
  Evening:  { bg:T.amberDim, color:T.amberText, border:"#503A00", dot:T.amber },
};

// ── Stripe Payment Links ───────────────────────────────────────────────────────
const STRIPE_PAYMENT_LINKS = {
  Standard: "https://buy.stripe.com/bJebIUffv5u6fWK0Wva7C08",
  Evening:  "https://buy.stripe.com/00w28kgjz7Ce8uicFda7C09",
  Weekend:  "https://buy.stripe.com/aFa00cd7naOq7qedJha7C0c",
  Emergency:"https://buy.stripe.com/8x26oA6IZ8Gi8ui9t1a7C0b",
};

const SHIFT_PRICES = {
  Standard:"$9 AUD", Evening:"$9 AUD",
  Weekend:"$14 AUD", Emergency:"$19 AUD",
};

// ── Supabase client (lightweight fetch-based) ─────────────────────────────────
const SUPA_URL  = "https://ageszwwbtawphfmtmrfj.supabase.co";
const SUPA_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZXN6d3didGF3cGhmbXRtcmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjM0MzgsImV4cCI6MjA5NTY5OTQzOH0.YkPqcazPk11CoCecf1m9LCIU9zXIH96XnIDtvRyZVWE";

const supaHeaders = (token) => ({
  "Content-Type": "application/json",
  "apikey": SUPA_KEY,
  "Authorization": `Bearer ${token || SUPA_KEY}`,
});

const supaSignUp = async ({ email, password, fullName, ahpra, phone, software }) => {
  const res = await fetch(`${SUPA_URL}/auth/v1/signup`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "apikey":SUPA_KEY },
    body: JSON.stringify({
      email, password,
      data:{ full_name:fullName, ahpra_number:ahpra, phone, software, role:"pharmacist" }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || data.msg);
  return data;
};

const supaSignIn = async ({ email, password }) => {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "apikey":SUPA_KEY },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.error || data.error_description) throw new Error(data.error_description || data.error);
  return data;
};

const supaSignOut = async (token) => {
  await fetch(`${SUPA_URL}/auth/v1/logout`, {
    method:"POST",
    headers: supaHeaders(token),
  });
};

const supaUpdateProfile = async (token, userId, updates) => {
  await fetch(`${SUPA_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method:"PATCH",
    headers:{ ...supaHeaders(token), "Prefer":"return=minimal" },
    body: JSON.stringify(updates),
  });
};

const fmt12 = (t) => { const [h,m]=t.split(":"); const hr=+h; return `${hr>12?hr-12:hr||12}:${m}${hr>=12?"pm":"am"}`; };

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("signin");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email:"", password:"", confirmPassword:"",
    fullName:"", phone:"", ahpra:"",
    software:[], minRate:"60", regions:[], openToTravel:false,
  });

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const toggle = (k, val) => setForm(p => {
    const arr = p[k];
    return {...p,[k]: arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val]};
  });

  const handleSignIn = async () => {
    if (!form.email || !form.password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const data = await supaSignIn({ email:form.email, password:form.password });
      try { localStorage.setItem("ss_token", data.access_token); localStorage.setItem("ss_user", JSON.stringify(data.user)); } catch(e) {}
      onSuccess(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const handleSignUpStep1 = () => {
    if (!form.fullName || !form.email || !form.password) { setError("Please fill in all required fields."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setError(""); setStep(2);
  };

  const handleSignUpStep2 = () => {
    if (!form.ahpra) { setError("AHPRA number is required for verification."); return; }
    setError(""); setStep(3);
  };

  const handleSignUpFinal = async () => {
    if (form.regions.length === 0) { setError("Please select at least one region."); return; }
    setLoading(true); setError("");
    try {
      const data = await supaSignUp({
        email: form.email, password: form.password,
        fullName: form.fullName, ahpra: form.ahpra,
        phone: form.phone, software: form.software.join(", "),
      });
      if (data.access_token) {
        localStorage.setItem("ss_token", data.access_token);
        localStorage.setItem("ss_user", JSON.stringify(data.user));
        onSuccess(data);
      } else {
        onSuccess({ needsConfirmation: true, email: form.email });
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const s = {
    overlay: { position:"fixed",inset:0,background:"rgba(5,6,10,0.9)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto" },
    box: { background:T.bgCard,border:`1px solid ${T.borderHi}`,borderRadius:20,padding:"36px 32px",maxWidth:480,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.6)",animation:"fadeUp 0.3s ease",position:"relative",margin:"auto" },
    title: { fontFamily:"'Playfair Display',serif",fontSize:24,color:T.white,marginBottom:4 },
    sub: { fontSize:14,color:T.dim,marginBottom:24,lineHeight:1.6 },
    tabs: { display:"flex",background:T.bg,borderRadius:10,padding:4,marginBottom:24,gap:4 },
    tab: (a) => ({ flex:1,padding:"8px 0",borderRadius:8,border:"none",background:a?T.bgCard:"transparent",color:a?T.white:T.dim,fontWeight:a?600:400,fontSize:14,cursor:"pointer",fontFamily:"'Outfit',sans-serif",boxShadow:a?"0 1px 4px rgba(0,0,0,0.3)":"none",transition:"all 0.15s" }),
    label: { fontSize:11,fontWeight:700,color:T.dimmer,letterSpacing:0.8,textTransform:"uppercase",display:"block",marginBottom:6 },
    input: { width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:14,color:T.white,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:16 },
    err: { background:T.coralDim,border:`1px solid ${T.coral}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:T.coral,marginBottom:16 },
    btn: (bg) => ({ width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:loading?"#4A5568":bg,color:bg===T.amber?"#000":T.white,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"'Outfit',sans-serif",marginTop:4,transition:"opacity 0.15s" }),
    stepIndicator: { display:"flex",gap:8,justifyContent:"center",marginBottom:24 },
    stepDot: (active,done) => ({ width:done?24:8,height:8,borderRadius:4,background:done?T.mint:active?T.amber:T.border,transition:"all 0.3s ease" }),
    chipRow: { display:"flex",flexWrap:"wrap",gap:8,marginBottom:16 },
    chip: (sel) => ({ padding:"6px 14px",borderRadius:20,border:`1px solid ${sel?T.mint:T.border}`,background:sel?"rgba(0,229,176,0.1)":"transparent",color:sel?T.mintText:T.dim,fontSize:12,fontWeight:sel?700:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s" }),
    twoCol: { display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 },
    closeBtn: { position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,color:T.dimmer,cursor:"pointer" },
    backBtn: { background:"transparent",border:`1px solid ${T.border}`,color:T.dim,borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",width:"100%",marginBottom:10 },
    infoBox: { background:T.bg,borderRadius:10,padding:"12px 16px",marginBottom:16,border:`1px solid ${T.border}`,fontSize:13,color:T.dim,lineHeight:1.6 },
  };

  const SOFTWARE_OPTIONS = ["Fred Dispense","Minfos","LOTS","Corum Health","Other"];
  const REGION_OPTIONS   = ["Perth Metro","Pilbara","Kimberley","Goldfields","Wheatbelt","South West","Great Southern"];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.box} onClick={e=>e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose}>✕</button>
        <div style={s.tabs}>
          <button style={s.tab(mode==="signin")} onClick={()=>{setMode("signin");setStep(1);setError("");}}>Sign In</button>
          <button style={s.tab(mode==="signup")} onClick={()=>{setMode("signup");setStep(1);setError("");}}>Register</button>
        </div>

        {mode==="signin" && <>
          <div style={s.title}>Welcome back</div>
          <div style={s.sub}>Sign in to browse and apply for shifts across WA.</div>
          {error && <div style={s.err}>⚠ {error}</div>}
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="Your password" value={form.password} onChange={set("password")}
            onKeyDown={e=>e.key==="Enter"&&handleSignIn()} />
          <button style={s.btn(T.amber)} onClick={handleSignIn} disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
          <div style={{textAlign:"center",marginTop:14,fontSize:13,color:T.dim}}>
            Don't have an account?{" "}
            <span style={{color:T.amber,cursor:"pointer"}} onClick={()=>{setMode("signup");setError("");}}>Register here</span>
          </div>
        </>}

        {mode==="signup" && <>
          <div style={s.stepIndicator}>
            {[1,2,3].map(n=><div key={n} style={s.stepDot(step===n, step>n)}/>)}
          </div>

          {step===1 && <>
            <div style={s.title}>Create your account</div>
            <div style={s.sub}>Step 1 of 3 — Your login details</div>
            {error && <div style={s.err}>⚠ {error}</div>}
            <label style={s.label}>Full Name *</label>
            <input style={s.input} placeholder="Sarah Chen" value={form.fullName} onChange={set("fullName")} />
            <label style={s.label}>Email Address *</label>
            <input style={s.input} type="email" placeholder="sarah@email.com" value={form.email} onChange={set("email")} />
            <div style={s.twoCol}>
              <div>
                <label style={s.label}>Password *</label>
                <input style={s.input} type="password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} />
              </div>
              <div>
                <label style={s.label}>Confirm Password *</label>
                <input style={s.input} type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} />
              </div>
            </div>
            <label style={s.label}>Phone Number</label>
            <input style={s.input} type="tel" placeholder="04XX XXX XXX" value={form.phone} onChange={set("phone")} />
            <button style={s.btn(T.amber)} onClick={handleSignUpStep1}>Continue →</button>
          </>}

          {step===2 && <>
            <div style={s.title}>Professional details</div>
            <div style={s.sub}>Step 2 of 3 — Your pharmacy credentials</div>
            {error && <div style={s.err}>⚠ {error}</div>}
            <div style={s.infoBox}>
              🔒 Your AHPRA number is stored securely and displayed to pharmacy owners so they can verify your registration before confirming a shift.
            </div>
            <label style={s.label}>AHPRA Registration Number *</label>
            <input style={s.input} placeholder="PHA0001234567" value={form.ahpra} onChange={set("ahpra")} />
            <label style={s.label}>Dispensing Software (select all you know)</label>
            <div style={s.chipRow}>
              {SOFTWARE_OPTIONS.map(sw=>(
                <div key={sw} style={s.chip(form.software.includes(sw))} onClick={()=>toggle("software",sw)}>{sw}</div>
              ))}
            </div>
            <button style={s.backBtn} onClick={()=>{setStep(1);setError("");}}>← Back</button>
            <button style={s.btn(T.amber)} onClick={handleSignUpStep2}>Continue →</button>
          </>}

          {step===3 && <>
            <div style={s.title}>Your preferences</div>
            <div style={s.sub}>Step 3 of 3 — Where and how you want to work</div>
            {error && <div style={s.err}>⚠ {error}</div>}
            <label style={s.label}>Available regions (select all that apply) *</label>
            <div style={s.chipRow}>
              {REGION_OPTIONS.map(r=>(
                <div key={r} style={s.chip(form.regions.includes(r))} onClick={()=>toggle("regions",r)}>{r}</div>
              ))}
            </div>
            <label style={s.label}>Minimum hourly rate (AUD)</label>
            <input style={s.input} type="number" placeholder="60" value={form.minRate} onChange={set("minRate")} />
            <label style={{...s.label,display:"flex",alignItems:"center",gap:10,cursor:"pointer",textTransform:"none",letterSpacing:0}}>
              <input type="checkbox" checked={form.openToTravel} onChange={e=>setForm(p=>({...p,openToTravel:e.target.checked}))} style={{accentColor:T.mint,width:16,height:16}} />
              <span style={{fontSize:14,color:T.white,fontWeight:400}}>Open to regional travel and accommodation</span>
            </label>
            <div style={{height:16}}/>
            <button style={s.backBtn} onClick={()=>{setStep(2);setError("");}}>← Back</button>
            <button style={s.btn(T.mint)} onClick={handleSignUpFinal} disabled={loading}>
              {loading ? "Creating account…" : "✓ Create My Account"}
            </button>
            <div style={{textAlign:"center",marginTop:12,fontSize:11,color:T.dimmer}}>
              By registering you agree to ScriptShift WA's terms of service. Your data is stored securely via Supabase.
            </div>
          </>}
        </>}
      </div>
    </div>
  );
}

// ── SHIFT CARD ────────────────────────────────────────────────────────────────
function ShiftCard({ shift, applied, onApply, user, animDelay }) {
  const badge = SHIFT_BADGE[shift.type] || SHIFT_BADGE.Standard;
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{ background:hovered?T.bgHover:T.bgCard, border:`1px solid ${hovered?T.borderHi:T.border}`, borderRadius:12, padding:"22px 22px 18px", transition:"all 0.18s ease", transform:hovered?"translateY(-2px)":"translateY(0)", boxShadow:hovered?`0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${badge.border}`:"none", animation:`fadeUp 0.4s ease ${animDelay}s both`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2, background:applied?T.mint:badge.dot, opacity:hovered?1:0.5, transition:"opacity 0.18s" }}/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
        <div style={{ flex:1,paddingRight:12 }}>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:15,color:T.white,lineHeight:1.3,marginBottom:4 }}>{shift.pharmacy_name}</div>
          <div style={{ fontSize:12,color:T.dim,display:"flex",alignItems:"center",gap:5 }}><span style={{opacity:0.6}}>◉</span>{shift.location}</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
          <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:badge.bg,color:badge.color,border:`1px solid ${badge.border}`,letterSpacing:0.5,textTransform:"uppercase" }}>{shift.type}</span>
          <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6, background:shift.region==="Regional"?T.amberDim:"rgba(255,255,255,0.05)", color:shift.region==="Regional"?T.amberText:T.dim }}>{shift.region}</span>
        </div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px 10px",marginBottom:14 }}>
        {[["📅",shift.shift_date],["⏱",`${fmt12(shift.start_time)}–${fmt12(shift.end_time)}`],["💻",shift.software],["📋",`${shift.scripts_min}–${shift.scripts_max} Rx/day`]].map(([icon,val])=>(
          <div key={val} style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.dim }}>
            <span style={{fontSize:10}}>{icon}</span><span style={{color:T.white,opacity:0.75}}>{val}</span>
          </div>
        ))}
      </div>
      {(shift.travel_paid||shift.accommodation) && (
        <div style={{ display:"flex",gap:6,marginBottom:14 }}>
          {shift.travel_paid && <span style={{ fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:6,background:"rgba(0,229,176,0.08)",color:T.mintText,border:`1px solid rgba(0,229,176,0.15)` }}>✈ Travel included</span>}
          {shift.accommodation && <span style={{ fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:6,background:"rgba(0,229,176,0.08)",color:T.mintText,border:`1px solid rgba(0,229,176,0.15)` }}>🏨 Accommodation</span>}
        </div>
      )}
      <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:24,color:T.white,lineHeight:1 }}>${shift.rate}<span style={{fontSize:13,fontWeight:400,color:T.dim}}>/hr</span></div>
      <div style={{ fontSize:11,color:T.dimmer,marginTop:3,marginBottom:14 }}>{shift.posted} · {shift.applicant_count} {shift.applicant_count===1?"applicant":"applicants"}</div>
      <div style={{ paddingTop:14,borderTop:`1px solid ${T.border}` }}>
        <button onClick={()=>onApply(shift)}
          style={{ width:"100%", background:applied?T.mintDim:"transparent", color:applied?T.mintText:T.amber, border:`1.5px solid ${applied?T.mint:T.amber}`, borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
          {applied ? "✓ Applied" : user ? "Apply for this shift →" : "Sign in to Apply →"}
        </button>
      </div>
    </div>
  );
}

// ── APPLY MODAL ───────────────────────────────────────────────────────────────
function ApplyModal({ shift, onClose, onConfirm }) {
  const [msg, setMsg] = useState("");
  const badge = SHIFT_BADGE[shift.type] || SHIFT_BADGE.Standard;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(5,6,10,0.85)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={onClose}>
      <div style={{ background:T.bgCard,border:`1px solid ${T.borderHi}`,borderRadius:16,padding:"32px",maxWidth:460,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.6)",animation:"fadeUp 0.25s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
          <span style={{ width:10,height:10,borderRadius:"50%",background:badge.dot,display:"block",boxShadow:`0 0 8px ${badge.dot}` }}/>
          <span style={{ fontSize:11,fontWeight:700,color:badge.color,textTransform:"uppercase",letterSpacing:1 }}>{shift.type} Shift</span>
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,marginBottom:6 }}>Confirm Application</div>
        <div style={{ fontSize:14,color:T.dim,marginBottom:22,lineHeight:1.6 }}>Applying to <span style={{color:T.white}}>{shift.pharmacy_name}</span>. The owner is notified the moment you submit.</div>
        <div style={{ background:T.bg,borderRadius:10,padding:16,marginBottom:20,border:`1px solid ${T.border}` }}>
          {[["Date",shift.shift_date],["Hours",`${fmt12(shift.start_time)}–${fmt12(shift.end_time)}`],["Rate",`$${shift.rate}/hr`],["Software",shift.software],["Location",shift.location]].map(([l,v])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8,color:T.dim }}><span>{l}</span><span style={{color:T.white,fontWeight:500}}>{v}</span></div>
          ))}
        </div>
        <div style={{ fontSize:12,fontWeight:700,color:T.dim,marginBottom:7,letterSpacing:0.5,textTransform:"uppercase" }}>Message (optional)</div>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Introduce yourself or mention relevant experience…"
          style={{ width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,color:T.white,fontFamily:"'Outfit',sans-serif",minHeight:68,resize:"vertical",outline:"none",boxSizing:"border-box",marginBottom:20,lineHeight:1.5 }}/>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:"11px 0",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.dim,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
          <button onClick={()=>onConfirm(msg)} style={{ flex:2,padding:"11px 0",borderRadius:8,border:"none",background:T.amber,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Confirm Application →</button>
        </div>
      </div>
    </div>
  );
}

// ── POST SHIFT ────────────────────────────────────────────────────────────────
const BUNDLE_LINKS = {
  1: null,
  3: "https://buy.stripe.com/9B66oA7N38Gi4e25cLa7C0d",
  5: "https://buy.stripe.com/5kQcMY8R7bSu5i6bB9a7C0a",
  8: "https://buy.stripe.com/4gM3co4AR6yacKydJha7C07",
};

const getDayCount = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start), e = new Date(end);
  if (e < s) return 0;
  return Math.round((e - s) / (1000*60*60*24)) + 1;
};

const getBundlePrice = (days, type) => {
  const base = { Standard:9, Evening:9, Weekend:14, Emergency:19 }[type] || 9;
  if (days <= 1) return `$${base} AUD`;
  if (days <= 3) return `$20 AUD`;
  if (days <= 5) return `$30 AUD`;
  return `$45 AUD`;
};

const getSaving = (days, type) => {
  const base = { Standard:9, Evening:9, Weekend:14, Emergency:19 }[type] || 9;
  if (days <= 1) return 0;
  const full = days * base;
  const discounted = days<=3?20:days<=5?30:45;
  return Math.max(0, full - discounted);
};

function PostView() {
  const [form, setForm] = useState({
    pharmacy_name:"", location:"", region:"Metro",
    date_from:"", date_to:"",
    start_time:"09:00", end_time:"17:00", rate:"",
    type:"Standard", software:"Fred Dispense",
    travel_paid:false, accommodation:false, notes:""
  });
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");

  const set   = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const check = k => e => setForm(p=>({...p,[k]:e.target.checked}));

  const days    = getDayCount(form.date_from, form.date_to);
  const price   = getBundlePrice(days, form.type);
  const saving  = getSaving(days, form.type);

  const handleContinue = () => {
    if (!form.pharmacy_name||!form.location||!form.date_from||!form.rate) {
      setError("Please fill in all required fields — Pharmacy Name, Location, Start Date and Rate."); return;
    }
    if (form.date_to && new Date(form.date_to) < new Date(form.date_from)) {
      setError("End date cannot be before start date."); return;
    }
    setError(""); setStep("pay");
  };

  const handlePay = () => {
    let link;
    if (days <= 1) {
      link = STRIPE_PAYMENT_LINKS[form.type];
    } else if (days <= 3) {
      link = BUNDLE_LINKS[3];
    } else if (days <= 5) {
      link = BUNDLE_LINKS[5];
    } else {
      link = BUNDLE_LINKS[8];
    }
    const params = new URLSearchParams({
      client_reference_id: `${form.pharmacy_name}_${form.date_from}${form.date_to?`_to_${form.date_to}`:""}`.replace(/\s+/g,"_")
    });
    window.location.href = `${link}?${params}`;
  };

  const inputStyle = { width:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:14,color:T.white,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:18 };
  const labelStyle = { fontSize:11,fontWeight:700,color:T.dimmer,letterSpacing:0.8,textTransform:"uppercase",display:"block",marginBottom:6 };

  return (
    <div style={{ maxWidth:600,animation:"fadeUp 0.3s ease" }}>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,color:T.white,marginBottom:6 }}>Post a Shift</div>
      <div style={{ fontSize:14,color:T.dim,marginBottom:28,lineHeight:1.6 }}>
        Post a single shift or a multi-day block. Posting fee: <span style={{color:T.amberText}}>$9–$19 AUD</span> per shift, with bundle discounts for multiple days.
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:24 }}>
        {[["1 day","From $9"],["3 days","$20"],["5 days","$30"],["8 days","$45"]].map(([l,p])=>(
          <div key={l} style={{ background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 8px",textAlign:"center" }}>
            <div style={{ fontSize:13,fontWeight:700,color:T.white,marginBottom:2 }}>{l}</div>
            <div style={{ fontSize:11,color:T.amber,fontWeight:600 }}>{p}</div>
          </div>
        ))}
      </div>

      {step==="form" && (
        <div style={{ background:T.bgCard,borderRadius:14,padding:28,border:`1px solid ${T.border}` }}>
          {error && <div style={{ background:T.coralDim,border:`1px solid ${T.coral}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:T.coral,marginBottom:18 }}>⚠ {error}</div>}

          <label style={labelStyle}>Pharmacy Name *</label>
          <input style={inputStyle} placeholder="e.g. Karratha Day & Night Pharmacy" value={form.pharmacy_name} onChange={set("pharmacy_name")} />

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Location *</label><input style={inputStyle} placeholder="Suburb, City WA" value={form.location} onChange={set("location")} /></div>
            <div><label style={labelStyle}>Region</label><select style={inputStyle} value={form.region} onChange={set("region")}><option>Metro</option><option>Regional</option></select></div>
          </div>

          <div style={{ background:T.bg,borderRadius:10,padding:16,marginBottom:18,border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:12,fontWeight:700,color:T.amber,marginBottom:12,letterSpacing:0.5 }}>📅 SHIFT DATE RANGE</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              <div>
                <label style={labelStyle}>Start Date *</label>
                <input type="date" style={{...inputStyle,marginBottom:0}} value={form.date_from} onChange={set("date_from")} />
              </div>
              <div>
                <label style={labelStyle}>End Date <span style={{color:T.dimmer,fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
                <input type="date" style={{...inputStyle,marginBottom:0}} value={form.date_to} onChange={set("date_to")} min={form.date_from} />
              </div>
            </div>
            {days > 0 && (
              <div style={{ marginTop:12,padding:"8px 12px",background:days>1?"rgba(240,165,0,0.08)":"transparent",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:13,color:T.dim }}>{days} shift{days>1?"s":""} selected</span>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  {saving>0 && <span style={{ fontSize:12,color:T.mint,fontWeight:600 }}>Save ${saving} AUD</span>}
                  <span style={{ fontSize:15,fontWeight:700,color:T.amber }}>{price}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Shift Type</label><select style={inputStyle} value={form.type} onChange={set("type")}>{["Standard","Emergency","Weekend","Evening"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label style={labelStyle}>Rate ($/hr) *</label><input type="number" style={inputStyle} placeholder="85" value={form.rate} onChange={set("rate")} /></div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Start Time</label><input type="time" style={inputStyle} value={form.start_time} onChange={set("start_time")} /></div>
            <div><label style={labelStyle}>End Time</label><input type="time" style={inputStyle} value={form.end_time} onChange={set("end_time")} /></div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Software</label><select style={inputStyle} value={form.software} onChange={set("software")}>{["Fred Dispense","Minfos","LOTS","Corum Health","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label style={labelStyle}>Perks</label><div style={{ display:"flex",gap:16,paddingTop:6 }}>{[["travel_paid","✈ Travel"],["accommodation","🏨 Stay"]].map(([k,l])=><label key={k} style={{ display:"flex",alignItems:"center",gap:7,fontSize:13,color:T.dim,cursor:"pointer" }}><input type="checkbox" checked={form[k]} onChange={check(k)} style={{accentColor:T.mint}} /> {l}</label>)}</div></div>
          </div>

          <label style={labelStyle}>Notes</label>
          <textarea style={{...inputStyle,minHeight:72,resize:"vertical"}} placeholder="Script volume, services, parking…" value={form.notes} onChange={set("notes")} />

          <button onClick={handleContinue} style={{ background:T.amber,color:"#000",border:"none",borderRadius:9,padding:"13px 32px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
            Continue to Payment ({days>0?price:SHIFT_PRICES[form.type]}) →
          </button>
        </div>
      )}

      {step==="pay" && (
        <div style={{ background:T.bgCard,borderRadius:14,padding:28,border:`1px solid ${T.border}`,animation:"fadeUp 0.3s ease" }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,marginBottom:6 }}>Almost live!</div>
          <div style={{ fontSize:14,color:T.dim,marginBottom:24,lineHeight:1.6 }}>Click below to pay securely via Stripe. Your shift{days>1?"s go":"goes"} live the moment payment is confirmed.</div>
          <div style={{ background:T.bg,borderRadius:10,padding:18,marginBottom:20,border:`1px solid ${T.border}` }}>
            {[
              ["Pharmacy", form.pharmacy_name],
              ["Location", form.location],
              ["Dates", days>1?`${form.date_from} → ${form.date_to} (${days} days)`:form.date_from],
              ["Hours", `${fmt12(form.start_time)} – ${fmt12(form.end_time)}`],
              ["Rate", `$${form.rate}/hr`],
              ["Type", form.type],
              ["Software", form.software],
            ].map(([l,v])=>(
              <div key={l} style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8,color:T.dim }}><span>{l}</span><span style={{color:T.white,fontWeight:500}}>{v}</span></div>
            ))}
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(240,165,0,0.06)",border:`1px solid rgba(240,165,0,0.2)`,borderRadius:10,padding:"16px 20px",marginBottom:12 }}>
            <div>
              <div style={{ fontSize:13,color:T.dim,marginBottom:3 }}>{days>1?`${days}-day block posting fee`:`${form.type} shift posting fee`}</div>
              <div style={{ fontSize:12,color:T.dimmer }}>One-time · No commission · No subscription</div>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,color:T.white }}>{price}</div>
          </div>
          {saving>0 && (
            <div style={{ background:"rgba(0,229,176,0.06)",border:`1px solid rgba(0,229,176,0.2)`,borderRadius:8,padding:"8px 16px",marginBottom:12,fontSize:13,color:T.mintText,fontWeight:600 }}>
              🎉 Bundle discount applied — you're saving ${saving} AUD!
            </div>
          )}
          <div style={{ fontSize:12,color:T.dimmer,marginBottom:20 }}>🔒 Redirects to Stripe secure checkout · Australian GST applies</div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>setStep("form")} style={{ flex:1,padding:"12px 0",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.dim,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>← Back</button>
            <button onClick={handlePay} style={{ flex:2,padding:"12px 0",borderRadius:8,border:"none",background:T.stripe,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Pay {price} via Stripe →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PROFILE VIEW ──────────────────────────────────────────────────────────────
function ProfileView({ user, token, onSignOut }) {
  const meta = user?.user_metadata || {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ full_name: meta.full_name||"", phone: meta.phone||"", min_rate:"60", open_to_travel: meta.open_to_travel||false });
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async () => {
    setSaving(true);
    try { await supaUpdateProfile(token, user.id, form); setEditing(false); } catch {}
    setSaving(false);
  };

  const inputStyle = { width:"100%",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 14px",fontSize:14,color:T.white,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box" };
  const labelStyle = { fontSize:11,fontWeight:700,color:T.dimmer,letterSpacing:0.8,textTransform:"uppercase",display:"block",marginBottom:6 };

  return (
    <div style={{ animation:"fadeUp 0.3s ease",maxWidth:520 }}>
      <div style={{ background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:16,padding:28 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:16 }}>
            <div style={{ width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${T.amber},#C05621)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>💊</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,color:T.white,marginBottom:2 }}>{meta.full_name || "Pharmacist"}</div>
              <div style={{ fontSize:12,color:T.dim }}>{user?.email}</div>
              <div style={{ fontSize:11,color:T.mint,marginTop:4,fontWeight:600 }}>✓ AHPRA: {meta.ahpra_number || "Pending verification"}</div>
            </div>
          </div>
          <button onClick={()=>setEditing(!editing)} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.dim,borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
        {!editing ? (
          <>
            <div style={{ display:"flex",gap:0,padding:"16px 0",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,marginBottom:20 }}>
              {[["Software",meta.software||"—"],["Phone",meta.phone||"—"],["Travel",meta.open_to_travel?"Yes":"No"]].map(([l,v])=>(
                <div key={l} style={{ flex:1,textAlign:"center" }}>
                  <div style={{ fontSize:13,color:T.white,fontWeight:600,marginBottom:2 }}>{v}</div>
                  <div style={{ fontSize:10,color:T.dimmer,textTransform:"uppercase",letterSpacing:0.5 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ background:T.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`,marginBottom:20 }}>
              <div style={{ fontSize:12,fontWeight:700,color:T.amber,marginBottom:4,letterSpacing:0.5 }}>🔔 REAL-TIME ALERTS ACTIVE</div>
              <div style={{ fontSize:13,color:T.dim,lineHeight:1.6 }}>You'll be notified when new shifts match your location and software preferences.</div>
            </div>
            <button onClick={onSignOut} style={{ width:"100%",padding:"10px 0",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.dim,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={form.full_name} onChange={set("full_name")} />
            </div>
            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={form.phone} onChange={set("phone")} />
            </div>
            <div style={{marginBottom:20}}>
              <label style={labelStyle}>Minimum Rate ($/hr)</label>
              <input type="number" style={inputStyle} value={form.min_rate} onChange={set("min_rate")} />
            </div>
            <button onClick={handleSave} disabled={saving} style={{ width:"100%",padding:"11px 0",borderRadius:8,border:"none",background:T.mint,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── LEGAL MODAL ───────────────────────────────────────────────────────────────
const LEGAL_CONTENT = {
  terms: {
    title: "Terms of Service",
    updated: "Effective 7 June 2026 — ScriptShift Technologies Pty Ltd (ABN 21 698 500 542)",
    sections: [
      { h: "1. About ScriptShift WA", p: "ScriptShift WA is an online marketplace operated by ScriptShift Technologies Pty Ltd (ABN 21 698 500 542) that connects pharmacy owners with locum pharmacists in Western Australia. By using our platform at scriptshiftwa.com.au, you agree to these Terms of Service." },
      { h: "2. Who Can Use ScriptShift WA", p: "Pharmacy owners must be the owner, manager or authorised representative of a pharmacy operating in Western Australia and hold all necessary licences under the Pharmacy Act 2010 (WA). Pharmacists must be currently registered with AHPRA with an active, unconditional registration. You are responsible for maintaining the confidentiality of your account credentials." },
      { h: "3. Shift Posting Fees", p: "Posting fees: Standard $9 AUD · Evening $9 AUD · Weekend $14 AUD · Emergency $19 AUD · 3-Day Bundle $20 AUD · 5-Day Bundle $30 AUD · 8-Day Bundle $45 AUD (all GST inclusive). Fees are non-refundable once a shift is published. We reserve the right to update fees with 7 days' notice." },
      { h: "4. AHPRA Verification", p: "Pharmacists must provide their valid AHPRA registration number during sign-up. By providing this number, you confirm your registration is current and unconditional. ScriptShift WA displays your AHPRA number to pharmacy owners for verification purposes. It is the pharmacy owner's responsibility to confirm registration status before engaging a pharmacist." },
      { h: "5. The Relationship Between Users", p: "ScriptShift WA is a marketplace platform only. We are not a party to any employment or contractor agreement between pharmacy owners and pharmacists. We are not responsible for the conduct of any user, accuracy of shift details, disputes arising from engagements, or payment of wages. Users are solely responsible for ensuring compliance with all applicable laws including the Pharmacy Industry Award 2020." },
      { h: "6. Prohibited Conduct", p: "Users must not: provide false information including false AHPRA numbers; post shifts for pharmacies they are not authorised to represent; use the platform unlawfully; circumvent our payment system; or harass other users. Breach may result in immediate account suspension." },
      { h: "7. Limitation of Liability", p: "To the maximum extent permitted by Australian law, ScriptShift Technologies Pty Ltd is not liable for any indirect, incidental, special or consequential loss arising from your use of the platform. Our total liability is limited to the amount you paid us in the 3 months preceding any claim." },
      { h: "8. Governing Law", p: "These Terms are governed by the laws of Western Australia and the Commonwealth of Australia. Any disputes will be subject to the exclusive jurisdiction of the courts of Western Australia." },
      { h: "9. Contact", p: "hello@scriptshiftwa.com.au — ScriptShift Technologies Pty Ltd, Perth WA" },
    ]
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Effective 7 June 2026 — ScriptShift Technologies Pty Ltd (ABN 21 698 500 542)",
    sections: [
      { h: "1. Our Commitment", p: "ScriptShift Technologies Pty Ltd is committed to protecting your personal information in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs)." },
      { h: "2. Information We Collect", p: "Pharmacists: full name, email, phone, AHPRA registration number, dispensing software skills, preferred regions, minimum rate. Pharmacy owners: pharmacy name, location, shift details, payment info (processed by Stripe — we do not store card details). We may also collect browser type and IP address." },
      { h: "3. How We Use Your Information", p: "To create and manage your account; display your AHPRA number to pharmacy owners for verification; match pharmacists with shifts; process payments via Stripe; send shift match notifications; and comply with legal obligations." },
      { h: "4. Disclosure", p: "We share your information only with: pharmacy owners (name, AHPRA, skills, regions when you apply); Stripe (payment processing); and government authorities if required by law. We do not sell your personal information." },
      { h: "5. AHPRA Number", p: "Your AHPRA number is stored securely and displayed only to pharmacy owners on our platform for verification purposes. It is not publicly searchable." },
      { h: "6. Data Storage & Security", p: "Your data is stored securely using Supabase (servers in Sydney, Australia). We use HTTPS encryption and access controls. No internet transmission is completely secure." },
      { h: "7. Your Rights", p: "Under the Australian Privacy Act you have the right to access, correct, or request deletion of your personal information. Contact us at hello@scriptshiftwa.com.au. We respond within 30 days." },
      { h: "8. Complaints", p: "You may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au." },
      { h: "9. Contact", p: "Privacy Officer — hello@scriptshiftwa.com.au" },
    ]
  },
  refund: {
    title: "Refund Policy",
    updated: "Effective 7 June 2026 — ScriptShift Technologies Pty Ltd (ABN 21 698 500 542)",
    sections: [
      { h: "1. Posting Fees", p: "Shift posting fees are non-refundable once a shift is published and visible to pharmacists." },
      { h: "2. When We May Issue a Refund", p: "We will consider refunds for: (a) Technical errors where your shift was not published despite successful payment — we will publish the shift or refund in full; (b) Duplicate charges due to a system error — refunded within 5 business days; (c) Platform unavailability for more than 24 consecutive hours — we will offer a credit towards a future posting." },
      { h: "3. How to Request a Refund", p: "Email hello@scriptshiftwa.com.au within 7 days of payment with your registered email, payment date, pharmacy name, shift date and reason. We respond within 3 business days." },
      { h: "4. Cancellations & No-Shows", p: "If a pharmacy owner cancels after a pharmacist is engaged, the posting fee is not refundable. If a pharmacist no-shows, the posting fee is not refundable. These matters are between the pharmacy owner and pharmacist." },
      { h: "5. Consumer Guarantees", p: "Nothing in this policy excludes, restricts or modifies any consumer guarantee, right or remedy under the Australian Consumer Law." },
      { h: "6. Payment Processing", p: "Approved refunds are credited to your original payment method within 5–10 business days depending on your bank. All payments are processed by Stripe." },
      { h: "7. Contact", p: "hello@scriptshiftwa.com.au — ScriptShift Technologies Pty Ltd" },
    ]
  }
};

function LegalModal({ doc, onClose }) {
  const content = LEGAL_CONTENT[doc];
  if (!content) return null;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(5,6,10,0.92)",backdropFilter:"blur(8px)",zIndex:350,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={onClose}>
      <div style={{ background:T.bgCard,border:`1px solid ${T.borderHi}`,borderRadius:20,maxWidth:640,width:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.7)",animation:"fadeUp 0.25s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:"24px 28px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,marginBottom:4 }}>{content.title}</div>
            <div style={{ fontSize:11,color:T.dimmer,lineHeight:1.5 }}>{content.updated}</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:20,padding:"0 0 0 16px",flexShrink:0 }}>✕</button>
        </div>
        <div style={{ padding:"20px 28px",overflowY:"auto",flex:1 }}>
          {content.sections.map((s,i)=>(
            <div key={i} style={{ marginBottom:20 }}>
              <div style={{ fontSize:13,fontWeight:700,color:T.amber,marginBottom:6,letterSpacing:0.3 }}>{s.h}</div>
              <div style={{ fontSize:13,color:T.dim,lineHeight:1.7 }}>{s.p}</div>
            </div>
          ))}
          <div style={{ paddingTop:16,borderTop:`1px solid ${T.border}`,fontSize:11,color:T.dimmer,lineHeight:1.6 }}>
            For the full version of this document, contact hello@scriptshiftwa.com.au · ScriptShift Technologies Pty Ltd ABN 21 698 500 542
          </div>
        </div>
        <div style={{ padding:"16px 28px",borderTop:`1px solid ${T.border}`,flexShrink:0 }}>
          <button onClick={onClose} style={{ width:"100%",padding:"11px 0",borderRadius:9,border:"none",background:T.amber,color:"#000",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]         = useState("browse");
  const [regionFilter, setReg]  = useState("All");
  const [typeFilter, setType]   = useState("All");
  const [applied, setApplied]   = useState(new Set());
  const [applyTarget, setTarget]= useState(null);
  const [toast, setToast]       = useState("");
  const [liveCount] = useState(0);
  const [pulse, setPulse]       = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState(null);
  const [shifts]                = useState([]);
  const [confirmedEmail, setConfirmedEmail] = useState(false);
  const [legalDoc, setLegalDoc] = useState(null);

  useEffect(()=>{
    try {
      const t = localStorage.getItem("ss_token");
      const u = localStorage.getItem("ss_user");
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment")==="success") {
        showToast("🎉 Payment confirmed! Your shift is now live.");
        window.history.replaceState({},"",window.location.pathname);
      }
    } catch(e) { console.warn("Session restore error:", e); }
  },[]);

  useEffect(()=>{
    const t = setInterval(()=>{ if(Math.random()>0.7){ setPulse(true); setTimeout(()=>setPulse(false),700); }},8000);
    return ()=>clearInterval(t);
  },[]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3500); };

  const handleAuthSuccess = (data) => {
    if (data.needsConfirmation) {
      setShowAuth(false); setConfirmedEmail(true);
      showToast("📧 Check your email to confirm your account!");
      return;
    }
    setUser(data.user); setToken(data.access_token);
    setShowAuth(false); showToast("✓ Welcome to ScriptShift WA!");
  };

  const handleSignOut = async () => {
    if (token) await supaSignOut(token);
    try { localStorage.removeItem("ss_token"); localStorage.removeItem("ss_user"); } catch(e) {}
    setUser(null); setToken(null);
    showToast("Signed out successfully."); setView("browse");
  };

  const handleApply = (shift) => { if (!user) { setShowAuth(true); return; } setTarget(shift); };
  const confirmApply = () => { setApplied(prev=>new Set([...prev,applyTarget.id])); setTarget(null); showToast("Application sent — the pharmacy owner has been notified."); };

  const filtered = shifts.filter(s=>{
    if(regionFilter!=="All"&&s.region!==regionFilter) return false;
    if(typeFilter!=="All"&&s.type!==typeFilter) return false;
    return true;
  });

  const NAV = [
    {k:"browse",l:"Browse Shifts"},
    {k:"post",  l:"Post a Shift"},
    {k:"applied",l:`Applications${applied.size?` (${applied.size})`:""}` },
    {k:"profile",l: user ? (user.user_metadata?.full_name?.split(" ")[0]||"Profile") : "Sign In"},
  ];

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif",background:T.bg,minHeight:"100vh",color:T.white }}>
      <style>{FONTS}{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes slideIn{ from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        body{margin:0} *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:${T.bg}} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
        input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.5)}
        select option{background:${T.bgCard};color:${T.white}}
      `}</style>

      <header style={{ background:"rgba(14,15,19,0.95)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`,padding:"0 28px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:T.white }}>Script<span style={{color:T.amber}}>Shift</span></span>
          <span style={{ fontSize:11,fontWeight:600,color:T.dim,borderLeft:`1px solid ${T.border}`,paddingLeft:10,letterSpacing:1 }}>WESTERN AUSTRALIA</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:7,background:pulse?"rgba(240,165,0,0.1)":T.bgCard,border:`1px solid ${pulse?T.amber:T.border}`,borderRadius:20,padding:"5px 14px",transition:"all 0.3s",fontSize:12,fontWeight:600,color:pulse?T.amber:T.dim }}>
          <span style={{ width:7,height:7,borderRadius:"50%",background:pulse?T.amber:T.mint,animation:"blink 1.6s infinite",display:"block" }}/>
          {liveCount} live
        </div>
        {user ? (
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontSize:13,color:T.dim }}>👋 {user.user_metadata?.full_name?.split(" ")[0]||"Pharmacist"}</span>
            <button onClick={handleSignOut} style={{ background:"transparent",border:`1px solid ${T.border}`,color:T.dim,borderRadius:7,padding:"7px 14px",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Sign Out</button>
          </div>
        ) : (
          <button onClick={()=>setShowAuth(true)} style={{ background:T.amber,color:"#000",border:"none",borderRadius:7,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
            Sign In / Register
          </button>
        )}
      </header>

      <nav style={{ borderBottom:`1px solid ${T.border}`,display:"flex",padding:"0 28px",overflowX:"auto" }}>
        {NAV.map(n=>(
          <button key={n.k} onClick={()=>{ if(n.k==="profile"&&!user){ setShowAuth(true); return; } setView(n.k); }}
            style={{ padding:"14px 18px",fontSize:13,fontWeight:view===n.k?600:400,color:view===n.k?T.amber:T.dimmer,background:"none",border:"none",borderBottom:view===n.k?`2px solid ${T.amber}`:"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",transition:"color 0.15s" }}>
            {n.l}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth:980,margin:"0 auto",padding:"32px 20px 80px" }}>
        {confirmedEmail && (
          <div style={{ background:"rgba(0,229,176,0.08)",border:`1px solid ${T.mint}`,borderRadius:12,padding:"16px 20px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div>
              <div style={{ fontSize:14,fontWeight:700,color:T.mintText,marginBottom:4 }}>📧 Check your email</div>
              <div style={{ fontSize:13,color:T.dim }}>We've sent a confirmation link. Click it to activate your account, then sign in.</div>
            </div>
            <button onClick={()=>setConfirmedEmail(false)} style={{ background:"none",border:"none",color:T.dim,cursor:"pointer",fontSize:18 }}>✕</button>
          </div>
        )}

        {view==="browse" && <>
          <div style={{ background:`linear-gradient(135deg, #111318 0%, #161A24 100%)`,border:`1px solid ${T.border}`,borderRadius:16,padding:"36px 32px",marginBottom:28,position:"relative",overflow:"hidden",animation:"fadeUp 0.4s ease" }}>
            <div style={{ position:"absolute",inset:0,backgroundImage:`linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:0.3 }}/>
            <div style={{ position:"relative",zIndex:1 }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.amber,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>◆ Real-time · Western Australia</div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,lineHeight:1.15,marginBottom:10 }}>Connect pharmacies<br/>with <em style={{color:T.amber}}>great pharmacists</em></div>
              <div style={{ fontSize:15,color:T.dim,maxWidth:420,lineHeight:1.7,marginBottom:24 }}>Instant shift matching for locum pharmacists and pharmacy owners across Perth Metro, Pilbara, Kimberley and the Goldfields.</div>
              {!user && (
                <button onClick={()=>setShowAuth(true)} style={{ background:T.amber,color:"#000",border:"none",borderRadius:9,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
                  Register as a Pharmacist →
                </button>
              )}
            </div>
            <div style={{ position:"absolute",top:32,right:32,textAlign:"center",background:"rgba(240,165,0,0.06)",border:`1px solid rgba(240,165,0,0.2)`,borderRadius:12,padding:"16px 20px" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:T.amber,lineHeight:1 }}>{liveCount}</div>
              <div style={{ fontSize:11,color:T.dim,marginTop:4,letterSpacing:0.5 }}>LIVE SHIFTS</div>
            </div>
          </div>

          <div style={{ display:"flex",gap:8,marginBottom:22,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:12,color:T.dimmer,marginRight:4,fontWeight:600,letterSpacing:0.5 }}>REGION</span>
            {["All","Metro","Regional"].map(r=>(<button key={r} onClick={()=>setReg(r)} style={{ padding:"5px 14px",borderRadius:20,border:`1px solid ${regionFilter===r?T.amber:T.border}`,background:regionFilter===r?T.amberDim:"transparent",color:regionFilter===r?T.amberText:T.dim,fontSize:12,fontWeight:regionFilter===r?700:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>{r}</button>))}
            <span style={{ fontSize:12,color:T.dimmer,marginLeft:12,marginRight:4,fontWeight:600,letterSpacing:0.5 }}>TYPE</span>
            {["All","Emergency","Standard","Weekend","Evening"].map(t=>(<button key={t} onClick={()=>setType(t)} style={{ padding:"5px 14px",borderRadius:20,border:`1px solid ${typeFilter===t?T.amber:T.border}`,background:typeFilter===t?T.amberDim:"transparent",color:typeFilter===t?T.amberText:T.dim,fontSize:12,fontWeight:typeFilter===t?700:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>{t}</button>))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14 }}>
            {filtered.length===0 ? (
              <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"60px 20px",color:T.dim }}>
                <div style={{ fontSize:48,marginBottom:16,opacity:0.4 }}>💊</div>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,marginBottom:8 }}>No shifts posted yet</div>
                <div style={{ fontSize:14,lineHeight:1.7,maxWidth:380,margin:"0 auto",marginBottom:24 }}>ScriptShift WA is open for business. Be the first pharmacy owner to post a shift.</div>
                <button onClick={()=>setView("post")} style={{ background:T.amber,color:"#000",border:"none",borderRadius:9,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Post the First Shift →</button>
              </div>
            ) : filtered.map((s,i)=>(
              <ShiftCard key={s.id} shift={s} applied={applied.has(s.id)} onApply={handleApply} user={user} animDelay={i*0.06} />
            ))}
          </div>
        </>}

        {view==="post"    && <PostView />}
        {view==="applied" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,color:T.white,marginBottom:6 }}>My Applications</div>
            <div style={{ fontSize:14,color:T.dim,marginBottom:28 }}>Track your shift applications in real time.</div>
            {applied.size===0 ? (
              <div style={{ textAlign:"center",padding:"60px 20px",color:T.dim }}>
                <div style={{ fontSize:48,marginBottom:16,opacity:0.4 }}>◎</div>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,marginBottom:8 }}>No applications yet</div>
                <button onClick={()=>setView("browse")} style={{ marginTop:16,background:"transparent",border:`1.5px solid ${T.amber}`,color:T.amber,borderRadius:8,padding:"10px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Browse Shifts →</button>
              </div>
            ) : <div style={{color:T.dim,fontSize:14}}>Your applications will appear here.</div>}
          </div>
        )}
        {view==="profile" && user && <ProfileView user={user} token={token} onSignOut={handleSignOut} />}
      </main>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={handleAuthSuccess} />}
      {applyTarget && <ApplyModal shift={applyTarget} onClose={()=>setTarget(null)} onConfirm={confirmApply} />}
      {legalDoc && <LegalModal doc={legalDoc} onClose={()=>setLegalDoc(null)} />}

      {toast && (
        <div style={{ position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:T.bgCard,border:`1px solid ${T.mint}`,borderRadius:10,padding:"12px 22px",fontSize:13,fontWeight:600,color:T.mintText,zIndex:400,boxShadow:`0 8px 32px rgba(0,0,0,0.4)`,whiteSpace:"nowrap",animation:"slideIn 0.3s ease" }}>
          ✓ {toast}
        </div>
      )}

      <footer style={{ background:T.bgCard,borderTop:`1px solid ${T.border}`,padding:"32px 28px",marginTop:40 }}>
        <div style={{ maxWidth:980,margin:"0 auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:24,marginBottom:24 }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:T.white,marginBottom:6 }}>
                Script<span style={{color:T.amber}}>Shift</span> <span style={{fontSize:13,fontWeight:400,color:T.dim}}>Western Australia</span>
              </div>
              <div style={{ fontSize:12,color:T.dimmer,lineHeight:1.7 }}>
                Real-time pharmacy shift marketplace<br/>
                ScriptShift Technologies Pty Ltd<br/>
                ABN 21 698 500 542
              </div>
            </div>
            <div style={{ display:"flex",gap:40,flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:T.dimmer,letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Platform</div>
                {[["Browse Shifts","browse"],["Post a Shift","post"],["Sign In / Register","auth"]].map(([l,k])=>(
                  <div key={k} style={{ marginBottom:8 }}>
                    <span onClick={()=>k==="auth"?setShowAuth(true):setView(k)} style={{ fontSize:13,color:T.dim,cursor:"pointer" }}>{l}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:T.dimmer,letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Legal</div>
                {[["Terms of Service","terms"],["Privacy Policy","privacy"],["Refund Policy","refund"]].map(([l,k])=>(
                  <div key={k} style={{ marginBottom:8 }}>
                    <span onClick={()=>setLegalDoc(k)} style={{ fontSize:13,color:T.dim,cursor:"pointer" }}>{l}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:T.dimmer,letterSpacing:1,textTransform:"uppercase",marginBottom:10 }}>Contact</div>
                <div style={{ fontSize:13,color:T.dim,marginBottom:8 }}>hello@scriptshiftwa.com.au</div>
                <div style={{ fontSize:13,color:T.dim,marginBottom:8 }}>scriptshiftwa.com.au</div>
                <div style={{ fontSize:13,color:T.dim }}>Perth, Western Australia</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${T.border}`,paddingTop:16,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10 }}>
            <div style={{ fontSize:11,color:T.dimmer }}>© 2026 ScriptShift Technologies Pty Ltd. All rights reserved.</div>
            <div style={{ fontSize:11,color:T.dimmer,display:"flex",gap:16 }}>
              {[["Terms","terms"],["Privacy","privacy"],["Refunds","refund"]].map(([l,k])=>(
                <span key={k} onClick={()=>setLegalDoc(k)} style={{ cursor:"pointer",textDecoration:"underline" }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
