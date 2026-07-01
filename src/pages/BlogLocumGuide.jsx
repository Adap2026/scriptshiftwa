// ── BLOG POST PAGE ────────────────────────────────────────────────────────────
// File: src/pages/BlogLocumGuide.jsx
// Route: /blog/how-to-find-locum-pharmacist-work-in-wa
// Add to App.js Routes: <Route path="/blog/how-to-find-locum-pharmacist-work-in-wa" element={<BlogLocumGuide />} />
// Add to App.js imports: import BlogLocumGuide from "./pages/BlogLocumGuide";

import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const T = {
  bg:"#0E0F13", bgCard:"#16181F",
  border:"#252830", borderHi:"#343847",
  amber:"#F0A500", amberDim:"#3D2D00", amberText:"#FFD166",
  mint:"#00E5B0", mintDim:"#003D30", mintText:"#5FFFD8",
  white:"#F5F6FA", dim:"#8B8FA8", dimmer:"#545770",
};

export default function BlogLocumGuide() {
  const s = {
    page: { maxWidth:720, margin:"0 auto", padding:"48px 24px 80px", fontFamily:"'Outfit',sans-serif", color:T.white, lineHeight:1.8 },
    breadcrumb: { fontSize:12, color:T.dimmer, marginBottom:32, display:"flex", gap:8, alignItems:"center" },
    crumbLink: { color:T.amber, textDecoration:"none" },
    meta: { fontSize:13, color:T.dimmer, marginBottom:40, paddingBottom:24, borderBottom:`1px solid ${T.border}` },
    h1: { fontFamily:"'Playfair Display',serif", fontSize:"2rem", fontWeight:900, lineHeight:1.25, marginBottom:16, color:T.white },
    h2: { fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", fontWeight:700, marginTop:48, marginBottom:16, color:T.white },
    p: { fontSize:15, color:T.dim, marginBottom:20, lineHeight:1.8 },
    ul: { paddingLeft:20, marginBottom:20 },
    li: { fontSize:15, color:T.dim, marginBottom:10, lineHeight:1.7 },
    infoBox: { background:T.bgCard, border:`1px solid ${T.borderHi}`, borderRadius:12, padding:"20px 24px", margin:"32px 0" },
    infoBoxTitle: { fontSize:12, fontWeight:700, color:T.amber, letterSpacing:1, textTransform:"uppercase", marginBottom:8 },
    table: { width:"100%", borderCollapse:"collapse", marginBottom:24, fontSize:14 },
    th: { textAlign:"left", padding:"10px 14px", background:T.bgCard, color:T.white, fontWeight:700, borderBottom:`1px solid ${T.border}` },
    td: { padding:"10px 14px", color:T.dim, borderBottom:`1px solid ${T.border}` },
    cta: { background:T.bgCard, border:`1px solid ${T.amber}`, borderRadius:12, padding:"28px 32px", margin:"48px 0 0", textAlign:"center" },
    ctaTitle: { fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", color:T.white, marginBottom:10 },
    ctaBtn: { display:"inline-block", background:T.amber, color:"#000", padding:"12px 28px", borderRadius:8, fontWeight:700, textDecoration:"none", fontSize:"0.95rem", fontFamily:"'Outfit',sans-serif" },
  };

  return (
    <div style={s.page}>
      <Helmet>
        <title>How to Find Locum Pharmacist Work in WA (2025 Guide) | ScriptShift WA</title>
        <meta name="description" content="A complete guide to finding locum pharmacist work in Western Australia — AHPRA requirements, WA Schedule 8 access, Fred Dispense vs Minfos, pay rates, and how to find shifts." />
        <link rel="canonical" href="https://www.scriptshiftwa.com.au/blog/how-to-find-locum-pharmacist-work-in-wa" />
        <meta property="og:title" content="How to Find Locum Pharmacist Work in WA (2025 Guide)" />
        <meta property="og:description" content="Everything WA pharmacists need to know before taking their first locum shift — registration, S8 access, software, pay rates, and where to find work." />
        <meta property="og:url" content="https://www.scriptshiftwa.com.au/blog/how-to-find-locum-pharmacist-work-in-wa" />
        <meta property="og:type" content="article" />
      </Helmet>

      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/" style={s.crumbLink}>Home</Link>
        <span>›</span>
        <span>Blog</span>
        <span>›</span>
        <span>How to Find Locum Pharmacist Work in WA</span>
      </div>

      {/* Header */}
      <h1 style={s.h1}>How to Find Locum Pharmacist Work in Western Australia (2025 Guide)</h1>
      <div style={s.meta}>Published by ScriptShift WA · June 2025 · 5 min read</div>

      <p style={s.p}>
        Whether you're a newly registered pharmacist exploring your options, an experienced dispenser looking for flexibility, or someone returning to the workforce after a break — locum pharmacy work in Western Australia is more accessible than ever.
      </p>
      <p style={s.p}>
        This guide covers what you need to know before taking your first locum shift in WA: registration requirements, how shifts are sourced, what to expect on the day, and how platforms like ScriptShift WA are changing the way WA pharmacists find work.
      </p>

      {/* Section 1 */}
      <h2 style={s.h2}>What is locum pharmacy work?</h2>
      <p style={s.p}>
        A locum pharmacist provides temporary, casual, or relief cover at a pharmacy — stepping in when a regular pharmacist is on leave, when a store is short-staffed, or when a pharmacy needs extra hands during a busy period.
      </p>
      <p style={s.p}>In WA, locum pharmacists work across a wide range of settings:</p>
      <ul style={s.ul}>
        <li style={s.li}><strong style={{color:T.white}}>Community pharmacies</strong> — banner group stores (TerryWhite Chemmart, Chemist Warehouse, Blooms The Chemist) and independent pharmacies</li>
        <li style={s.li}><strong style={{color:T.white}}>Hospital outpatient pharmacies</strong></li>
        <li style={s.li}><strong style={{color:T.white}}>Regional and remote community pharmacies</strong></li>
        <li style={s.li}><strong style={{color:T.white}}>Aged care facilities</strong> with on-site dispensing</li>
      </ul>
      <p style={s.p}>Shifts can range from a single day to several weeks, and can be as local as the next suburb or as far as a fly-in fly-out placement in the Pilbara or Kimberley.</p>

      {/* Section 2 */}
      <h2 style={s.h2}>What you need before taking a locum shift in WA</h2>

      <div style={s.infoBox}>
        <div style={s.infoBoxTitle}>1. Current AHPRA Registration</div>
        <p style={{...s.p, marginBottom:0}}>
          You must hold general registration as a pharmacist with the Pharmacy Board of Australia. Provisional registration does not qualify you for independent locum practice. Check your registration status and expiry date at ahpra.gov.au before accepting any shift.
        </p>
      </div>

      <div style={s.infoBox}>
        <div style={s.infoBoxTitle}>2. Professional Indemnity Insurance</div>
        <p style={{...s.p, marginBottom:0}}>
          Most pharmacy owners will require you to hold your own professional indemnity insurance. PSA (Pharmaceutical Society of Australia) membership includes cover, as does Guild Insurance's locum product. Confirm your cover level before each placement.
        </p>
      </div>

      <div style={s.infoBox}>
        <div style={s.infoBoxTitle}>3. Western Australia Schedule 8 Access</div>
        <p style={{...s.p, marginBottom:0}}>
          To dispense Schedule 8 controlled drugs in WA, you must hold — or be covered by — a current WA Poisons Act authorisation. In most community pharmacies, the pharmacy's Approved Pharmacist Permit covers this, but confirm with the pharmacy owner before your shift. If you're new to WA from interstate, WA's Schedule 8 regime differs from other states — a common catch for new locums.
        </p>
      </div>

      <div style={s.infoBox}>
        <div style={s.infoBoxTitle}>4. Dispensing Software Familiarity</div>
        <p style={{...s.p, marginBottom:0}}>
          WA community pharmacies predominantly use two dispensing systems: <strong style={{color:T.white}}>Fred Dispense</strong> (Fred IT Group) and <strong style={{color:T.white}}>Minfos</strong>. Most experienced pharmacists are comfortable with both. If you've only used one, spend some time with the other before taking placements — many pharmacies are happy to give a quick orientation on arrival, but basic competency is expected.
        </p>
      </div>

      {/* Section 3 */}
      <h2 style={s.h2}>How locum shifts are sourced — and what's changing</h2>
      <p style={s.p}>Historically, WA pharmacists found locum work through three channels:</p>
      <ul style={s.ul}>
        <li style={s.li}><strong style={{color:T.white}}>Personal networks</strong> — word of mouth, former colleagues, and pharmacy owner contacts</li>
        <li style={s.li}><strong style={{color:T.white}}>Staffing agencies</strong> — which placed pharmacists but charged the pharmacy a margin, making the process slower and more expensive for both sides</li>
        <li style={s.li}><strong style={{color:T.white}}>Facebook groups</strong> — several WA pharmacy groups have active locum boards, with varying reliability and no formal vetting</li>
      </ul>
      <p style={s.p}>
        All three approaches work, but each has friction. ScriptShift WA was built to remove that friction — a dedicated shift marketplace where pharmacists create a verified profile, browse available shifts posted by pharmacy owners, and claim the ones that suit them. No agency fees, no middlemen, and every pharmacist on the platform is AHPRA-verified.
      </p>

      {/* Section 4 */}
      <h2 style={s.h2}>What to expect on your first locum shift</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong style={{color:T.white}}>Arrive 10 minutes early.</strong> You'll need a brief handover — stock locations, current workflows, and any patients to flag.</li>
        <li style={s.li}><strong style={{color:T.white}}>Confirm S8 access before you start.</strong> Don't assume. Ask the owner or manager to confirm you're covered under their permit before dispensing any Schedule 8 medication.</li>
        <li style={s.li}><strong style={{color:T.white}}>Know the software before you start dispensing.</strong> If you haven't used Fred or Minfos in a while, ask for a five-minute orientation.</li>
        <li style={s.li}><strong style={{color:T.white}}>Keep your own shift records.</strong> Log the date, pharmacy, ABN, hours worked, and rate agreed — important for tax and in case of any payment disputes.</li>
        <li style={s.li}><strong style={{color:T.white}}>Check in on break.</strong> If you're the only pharmacist on site, you are legally responsible for the pharmacy during your shift.</li>
      </ul>

      {/* Section 5 */}
      <h2 style={s.h2}>Locum pharmacist pay rates in WA (2025)</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Shift Type</th>
            <th style={s.th}>Typical Rate</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Standard metro day shift", "$450–$600/day ($55–$75/hr)"],
            ["Weekend loading", "150–200% of base rate"],
            ["Public holiday", "200–250% of base rate"],
            ["Regional/remote placement", "Higher base + travel & accommodation"],
          ].map(([type, rate]) => (
            <tr key={type}>
              <td style={s.td}>{type}</td>
              <td style={{...s.td, color:T.amberText, fontWeight:600}}>{rate}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={s.p}>These are market rates, not guaranteed figures. Rates are typically negotiated directly between the pharmacist and pharmacy owner, or set by the pharmacy when posting through a platform.</p>

      {/* CTA */}
      <div style={s.cta}>
        <div style={s.ctaTitle}>Ready to find locum shifts in WA?</div>
        <p style={{...s.p, marginBottom:20}}>ScriptShift WA lists available locum shifts across Perth and regional Western Australia. Create a free profile and start browsing.</p>
        <Link to="/browse" style={s.ctaBtn}>Browse available shifts →</Link>
      </div>

      {/* Footer note */}
      <p style={{...s.p, fontSize:12, marginTop:40, color:T.dimmer}}>
        ScriptShift WA is operated by ScriptShift Technologies Pty Ltd (ABN 21 698 500 542), connecting AHPRA-registered pharmacists with pharmacy owners across WA.
      </p>
    </div>
  );
}
