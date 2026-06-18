/* eslint-disable */
// ── PolicyPages.js ─────────────────────────────────────────────────────────────
// Drop this file into src/ and add the routes to App.js as described below.
//
// USAGE in App.js:
//   1. Import at top:
//        import { PrivacyPolicy, TermsOfService, RefundPolicy } from './PolicyPages';
//
//   2. Add routes inside your router/view logic. ScriptShift WA uses a `page`
//      state variable. Add these cases to your page-switch logic:
//
//        {page === 'privacy-policy'  && <PrivacyPolicy onBack={() => setPage('home')} />}
//        {page === 'terms-of-service' && <TermsOfService onBack={() => setPage('home')} />}
//        {page === 'refund-policy'   && <RefundPolicy onBack={() => setPage('home')} />}
//
//   3. In your Footer component, add links:
//        <span onClick={() => setPage('privacy-policy')}  style={{cursor:'pointer'}}>Privacy Policy</span>
//        <span onClick={() => setPage('terms-of-service')} style={{cursor:'pointer'}}>Terms of Service</span>
//        <span onClick={() => setPage('refund-policy')}   style={{cursor:'pointer'}}>Refund Policy</span>
//
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  bg:"#0E0F13", bgCard:"#16181F",
  border:"#252830",
  amber:"#F0A500", amberText:"#FFD166",
  white:"#F5F6FA", dim:"#8B8FA8", dimmer:"#545770",
};

