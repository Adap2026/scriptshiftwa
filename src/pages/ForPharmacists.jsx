import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

function ForPharmacists() {
  return (
    <main className="landing-page">
      {/* Hero */}
      <section className="hero">
        <h1>Locum pharmacist shifts across Western Australia — on your terms.</h1>
        <p className="subheading">
          ScriptShift WA is the shift marketplace built for AHPRA-registered
          pharmacists in WA. Browse available shifts, set your availability,
          and get paid for the work you choose.
        </p>
        <Link to="/signup" className="cta-button">
          Create your free profile
        </Link>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps-grid">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Register in minutes</h3>
            <p>
              Create a free profile using your AHPRA registration details. No
              lengthy forms, no gatekeeping.
            </p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Browse shifts near you</h3>
            <p>
              See available locum shifts across Perth, regional WA, and
              remote areas — filtered by date, location, and pharmacy type.
            </p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Claim and confirm</h3>
            <p>
              Accept shifts that work for you. You'll receive shift details,
              pharmacy software type, and any access requirements before you
              show up.
            </p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <h3>Work and get paid</h3>
            <p>
              Complete the shift. Payment is handled through the platform —
              clear, documented, and on time.
            </p>
          </div>
        </div>
      </section>

      {/* Why pharmacists choose us */}
      <section className="benefits">
        <h2>Why pharmacists choose ScriptShift WA</h2>
        <ul className="benefits-list">
          <li>
            <strong>Work when you want.</strong> Pick up single shifts or
            blocks — no lock-in, no agency fees.
          </li>
          <li>
            <strong>WA-specific.</strong> Built for the WA pharmacy
            landscape, including Fred Dispense, Minfos, and WA Schedule 8
            permit requirements.
          </li>
          <li>
            <strong>Full shift visibility.</strong> Know the pharmacy, the
            software, the hours, and the rate before you commit.
          </li>
          <li>
            <strong>AHPRA-verified.</strong> Every user on the platform is a
            registered pharmacist — you're working with peers.
          </li>
        </ul>
      </section>

      {/* Coverage area */}
      <section className="coverage">
        <h2>Shifts available across WA</h2>
        <p>From Subiaco to the Kimberley. ScriptShift WA lists shifts in:</p>
        <ul>
          <li>Metro Perth (all suburbs)</li>
          <li>Regional WA — Bunbury, Geraldton, Kalgoorlie, Albany</li>
          <li>Remote and rural communities</li>
        </ul>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Ready to pick up your next shift?</h2>
        <p>Join hundreds of WA pharmacists already on the platform.</p>
        <div className="cta-group">
          <Link to="/signup" className="cta-button">
            Create free profile
          </Link>
          <Link to="/shifts" className="cta-button secondary">
            Browse available shifts
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ForPharmacists;
