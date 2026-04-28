'use client'
import React, { useEffect, useState } from "react";

const CONSENT_KEY = "campground_consent_v1";

// ─── Privacy Policy Modal ─────────────────────────────────────────────────────

const PrivacyPolicyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <>
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1000,
      }}
    />
    <div
      style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 1001,
        width: "min(92vw, 680px)",
        maxHeight: "85vh",
        overflowY: "auto",
        borderRadius: 16,
        background: "#faf9f6",
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{
        position: "sticky", top: 0,
        background: "#faf9f6",
        borderBottom: "0.5px solid #e8e4dc",
        padding: "1.25rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 1,
      }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#1e2a1c" }}>Privacy Policy</div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#8a8a7a", padding: 0, lineHeight: 1 }}
        >×</button>
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem", color: "#3a3a2a", lineHeight: 1.7, fontSize: 13 }}>
        <p style={{ fontSize: 11, color: "#8a8a7a", marginBottom: "1.5rem" }}>
          Last updated: April 29, 2026
        </p>

        <Section title="1. Introduction">
          Welcome to CampGrounds ("we", "our", "us"). We are committed to protecting your personal
          information and your right to privacy. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you use our campground booking platform.
          Please read this policy carefully. If you disagree with its terms, please stop using the service.
        </Section>

        <Section title="2. Information We Collect">
          We collect information you provide directly when you:
          <ul style={{ margin: "8px 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Register for an account (name, email address, telephone number, password)</li>
            <li>Make a booking (check-in/check-out dates, number of guests, room preferences)</li>
            <li>Add a payment method (cardholder name, card number, expiry date — CVV is never stored in plain text)</li>
            <li>Submit a review (rating, comment text)</li>
            <li>Contact us for support</li>
          </ul>
          <br />
          We also automatically collect certain technical data such as IP address, browser type,
          pages visited, and session duration to operate and improve the service.
        </Section>

        <Section title="3. How We Use Your Information">
          We use the information we collect to:
          <ul style={{ margin: "8px 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Process and manage your campground bookings</li>
            <li>Charge your saved payment method for confirmed reservations</li>
            <li>Send booking confirmations and transactional notifications</li>
            <li>Display your reviews and ratings on campground pages</li>
            <li>Allow you to manage your bookings and payment cards</li>
            <li>Improve platform performance and user experience</li>
            <li>Detect and prevent fraudulent or unauthorized activity</li>
          </ul>
        </Section>

        <Section title="4. Payment Data">
          Payment card details are stored to facilitate bookings within our platform. Card numbers
          are stored as provided; in a production environment they would be tokenised via a PCI-DSS
          compliant payment gateway (e.g. Stripe). CVV codes are accepted at entry and used solely
          for validation — they are not retained after the session. Your card balance is used
          internally to simulate real payment processing.
        </Section>

        <Section title="5. Cookies & Local Storage">
          We use browser localStorage to:
          <ul style={{ margin: "8px 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Store your authentication token so you remain logged in across sessions</li>
            <li>Remember your consent to this Privacy Policy</li>
            <li>Preserve UI preferences during your session</li>
          </ul>
          <br />
          We do not use third-party advertising or tracking cookies.
        </Section>

        <Section title="6. Sharing Your Information">
          We do not sell, trade, or rent your personal information to third parties.
          Your data may be shared only in the following limited circumstances:
          <ul style={{ margin: "8px 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <li>With campground operators, limited to information necessary to fulfil your booking</li>
            <li>With service providers who assist in operating the platform, under strict confidentiality obligations</li>
            <li>When required by law or to protect the rights, property, or safety of our users</li>
          </ul>
        </Section>

        <Section title="7. Data Retention">
          We retain your personal data for as long as your account is active or as needed to provide
          the service. Booking records are retained for accounting and dispute resolution purposes for
          up to 7 years. You may request deletion of your account at any time by contacting us.
        </Section>

        <Section title="8. Your Rights">
          Depending on your jurisdiction, you may have the right to:
          <ul style={{ margin: "8px 0 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Rectification</strong> — request correction of inaccurate or incomplete data</li>
            <li><strong>Erasure</strong> — request deletion of your personal data ("right to be forgotten")</li>
            <li><strong>Portability</strong> — request your data in a structured, machine-readable format</li>
            <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
          </ul>
          <br />
          To exercise any of these rights, please contact us at the address below.
        </Section>

        <Section title="9. Security">
          We implement industry-standard security measures including HTTPS encryption, hashed
          passwords, and access controls. However, no method of transmission over the internet or
          electronic storage is 100% secure. We encourage you to use a strong, unique password and
          to log out after each session on shared devices.
        </Section>

        <Section title="10. Children's Privacy">
          Our service is not directed to individuals under the age of 13. We do not knowingly collect
          personal information from children. If you believe a child has provided us with personal
          information, please contact us and we will delete it promptly.
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of material changes
          by updating the "Last updated" date at the top of this page. Continued use of the service
          after changes constitutes acceptance of the revised policy.
        </Section>

        <Section title="12. Contact Us" last>
          If you have questions about this Privacy Policy or wish to exercise your data rights, please contact:<br /><br />
          <strong>CampGrounds Privacy Team</strong><br />
          Email: privacy@campgrounds.example.com<br />
          Address: Faculty of Engineering, Chulalongkorn University, Bangkok, Thailand
        </Section>
      </div>

      {/* Footer */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "#faf9f6",
        borderTop: "0.5px solid #e8e4dc",
        padding: "1rem 1.5rem",
        display: "flex", justifyContent: "flex-end",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 22px",
            background: "#4a6741", color: "#fff",
            border: "none", borderRadius: 9,
            fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Close
        </button>
      </div>
    </div>
  </>
);

// ─── Section helper ───────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode; last?: boolean }> = ({
  title, children, last,
}) => (
  <div style={{ marginBottom: last ? 0 : "1.5rem" }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e2a1c", marginBottom: 8 }}>{title}</div>
    <div style={{ color: "#5a5a4a" }}>{children}</div>
  </div>
);

// ─── Consent Banner ───────────────────────────────────────────────────────────

const ConsentBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    const consent = sessionStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    sessionStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    setShowPolicy(false);
  };

  const decline = () => {
    sessionStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
    setShowPolicy(false);
  };

  if (!visible) return null;

  return (
    <>
      {showPolicy && <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />}

      {/* Banner */}
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 900,
          background: "rgba(30, 42, 28, 0.96)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
          flexWrap: "wrap",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
        }}
      >
        {/* Text */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>
            We value your privacy
          </div>
          <div style={{ fontSize: 12, color: "#a8a89a", lineHeight: 1.55 }}>
            We use cookies and local storage to keep you signed in and remember your preferences.
            By clicking <strong style={{ color: "#d4e8c2" }}>Accept</strong>, you agree to our{" "}
            <button
              onClick={() => setShowPolicy(true)}
              style={{
                background: "none", border: "none", padding: 0,
                color: "#7ec87a", cursor: "pointer",
                fontSize: 12, fontFamily: "inherit",
                textDecoration: "underline", textUnderlineOffset: 2,
              }}
            >
              Privacy Policy
            </button>
            .
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          <button
            onClick={() => setShowPolicy(true)}
            style={{
              padding: "8px 16px",
              background: "transparent",
              color: "#a8a89a",
              border: "0.5px solid #4a5a48",
              borderRadius: 8,
              fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7a8a78")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#4a5a48")}
          >
            Learn more
          </button>
          <button
            onClick={decline}
            style={{
              padding: "8px 16px",
              background: "transparent",
              color: "#a8a89a",
              border: "0.5px solid #4a5a48",
              borderRadius: 8,
              fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7a8a78")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#4a5a48")}
          >
            Decline
          </button>
          <button
            onClick={accept}
            style={{
              padding: "8px 20px",
              background: "#4a6741",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#3a5433")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#4a6741")}
          >
            Accept
          </button>
        </div>
      </div>
    </>
  );
};

export default ConsentBanner;
