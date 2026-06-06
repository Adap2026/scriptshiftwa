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
// Replace these with your actual Stripe Payment Link URLs from dashboard.stripe.com
// Go to: Stripe Dashboard → Payment Links → Create payment link
// Create one for each price point and paste the URL below
const STRIPE_PAYMENT_LINKS = {
  Standard: "https://buy.stripe.com/00w4gs5EVe0CcKy0Wva7C00",   // $14 AUD
  Evening:  "https://buy.stripe.com/9B64gs4ARaOq39Y7kTa7C01",    // $14 AUD
  Weekend:  "https://buy.stripe.com/5kQ6oA0kBaOqdOCax5a7C02",    // $19 AUD
  Emergency:"https://buy.stripe.com/9B628kebr4q225UgVta7C03",    // $24 AUD
};

const SHIFT_PRICES = {
  Standard:"$14 AUD", Evening:"$14 AUD",
  Weekend:"$19 AUD", Emergency:"$24 AUD",
};

// ── Mock shifts ────────────────────────────────────────────────────────────────
const MOCK = [
  { id:"s1", pharmacy_name:"Karratha Day & Night Pharmacy", location:"Karratha, Pilbara",   region:"Regional", shift_date:"Today",       start_time:"14:00", end_time:"22:00", rate:85, type:"Emergency", software:"Fred Dispense", scripts_min:120, scripts_max:150, travel_paid:true,  accommodation:true,  applicant_count:2,  posted:"22 min ago" },
  { id:"s2", pharmacy_name:"Cottesloe Pharmacy",            location:"Cottesloe, Perth Metro",region:"Metro",    shift_date:"Tomorrow",    start_time:"09:00", end_time:"17:00", rate:65, type:"Standard",  software:"Minfos",        scripts_min:80,  scripts_max:100, travel_paid:false, accommodation:false, applicant_count:5,  posted:"1 hr ago" },
  { id:"s3", pharmacy_name:"Broome Central Chemist",        location:"Broome, Kimberley",    region:"Regional", shift_date:"Sat 31 May",  start_time:"08:00", end_time:"18:00", rate:95, type:"Weekend",   software:"Fred Dispense", scripts_min:100, scripts_max:130, travel_paid:true,  accommodation:true,  applicant_count:1,  posted:"3 hrs ago" },
  { id:"s4", pharmacy_name:"Subiaco Wellness Pharmacy",     location:"Subiaco, Perth Metro", region:"Metro",    shift_date:"Mon 26 May",  start_time:"13:00", end_time:"21:00", rate:68, type:"Evening",   software:"Minfos",        scripts_min:60,  scripts_max:80,  travel_paid:false, accommodation:false, applicant_count:8,  posted:"5 hrs ago" },
  { id:"s5", pharmacy_name:"Kalgoorlie SuperPharmacy",      location:"Kalgoorlie, Goldfields",region:"Regional", shift_date:"Sun 1 Jun",  start_time:"09:00", end_time:"17:00", rate:90, type:"Weekend",   software:"LOTS",          scripts_min:90,  scripts_max:120, travel_paid:true,  accommodation:false, applicant_count:0,  posted:"7 hrs ago" },
  { id:"s6", pharmacy_name:"Fremantle Health Hub",          location:"Fremantle, Perth Metro",region:"Metro",    shift_date:"Tue 27 May", start_time:"09:00", end_time:"17:00", rate:62, type:"Standard",  software:"Fred Dispense", scripts_min:70,  scripts_max:90,  travel_paid:false, accommodation:false, applicant_count:11, posted:"12 hrs ago" },
];

const fmt12 = (t) => { const [h,m]=t.split(":"); const hr=+h; return `${hr>12?hr-12:hr||12}:${m}${hr>=12?"pm":"am"}`; };