const policyStyles = {
  page: {
    minHeight: '100vh',
    background: T.bg,
    color: T.white,
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '0 0 80px 0',
  },
  header: {
    background: T.bgCard,
    borderBottom: `1px solid ${T.border}`,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backBtn: {
    background: 'none',
    border: `1px solid ${T.border}`,
    color: T.dim,
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: T.white,
    margin: 0,
  },
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  effectiveDate: {
    fontSize: '13px',
    color: T.dim,
    marginBottom: '32px',
    padding: '10px 16px',
    background: T.bgCard,
    borderRadius: '8px',
    border: `1px solid ${T.border}`,
  },
  section: {
    marginBottom: '32px',
  },
  h2: {
    fontSize: '17px',
    fontWeight: '600',
    color: T.amber,
    marginBottom: '12px',
    marginTop: '0',
  },
  p: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#C8CADE',
    margin: '0 0 12px 0',
  },
  ul: {
    paddingLeft: '20px',
    margin: '8px 0 12px 0',
  },
  li: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#C8CADE',
    marginBottom: '6px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    margin: '12px 0',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    color: T.amberText,
    fontWeight: '600',
  },
  td: {
    padding: '10px 12px',
    border: `1px solid ${T.border}`,
    color: '#C8CADE',
  },
  link: {
    color: T.amber,
    textDecoration: 'none',
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${T.border}`,
    margin: '32px 0',
  },
};

function PolicyHeader({ title, onBack }) {
  return (
    <div style={policyStyles.header}>
      <button style={policyStyles.backBtn} onClick={onBack}>← Back</button>
      <h1 style={policyStyles.title}>{title}</h1>
    </div>
  );
}

// ── PRIVACY POLICY ────────────────────────────────────────────────────────────
export function PrivacyPolicy({ onBack }) {
  return (
    <div style={policyStyles.page}>
      <PolicyHeader title="Privacy Policy" onBack={onBack} />
      <div style={policyStyles.container}>
        <p style={policyStyles.effectiveDate}>
          ScriptShift WA — ScriptShift Technologies Pty Ltd &nbsp;|&nbsp; Effective Date: 7 June 2026
        </p>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>1. Our Commitment to Privacy</h2>
          <p style={policyStyles.p}>
            ScriptShift Technologies Pty Ltd ('we', 'us', 'our') is committed to protecting your personal information
            in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
            This Privacy Policy explains how we collect, use, store and disclose your personal information.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>2. Information We Collect</h2>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.1 Pharmacists</strong></p>
          <p style={policyStyles.p}>When you register as a pharmacist, we collect:</p>
          <ul style={policyStyles.ul}>
            {['Full name','Email address','Phone number','AHPRA registration number',
              'Dispensing software skills','Preferred work regions','Minimum hourly rate'].map(item => (
              <li key={item} style={policyStyles.li}>{item}</li>
            ))}
          </ul>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.2 Pharmacy Owners</strong></p>
          <p style={policyStyles.p}>When you post a shift, we collect:</p>
          <ul style={policyStyles.ul}>
            {['Pharmacy name and location','Shift details (date, time, rate, type)',
              'Payment information (processed securely by Stripe — we do not store card details)'].map(item => (
              <li key={item} style={policyStyles.li}>{item}</li>
            ))}
          </ul>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.3 Automatically Collected Information</strong></p>
          <p style={policyStyles.p}>
            We may automatically collect browser type, IP address and usage data to improve the platform.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>3. How We Use Your Information</h2>
          <p style={policyStyles.p}>We use your personal information to:</p>
          <ul style={policyStyles.ul}>
            {['Create and manage your account',
              'Display your profile (including AHPRA number) to pharmacy owners for verification',
              'Match pharmacists with relevant shift opportunities',
              'Process payments via Stripe',
              'Send notifications about shift matches and platform updates',
              'Comply with our legal obligations'].map(item => (
              <li key={item} style={policyStyles.li}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>4. Disclosure of Your Information</h2>
          <p style={policyStyles.p}>We disclose your information only as follows:</p>
          <ul style={policyStyles.ul}>
            <li style={policyStyles.li}>To pharmacy owners: your name, AHPRA number, software skills and preferred regions when you apply for a shift</li>
            <li style={policyStyles.li}>To Stripe: payment processing information</li>
            <li style={policyStyles.li}>To government authorities: if required by law or to comply with a legal obligation</li>
          </ul>
          <p style={policyStyles.p}>We do not sell your personal information to third parties.</p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>5. AHPRA Number</h2>
          <p style={policyStyles.p}>
            Your AHPRA registration number is sensitive professional information. We store it securely and display
            it only to pharmacy owners on our platform for the purpose of verifying your registration. It is not
            publicly searchable or displayed to the general public.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>6. Data Storage and Security</h2>
          <p style={policyStyles.p}>
            Your data is stored securely using Supabase (servers located in Sydney, Australia). We implement
            industry-standard security measures including encrypted connections (HTTPS) and access controls.
            However, no internet transmission is completely secure and we cannot guarantee absolute security.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>7. Your Rights</h2>
          <p style={policyStyles.p}>Under the Australian Privacy Act, you have the right to:</p>
          <ul style={policyStyles.ul}>
            {['Access the personal information we hold about you',
              'Request correction of inaccurate information',
              'Request deletion of your account and associated data',
              'Complain about a breach of the Australian Privacy Principles'].map(item => (
              <li key={item} style={policyStyles.li}>{item}</li>
            ))}
          </ul>
          <p style={policyStyles.p}>
            To exercise these rights, contact us at{' '}
            <a href="mailto:hello@scriptshiftwa.com.au" style={policyStyles.link}>hello@scriptshiftwa.com.au</a>.
            We will respond within 30 days.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>8. Cookies</h2>
          <p style={policyStyles.p}>
            We use browser local storage to maintain your login session. We do not use advertising cookies or
            share tracking data with advertisers. ScriptShift WA is ad-free.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>9. Changes to This Policy</h2>
          <p style={policyStyles.p}>
            We may update this Privacy Policy from time to time. We will notify registered users by email of
            material changes. Continued use of the platform constitutes acceptance.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>10. Complaints</h2>
          <p style={policyStyles.p}>
            If you believe we have breached the Australian Privacy Principles, you may lodge a complaint with
            the Office of the Australian Information Commissioner (OAIC) at{' '}
            <a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer" style={policyStyles.link}>www.oaic.gov.au</a>.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>11. Contact</h2>
          <p style={policyStyles.p}>
            Privacy Officer — ScriptShift Technologies Pty Ltd:{' '}
            <a href="mailto:hello@scriptshiftwa.com.au" style={policyStyles.link}>hello@scriptshiftwa.com.au</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── TERMS OF SERVICE ──────────────────────────────────────────────────────────
export function TermsOfService({ onBack }) {
  return (
    <div style={policyStyles.page}>
      <PolicyHeader title="Terms of Service" onBack={onBack} />
      <div style={policyStyles.container}>
        <p style={policyStyles.effectiveDate}>
          ScriptShift WA — ScriptShift Technologies Pty Ltd (ABN 21 698 500 542) &nbsp;|&nbsp; Effective Date: 7 June 2026
        </p>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>1. About ScriptShift WA</h2>
          <p style={policyStyles.p}>
            ScriptShift WA is an online marketplace operated by ScriptShift Technologies Pty Ltd (ABN 21 698 500 542)
            that connects pharmacy owners with locum pharmacists in Western Australia. By using our platform at
            scriptshiftwa.com.au, you agree to these Terms of Service.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>2. Who Can Use ScriptShift WA</h2>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.1 Pharmacy Owners</strong></p>
          <p style={policyStyles.p}>
            To post shifts you must be the owner, manager or authorised representative of a pharmacy operating
            in Western Australia and hold all necessary licences under the Pharmacy Act 2010 (WA).
          </p>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.2 Pharmacists</strong></p>
          <p style={policyStyles.p}>
            To apply for shifts you must be a pharmacist currently registered with the Australian Health
            Practitioner Regulation Agency (AHPRA) with an active, unconditional registration.
          </p>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.3 Account Responsibility</strong></p>
          <p style={policyStyles.p}>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account. You must notify us immediately of any unauthorised use.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>3. Posting Shifts</h2>
          <p style={policyStyles.p}>
            Pharmacy owners may post available locum shifts by paying a one-time posting fee per shift or shift block.
            Current fees are:
          </p>
          <table style={policyStyles.table}>
            <thead>
              <tr>
                <th style={policyStyles.th}>Shift Type</th>
                <th style={policyStyles.th}>Fee (GST incl.)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Standard Shift', '$14 AUD'],
                ['Evening Shift', '$14 AUD'],
                ['Weekend Shift', '$19 AUD'],
                ['Emergency Shift', '$24 AUD'],
                ['3-Day Bundle', '$35 AUD'],
                ['5-Day Bundle', '$55 AUD'],
                ['8-Day Bundle', '$80 AUD'],
              ].map(([type, fee]) => (
                <tr key={type}>
                  <td style={policyStyles.td}>{type}</td>
                  <td style={policyStyles.td}>{fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={policyStyles.p}>
            Posting fees are non-refundable once a shift is published. We reserve the right to update fees with 7 days' notice.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>4. AHPRA Verification</h2>
          <p style={policyStyles.p}>
            Pharmacists must provide their valid AHPRA registration number during sign-up. By providing this number,
            you confirm your registration is current and unconditional. ScriptShift WA displays your AHPRA number
            to pharmacy owners for verification purposes. We do not independently verify AHPRA registrations — it
            is the pharmacy owner's responsibility to confirm a pharmacist's registration status before engaging them.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>5. The Relationship Between Users</h2>
          <p style={policyStyles.p}>
            ScriptShift WA is a marketplace platform only. We are not a party to any employment or contractor
            agreement between pharmacy owners and pharmacists. We are not responsible for:
          </p>
          <ul style={policyStyles.ul}>
            {['The conduct of any pharmacist engaged through the platform',
              'The accuracy of shift details posted by pharmacy owners',
              'Any disputes arising from a shift engagement',
              'Payment of pharmacist wages or invoices'].map(item => (
              <li key={item} style={policyStyles.li}>{item}</li>
            ))}
          </ul>
          <p style={policyStyles.p}>
            Pharmacy owners and pharmacists are solely responsible for ensuring their engagement complies with
            all applicable laws, awards and enterprise agreements including the Pharmacy Industry Award 2020.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>6. Prohibited Conduct</h2>
          <p style={policyStyles.p}>Users must not:</p>
          <ul style={policyStyles.ul}>
            {['Provide false or misleading information, including false AHPRA numbers',
              'Post shifts for pharmacies they are not authorised to represent',
              'Use the platform for any unlawful purpose',
              'Attempt to circumvent our payment system by arranging direct bookings outside the platform',
              'Harass, abuse or threaten other users'].map(item => (
              <li key={item} style={policyStyles.li}>{item}</li>
            ))}
          </ul>
          <p style={policyStyles.p}>Breach of these prohibitions may result in immediate account suspension or termination.</p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>7. Limitation of Liability</h2>
          <p style={policyStyles.p}>
            To the maximum extent permitted by Australian law, ScriptShift Technologies Pty Ltd and its directors,
            employees and contractors are not liable for any indirect, incidental, special or consequential loss
            or damage arising from your use of the platform.
          </p>
          <p style={policyStyles.p}>
            Our total liability to you for any claim is limited to the amount you paid us in the 3 months preceding the claim.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>8. Intellectual Property</h2>
          <p style={policyStyles.p}>
            All content, design, code and materials on ScriptShift WA are owned by ScriptShift Technologies Pty Ltd.
            You may not reproduce, distribute or create derivative works without our written permission.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>9. Termination</h2>
          <p style={policyStyles.p}>
            We may suspend or terminate your account at any time if you breach these Terms or if we reasonably
            believe your use of the platform poses a risk to other users or to our operations.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>10. Governing Law</h2>
          <p style={policyStyles.p}>
            These Terms are governed by the laws of Western Australia and the Commonwealth of Australia.
            Any disputes will be subject to the exclusive jurisdiction of the courts of Western Australia.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>11. Changes to These Terms</h2>
          <p style={policyStyles.p}>
            We may update these Terms from time to time. We will notify registered users by email.
            Continued use of the platform after changes constitutes acceptance of the updated Terms.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>12. Contact Us</h2>
          <p style={policyStyles.p}>
            ScriptShift Technologies Pty Ltd —{' '}
            <a href="mailto:hello@scriptshiftwa.com.au" style={policyStyles.link}>hello@scriptshiftwa.com.au</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── REFUND POLICY ─────────────────────────────────────────────────────────────
export function RefundPolicy({ onBack }) {
  return (
    <div style={policyStyles.page}>
      <PolicyHeader title="Refund Policy" onBack={onBack} />
      <div style={policyStyles.container}>
        <p style={policyStyles.effectiveDate}>
          ScriptShift WA — ScriptShift Technologies Pty Ltd &nbsp;|&nbsp; Effective Date: 7 June 2026
        </p>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>1. Shift Posting Fees</h2>
          <p style={policyStyles.p}>
            Shift posting fees paid to ScriptShift WA are for the service of listing your shift on our platform.
            Once a shift is published and visible to pharmacists, the posting fee is non-refundable.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>2. Exceptions — When We May Issue a Refund</h2>
          <p style={policyStyles.p}>We will consider a refund in the following circumstances:</p>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.1 Technical Error</strong></p>
          <p style={policyStyles.p}>
            If a technical error on our platform resulted in your shift not being published despite successful
            payment, we will either publish your shift immediately or issue a full refund at your choice.
          </p>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.2 Duplicate Payment</strong></p>
          <p style={policyStyles.p}>
            If you were charged twice for the same shift due to a system error, we will refund the duplicate
            charge within 5 business days.
          </p>
          <p style={policyStyles.p}><strong style={{color:T.white}}>2.3 Platform Unavailability</strong></p>
          <p style={policyStyles.p}>
            If our platform is unavailable for more than 24 consecutive hours during your shift's active listing
            period, we will offer a credit towards a future posting.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>3. How to Request a Refund</h2>
          <p style={policyStyles.p}>
            To request a refund, email{' '}
            <a href="mailto:hello@scriptshiftwa.com.au" style={policyStyles.link}>hello@scriptshiftwa.com.au</a>{' '}
            within 7 days of payment with:
          </p>
          <ul style={policyStyles.ul}>
            {['Your registered email address',
              'The date of payment',
              'The pharmacy name and shift date',
              'The reason for your refund request'].map(item => (
              <li key={item} style={policyStyles.li}>{item}</li>
            ))}
          </ul>
          <p style={policyStyles.p}>We will review your request and respond within 3 business days.</p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>4. Shift Cancellation by Pharmacy Owner</h2>
          <p style={policyStyles.p}>
            If a pharmacy owner cancels a posted shift after a pharmacist has been engaged, the posting fee
            is not refundable. The pharmacy owner is responsible for any obligations to the pharmacist arising
            from the cancellation under the applicable award or agreement.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>5. No-Show by Pharmacist</h2>
          <p style={policyStyles.p}>
            If a pharmacist fails to attend a confirmed shift, the posting fee is not refundable. This is a
            matter between the pharmacy owner and the pharmacist. ScriptShift WA is not liable for losses
            arising from a pharmacist no-show.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>6. Consumer Guarantees</h2>
          <p style={policyStyles.p}>
            Nothing in this policy excludes, restricts or modifies any consumer guarantee, right or remedy
            you may have under the Australian Consumer Law. If you believe you are entitled to a remedy under
            the Australian Consumer Law, please contact us.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>7. Payment Processing</h2>
          <p style={policyStyles.p}>
            All payments are processed by Stripe. Approved refunds will be credited to your original payment
            method within 5–10 business days depending on your bank.
          </p>
        </div>

        <div style={policyStyles.section}>
          <h2 style={policyStyles.h2}>8. Contact</h2>
          <p style={policyStyles.p}>
            For refund enquiries:{' '}
            <a href="mailto:hello@scriptshiftwa.com.au" style={policyStyles.link}>hello@scriptshiftwa.com.au</a>
            {' '}— ScriptShift Technologies Pty Ltd
          </p>
        </div>
      </div>
    </div>
  );
}
