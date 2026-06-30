import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

function ForPharmacyOwners() {
  return (
    <main className="landing-page">
      {/* Hero */}
      <section className="hero">
        <h1>Find a qualified locum pharmacist in WA — when you need one.</h1>
        <p className="subheading">
          ScriptShift WA connects pharmacy owners and managers with
          AHPRA-registered locum pharmacists across Western Australia. Post a
          shift in minutes. Fill it fast.
        </p>
        <Link to="/post-shift" className="cta-button">
          Post a shift
        </Link>
      </section>

      {/* How it works */}
      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps-grid">
          <div className="step">
            <span className="step-number">1</span>
            <h3>Post your shift</h3>
            <p>
              Enter the date, hours, location, dispensing software, and rate.
              Takes under two minutes.
            </p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <h3>Pharmacists apply</h3>
            <p>
              AHPRA-verified pharmacists in your area see your listing and
              express interest directly.
            </p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <h3>Confirm your cover</h3>
            <p>
              Review profiles, select your preferred pharmacist, and confirm
              the booking — all within the platform.
            </p>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <h3>Done.</h3>
            <p>
              Your shift is covered. Payment is processed securely through
              ScriptShift WA.
            </p>
          </div>
        </div>
      </section>

      {/* Why owners choose us */}
      <section className="benefits">
        <h2>Why pharmacy owners use ScriptShift WA</h2>
        <ul className="benefits-list">
          <li>
            <strong>No agency middlemen.</strong> Connect directly with locum
            pharmacists — no commission markups, no phone tag with a
            recruiter.
          </li>
          <li>
            <strong>AHPRA-verified pharmacists only.</strong> Every pharmacist
            on the platform has current, confirmed registration.
          </li>
          <li>
            <strong>Fast turnaround.</strong> Post an urgent gap today and
            have it filled within hours for most Perth metro locations.
          </li>
          <li>
            <strong>Transparent pricing.</strong> Set your own rate. No
            hidden fees on the pharmacy side.
          </li>
          <li>
            <strong>WA-specific platform.</strong> Pharmacists listed
            understand WA Poisons Act requirements, S8 permit access, and
            local dispensing software.
          </li>
        </ul>
      </section>

      {/* Trust section */}
      <section className="coverage">
        <h2>Trusted by pharmacies across WA</h2>
        <p>
          Independent pharmacies, banner group stores, and hospital community
          pharmacies use ScriptShift WA for planned leave, sick day cover,
          and extended trading hours support.
        </p>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Short-staffed? Post a shift now.</h2>
        <p>It takes two minutes. WA locum pharmacists are waiting.</p>
        <div className="cta-group">
          <Link to="/post-shift" className="cta-button">
            Post a shift
          </Link>
          <Link to="/pricing" className="cta-button secondary">
            Learn more about pricing
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ForPharmacyOwners;