// ── SHIFT CARD ─────────────────────────────────────────────────────────────────
function ShiftCard({ shift, applied, onApply, animDelay }) {
  const badge = SHIFT_BADGE[shift.type] || SHIFT_BADGE.Standard;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        background: hovered ? T.bgHover : T.bgCard,
        border:`1px solid ${hovered ? T.borderHi : T.border}`,
        borderRadius:12, padding:"22px 22px 18px",
        transition:"all 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${badge.border}` : "none",
        animation:`fadeUp 0.4s ease ${animDelay}s both`,
        position:"relative", overflow:"hidden",
      }}
    >
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2, background:applied?T.mint:badge.dot, opacity:hovered?1:0.5, transition:"opacity 0.18s" }}/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
        <div style={{ flex:1,paddingRight:12 }}>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:15,color:T.white,lineHeight:1.3,marginBottom:4 }}>{shift.pharmacy_name}</div>
          <div style={{ fontSize:12,color:T.dim,display:"flex",alignItems:"center",gap:5 }}><span style={{opacity:0.6}}>◉</span>{shift.location}</div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6 }}>
          <span style={{ fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,background:badge.bg,color:badge.color,border:`1px solid ${badge.border}`,letterSpacing:0.5,textTransform:"uppercase" }}>{shift.type}</span>
          <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6, background:shift.region==="Regional"?T.amberDim:"rgba(255,255,255,0.05)", color:shift.region==="Regional"?T.amberText:T.dim, border:`1px solid ${shift.region==="Regional"?T.amberDim:T.border}` }}>{shift.region}</span>
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
        <button
          onClick={()=>!applied&&onApply(shift)}
          style={{
            width:"100%", background:applied?T.mintDim:"transparent",
            color:applied?T.mintText:T.amber,
            border:`1.5px solid ${applied?T.mint:T.amber}`,
            borderRadius:8, padding:"10px 0", fontSize:13, fontWeight:700,
            cursor:applied?"default":"pointer", fontFamily:"'Outfit',sans-serif",
            transition:"all 0.15s",
          }}
        >{applied ? "✓ Applied" : "Apply for this shift →"}</button>
      </div>
    </div>
  );
}

// ── APPLY MODAL ────────────────────────────────────────────────────────────────
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

// ── POST SHIFT with Stripe Payment Links ───────────────────────────────────────
function PostView() {
  const [form, setForm] = useState({
    pharmacy_name:"", location:"", region:"Metro", shift_date:"",
    start_time:"09:00", end_time:"17:00", rate:"", type:"Standard",
    software:"Fred Dispense", travel_paid:false, accommodation:false, notes:""
  });
  const [step, setStep] = useState("form"); // form | pay
  const [error, setError] = useState("");

  const set  = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const check= k => e => setForm(p=>({...p,[k]:e.target.checked}));

  const handleContinue = () => {
    if (!form.pharmacy_name || !form.location || !form.shift_date || !form.rate) {
      setError("Please fill in all required fields — Pharmacy Name, Location, Date and Rate."); return;
    }
    setError("");
    setStep("pay");
  };

  // Redirect to Stripe Payment Link
  const handlePay = () => {
    const link = STRIPE_PAYMENT_LINKS[form.type];
    // Add shift details as URL params so you can see them in Stripe dashboard
    const params = new URLSearchParams({
      prefilled_email: "",
      client_reference_id: `${form.pharmacy_name}_${form.shift_date}`.replace(/\s+g/,"_"),
    });
    // Open Stripe Payment Link in same tab
    window.location.href = `${link}?${params.toString()}`;
  };

  const inputStyle = { width:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:14,color:T.white,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:18 };
  const labelStyle = { fontSize:11,fontWeight:700,color:T.dimmer,letterSpacing:0.8,textTransform:"uppercase",display:"block",marginBottom:6 };

  return (
    <div style={{ maxWidth:580,animation:"fadeUp 0.3s ease" }}>
      <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,color:T.white,marginBottom:6 }}>Post a Shift</div>
      <div style={{ fontSize:14,color:T.dim,marginBottom:28,lineHeight:1.6 }}>
        Your shift goes live the moment payment is confirmed. Posting fee: <span style={{color:T.amberText}}>$14–$24 AUD</span> one-time, no commission ever.
      </div>

      {step==="form" && (
        <div style={{ background:T.bgCard,borderRadius:14,padding:28,border:`1px solid ${T.border}` }}>
          {error && <div style={{ background:T.coralDim,border:`1px solid ${T.coral}`,borderRadius:8,padding:"10px 14px",fontSize:13,color:T.coral,marginBottom:18 }}>⚠ {error}</div>}

          <label style={labelStyle}>Pharmacy Name *</label>
          <input style={inputStyle} placeholder="e.g. Karratha Day & Night Pharmacy" value={form.pharmacy_name} onChange={set("pharmacy_name")} />

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Location *</label><input style={inputStyle} placeholder="Suburb, City WA" value={form.location} onChange={set("location")} /></div>
            <div><label style={labelStyle}>Region</label>
              <select style={inputStyle} value={form.region} onChange={set("region")}>
                <option>Metro</option><option>Regional</option>
              </select>
            </div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Date *</label><input type="date" style={inputStyle} value={form.shift_date} onChange={set("shift_date")} /></div>
            <div><label style={labelStyle}>Shift Type</label>
              <select style={inputStyle} value={form.type} onChange={set("type")}>
                {["Standard","Emergency","Weekend","Evening"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Start</label><input type="time" style={inputStyle} value={form.start_time} onChange={set("start_time")} /></div>
            <div><label style={labelStyle}>End</label><input type="time" style={inputStyle} value={form.end_time} onChange={set("end_time")} /></div>
            <div><label style={labelStyle}>Rate ($/hr) *</label><input type="number" style={inputStyle} placeholder="85" value={form.rate} onChange={set("rate")} /></div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div><label style={labelStyle}>Dispensing Software</label>
              <select style={inputStyle} value={form.software} onChange={set("software")}>
                {["Fred Dispense","Minfos","LOTS","Corum Health","Other"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Perks</label>
              <div style={{ display:"flex",gap:16,paddingTop:6 }}>
                {[["travel_paid","✈ Travel"],["accommodation","🏨 Stay"]].map(([k,l])=>(
                  <label key={k} style={{ display:"flex",alignItems:"center",gap:7,fontSize:13,color:T.dim,cursor:"pointer" }}>
                    <input type="checkbox" checked={form[k]} onChange={check(k)} style={{accentColor:T.mint}} /> {l}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <label style={labelStyle}>Notes</label>
          <textarea style={{...inputStyle,minHeight:72,resize:"vertical"}} placeholder="Script volume, services, parking…" value={form.notes} onChange={set("notes")} />

          <button onClick={handleContinue} style={{ background:T.amber,color:"#000",border:"none",borderRadius:9,padding:"13px 32px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
            Continue to Payment ({SHIFT_PRICES[form.type]}) →
          </button>
        </div>
      )}

      {step==="pay" && (
        <div style={{ background:T.bgCard,borderRadius:14,padding:28,border:`1px solid ${T.border}`,animation:"fadeUp 0.3s ease" }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,marginBottom:6 }}>Almost live!</div>
          <div style={{ fontSize:14,color:T.dim,marginBottom:24,lineHeight:1.6 }}>
            Your shift details are saved. Click below to pay securely via Stripe. Your shift goes live the moment payment is confirmed.
          </div>

          {/* Shift summary */}
          <div style={{ background:T.bg,borderRadius:10,padding:18,marginBottom:24,border:`1px solid ${T.border}` }}>
            {[
              ["Pharmacy", form.pharmacy_name],
              ["Location", form.location],
              ["Date", form.shift_date],
              ["Hours", `${fmt12(form.start_time)} – ${fmt12(form.end_time)}`],
              ["Rate", `$${form.rate}/hr`],
              ["Type", form.type],
              ["Software", form.software],
            ].map(([l,v])=>(
              <div key={l} style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:8,color:T.dim }}>
                <span>{l}</span><span style={{color:T.white,fontWeight:500}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Price box */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(240,165,0,0.06)",border:`1px solid rgba(240,165,0,0.2)`,borderRadius:10,padding:"16px 20px",marginBottom:20 }}>
            <div>
              <div style={{ fontSize:13,color:T.dim,marginBottom:3 }}>{form.type} shift posting fee</div>
              <div style={{ fontSize:12,color:T.dimmer }}>One-time · No commission · No subscription</div>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,color:T.white }}>{SHIFT_PRICES[form.type]}</div>
          </div>

          <div style={{ fontSize:12,color:T.dimmer,marginBottom:20,display:"flex",alignItems:"center",gap:6 }}>
            🔒 Redirects to Stripe secure checkout · Australian GST applies
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>setStep("form")} style={{ flex:1,padding:"12px 0",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.dim,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>← Back</button>
            <button onClick={handlePay} style={{ flex:2,padding:"12px 0",borderRadius:8,border:"none",background:T.stripe,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",letterSpacing:0.3 }}>
              Pay {SHIFT_PRICES[form.type]} via Stripe →
            </button>
          </div>

          <div style={{ textAlign:"center",fontSize:11,color:T.dimmer,marginTop:14 }}>
            After payment your shift is posted live instantly ✓
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function ScriptShiftWA() {
  const [view, setView]           = useState("browse");
  const [regionFilter, setRegion] = useState("All");
  const [typeFilter, setType]     = useState("All");
  const [applied, setApplied]     = useState(new Set());
  const [applyTarget, setTarget]  = useState(null);
  const [toast, setToast]         = useState("");
  const [liveCount, setLive]      = useState(MOCK.length);
  const [pulse, setPulse]         = useState(false);

  // Check if returning from successful Stripe payment
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    if(params.get("payment")==="success"){
      showToast("🎉 Payment confirmed! Your shift is now live.");
      window.history.replaceState({},"",window.location.pathname);
      setView("browse");
    }
  },[]);

  useEffect(()=>{
    const t = setInterval(()=>{
      if(Math.random()>0.65){ setLive(c=>c+1); setPulse(true); setTimeout(()=>setPulse(false),700); }
    },7000);
    return ()=>clearInterval(t);
  },[]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3500); };

  const confirmApply = () => {
    setApplied(prev=>new Set([...prev,applyTarget.id]));
    setTarget(null);
    showToast("Application sent — the pharmacy owner has been notified.");
  };

  const filtered = MOCK.filter(s=>{
    if(regionFilter!=="All"&&s.region!==regionFilter) return false;
    if(typeFilter!=="All"&&s.type!==typeFilter) return false;
    return true;
  });

  const NAV = [
    {k:"browse",l:"Browse Shifts"},
    {k:"post",  l:"Post a Shift"},
    {k:"applied",l:`Applications${applied.size?` (${applied.size})`:""}` },
    {k:"profile",l:"Profile"},
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
        select option { background: ${T.bgCard}; color: ${T.white}; }
      `}</style>

      {/* Header */}
      <header style={{ background:"rgba(14,15,19,0.95)",backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`,padding:"0 28px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:T.white,letterSpacing:"-0.5px" }}>Script<span style={{color:T.amber}}>Shift</span></span>
          <span style={{ fontSize:11,fontWeight:600,color:T.dim,borderLeft:`1px solid ${T.border}`,paddingLeft:10,letterSpacing:1 }}>WESTERN AUSTRALIA</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:7,background:pulse?"rgba(240,165,0,0.1)":T.bgCard,border:`1px solid ${pulse?T.amber:T.border}`,borderRadius:20,padding:"5px 14px",transition:"all 0.3s ease",fontSize:12,fontWeight:600,color:pulse?T.amber:T.dim }}>
          <span style={{ width:7,height:7,borderRadius:"50%",background:pulse?T.amber:T.mint,animation:"blink 1.6s infinite",display:"block" }}/>
          {liveCount} live
        </div>
        <button onClick={()=>setView("post")} style={{ background:T.amber,color:"#000",border:"none",borderRadius:7,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>
          Post a Shift
        </button>
      </header>

      {/* Nav */}
      <nav style={{ borderBottom:`1px solid ${T.border}`,display:"flex",padding:"0 28px",overflowX:"auto" }}>
        {NAV.map(n=>(
          <button key={n.k} onClick={()=>setView(n.k)} style={{ padding:"14px 18px",fontSize:13,fontWeight:view===n.k?600:400,color:view===n.k?T.amber:T.dimmer,background:"none",border:"none",borderBottom:view===n.k?`2px solid ${T.amber}`:"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",transition:"color 0.15s" }}>{n.l}</button>
        ))}
      </nav>

      <main style={{ maxWidth:980,margin:"0 auto",padding:"32px 20px 80px" }}>

        {/* BROWSE */}
        {view==="browse" && <>
          <div style={{ background:`linear-gradient(135deg, #111318 0%, #161A24 100%)`,border:`1px solid ${T.border}`,borderRadius:16,padding:"36px 32px",marginBottom:28,position:"relative",overflow:"hidden",animation:"fadeUp 0.4s ease" }}>
            <div style={{ position:"absolute",inset:0,backgroundImage:`linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:0.3 }}/>
            <div style={{ position:"relative",zIndex:1 }}>
              <div style={{ fontSize:11,fontWeight:700,color:T.amber,letterSpacing:2,textTransform:"uppercase",marginBottom:12 }}>◆ Real-time · Western Australia</div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,lineHeight:1.15,marginBottom:10 }}>
                Connect pharmacies<br/>with <em style={{color:T.amber}}>great pharmacists</em>
              </div>
              <div style={{ fontSize:15,color:T.dim,maxWidth:420,lineHeight:1.7,marginBottom:24 }}>Instant shift matching for locum pharmacists and pharmacy owners across Perth Metro, Pilbara, Kimberley and the Goldfields.</div>
              <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                {["📍 Perth Metro","🌏 Pilbara & Kimberley","⛏ Goldfields & Wheatbelt"].map(l=>(
                  <span key={l} style={{ fontSize:12,padding:"6px 14px",borderRadius:20,background:T.bgCard,color:T.dim,border:`1px solid ${T.border}` }}>{l}</span>
                ))}
              </div>
            </div>
            <div style={{ position:"absolute",top:32,right:32,textAlign:"center",background:"rgba(240,165,0,0.06)",border:`1px solid rgba(240,165,0,0.2)`,borderRadius:12,padding:"16px 20px" }}>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,color:T.amber,lineHeight:1 }}>{liveCount}</div>
              <div style={{ fontSize:11,color:T.dim,marginTop:4,letterSpacing:0.5 }}>LIVE SHIFTS</div>
            </div>
          </div>

          <div style={{ display:"flex",gap:8,marginBottom:22,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:12,color:T.dimmer,marginRight:4,fontWeight:600,letterSpacing:0.5 }}>REGION</span>
            {["All","Metro","Regional"].map(r=>(
              <button key={r} onClick={()=>setRegion(r)} style={{ padding:"5px 14px",borderRadius:20,border:`1px solid ${regionFilter===r?T.amber:T.border}`,background:regionFilter===r?T.amberDim:"transparent",color:regionFilter===r?T.amberText:T.dim,fontSize:12,fontWeight:regionFilter===r?700:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>{r}</button>
            ))}
            <span style={{ fontSize:12,color:T.dimmer,marginLeft:12,marginRight:4,fontWeight:600,letterSpacing:0.5 }}>TYPE</span>
            {["All","Emergency","Standard","Weekend","Evening"].map(t=>(
              <button key={t} onClick={()=>setType(t)} style={{ padding:"5px 14px",borderRadius:20,border:`1px solid ${typeFilter===t?T.amber:T.border}`,background:typeFilter===t?T.amberDim:"transparent",color:typeFilter===t?T.amberText:T.dim,fontSize:12,fontWeight:typeFilter===t?700:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>{t}</button>
            ))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14 }}>
            {filtered.map((s,i)=>(
              <ShiftCard key={s.id} shift={s} applied={applied.has(s.id)} onApply={setTarget} animDelay={i*0.06} />
            ))}
          </div>
        </>}

        {/* POST */}
        {view==="post" && <PostView />}

        {/* APPLICATIONS */}
        {view==="applied" && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:28,color:T.white,marginBottom:6 }}>My Applications</div>
            <div style={{ fontSize:14,color:T.dim,marginBottom:28 }}>Track your shift applications in real time.</div>
            {applied.size===0 ? (
              <div style={{ textAlign:"center",padding:"60px 20px",color:T.dim }}>
                <div style={{ fontSize:48,marginBottom:16,opacity:0.4 }}>◎</div>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:22,color:T.white,marginBottom:8 }}>No applications yet</div>
                <div style={{ fontSize:14 }}>Browse available shifts and apply in one tap.</div>
                <button onClick={()=>setView("browse")} style={{ marginTop:24,background:"transparent",border:`1.5px solid ${T.amber}`,color:T.amber,borderRadius:8,padding:"10px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Browse Shifts →</button>
              </div>
            ) : MOCK.filter(s=>applied.has(s.id)).map(s=>(
              <div key={s.id} style={{ background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 22px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:15,marginBottom:4 }}>{s.pharmacy_name}</div>
                  <div style={{ fontSize:13,color:T.dim }}>{s.shift_date} · {fmt12(s.start_time)}–{fmt12(s.end_time)} · ${s.rate}/hr</div>
                  <div style={{ fontSize:12,color:T.dimmer }}>📍 {s.location}</div>
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:T.mintText,background:T.mintDim,border:`1px solid rgba(0,229,176,0.2)`,borderRadius:8,padding:"4px 12px" }}>✓ Applied</span>
              </div>
            ))}
          </div>
        )}

        {/* PROFILE */}
        {view==="profile" && (
          <div style={{ animation:"fadeUp 0.3s ease",maxWidth:520 }}>
            <div style={{ background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:16,padding:28 }}>
              <div style={{ width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${T.amber},#C05621)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,marginBottom:16 }}>👩‍⚕️</div>
              <div style={{ fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:4 }}>Your Profile</div>
              <div style={{ fontSize:13,color:T.dim,marginBottom:20 }}>Registered Pharmacist · AHPRA Verified · Perth WA</div>
              <div style={{ display:"flex",gap:0,padding:"18px 0",borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,marginBottom:22 }}>
                {[["Applied",applied.size],["Completed","0"],["Rating","—"]].map(([l,v])=>(
                  <div key={l} style={{ flex:1,textAlign:"center" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif",fontSize:24,color:T.amber }}>{v}</div>
                    <div style={{ fontSize:11,color:T.dimmer,marginTop:2,letterSpacing:0.5 }}>{l.toUpperCase()}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12,fontWeight:700,color:T.amber,marginBottom:4,letterSpacing:0.5 }}>🔔 REAL-TIME ALERTS ACTIVE</div>
                <div style={{ fontSize:13,color:T.dim,lineHeight:1.6 }}>Notified instantly when a new shift matches your location, software, and rate preferences.</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Apply Modal */}
      {applyTarget && <ApplyModal shift={applyTarget} onClose={()=>setTarget(null)} onConfirm={confirmApply} />}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:T.bgCard,border:`1px solid ${T.mint}`,borderRadius:10,padding:"12px 22px",fontSize:13,fontWeight:600,color:T.mintText,zIndex:300,boxShadow:`0 8px 32px rgba(0,0,0,0.4)`,whiteSpace:"nowrap",animation:"slideIn 0.3s ease" }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
