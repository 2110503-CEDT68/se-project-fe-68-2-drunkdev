import React, { useState, useCallback } from "react";
import { addCreditCard } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CardBrand = "visa" | "mastercard" | "amex" | "discover";

interface CardBrandConfig {
  label: string;
  displayName: string;
  bg: string;
  numLen: number;
  cvvLen: number;
  logoText: string;
}

interface FormField<T = string> {
  value: T;
  error: string;
  touched: boolean;
}

interface AddCardFormState {
  brand: CardBrand;
  cardNumber: FormField;
  cardholderName: FormField;
  expiry: FormField;
  cvc: FormField;
  balance: FormField;
}

interface NewCard {
  _id: string;
  brand: CardBrand;
  lastFour: string;
  cardholderName: string;
  expiry: string;
  balance?: number;
}

interface AddCreditCardPageProps {
  token: string;
  onBack: () => void;
  onSuccess: (card: NewCard) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const BRAND_CONFIG: Record<CardBrand, CardBrandConfig> = {
  visa:       { label: "VISA",  displayName: "Visa",       bg: "#1a1f71", numLen: 16, cvvLen: 3, logoText: "VISA" },
  mastercard: { label: "MC",    displayName: "Mastercard", bg: "#1a1a1a", numLen: 16, cvvLen: 3, logoText: "MC" },
  amex:       { label: "AMEX",  displayName: "Amex",       bg: "#007bc1", numLen: 15, cvvLen: 4, logoText: "AMEX" },
  discover:   { label: "DISC",  displayName: "Discover",   bg: "#e65c00", numLen: 16, cvvLen: 3, logoText: "DISC" },
};

const BRAND_BG: Record<CardBrand, string> = {
  visa: "#1a1f71", mastercard: "#1a1a1a", amex: "#007bc1", discover: "#e65c00",
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

function formatCardNumber(raw: string, brand: CardBrand): string {
  const digits = raw.replace(/\D/g, "").slice(0, BRAND_CONFIG[brand].numLen);
  if (brand === "amex") {
    return digits.replace(/^(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function validateCardNumber(value: string, brand: CardBrand): string {
  const digits = value.replace(/\s/g, "");
  if (!digits) return "Card number is required";
  if (!/^\d+$/.test(digits)) return "Only numbers allowed";
  if (digits.length !== BRAND_CONFIG[brand].numLen)
    return `Must be ${BRAND_CONFIG[brand].numLen} digits for ${BRAND_CONFIG[brand].displayName}`;
  return "";
}

function validateCardholderName(value: string): string {
  if (!value.trim()) return "Cardholder name is required";
  if (value.trim().length < 2) return "Name is too short";
  if (!/^[a-zA-Z\s\-']+$/.test(value.trim())) return "Name contains invalid characters";
  return "";
}

function validateExpiry(value: string): string {
  if (!value) return "Expiry date is required";
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return "Use MM/YY format";
  const month = parseInt(match[1]);
  const year = parseInt("20" + match[2]);
  if (month < 1 || month > 12) return "Invalid month";
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  if (year < curYear || (year === curYear && month < curMonth)) return "Card has expired";
  return "";
}

function validateCvc(value: string, brand: CardBrand): string {
  const len = BRAND_CONFIG[brand].cvvLen;
  if (!value) return "CVC/CVV is required";
  if (!/^\d+$/.test(value)) return "Only numbers allowed";
  if (value.length !== len) return `Must be ${len} digits`;
  return "";
}

function validateBalance(value: string): string {
  if (!value.trim()) return "";
  const raw = value.replace(/[^0-9.]/g, "");
  if (!raw) return "";
  const num = parseFloat(raw);
  if (isNaN(num) || num < 0) return "Enter a valid amount";
  return "";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const FieldMessage: React.FC<{ error: string; touched: boolean; successMsg?: string }> = ({
  error, touched, successMsg,
}) => {
  if (!touched) return null;
  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#a32d2d", marginTop: 4 }}>
        <ErrorIcon /> {error}
      </div>
    );
  }
  if (successMsg) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#27500a", marginTop: 4 }}>
        <CheckIcon /> {successMsg}
      </div>
    );
  }
  return null;
};

const CardPreview: React.FC<{
  brand: CardBrand;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
}> = ({ brand, cardNumber, cardholderName, expiry }) => {
  const config = BRAND_CONFIG[brand];
  const displayNumber = cardNumber || "0000 0000 0000 0000";
  const displayName = cardholderName || "Full name";
  const displayExpiry = expiry || "MM/YY";

  return (
    <div
      style={{
        width: "100%", aspectRatio: "1.586",
        borderRadius: 13, padding: "1.1rem",
        background: config.bg, position: "relative",
        overflow: "hidden", marginBottom: "1rem",
      }}
    >
      <div style={{
        width: 28, height: 20, borderRadius: 4,
        background: "#c8a84b", marginBottom: "0.8rem",
      }} />
      <div style={{
        fontSize: 15, fontWeight: 500,
        color: "rgba(255,255,255,0.9)", letterSpacing: "0.15em",
        marginBottom: "0.8rem", fontFamily: "monospace",
      }}>
        {displayNumber}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
            Cardholder
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
            Expires
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
            {displayExpiry}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: "1rem", right: "1.1rem", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.05em" }}>
        {config.logoText}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AddCreditCardPage: React.FC<AddCreditCardPageProps> = ({ token, onBack, onSuccess }) => {
  const [form, setForm] = useState<AddCardFormState>({
    brand: "visa",
    cardNumber:     { value: "", error: "", touched: false },
    cardholderName: { value: "", error: "", touched: false },
    expiry:         { value: "", error: "", touched: false },
    cvc:            { value: "", error: "", touched: false },
    balance:        { value: "", error: "", touched: false },
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const updateField = useCallback((
    field: keyof Omit<AddCardFormState, "brand">,
    value: string,
    error: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: { value, error, touched: true },
    }));
  }, []);

  const setBrand = (brand: CardBrand) => {
    setForm((prev) => ({
      ...prev,
      brand,
      cardNumber: { ...prev.cardNumber, error: prev.cardNumber.touched ? validateCardNumber(prev.cardNumber.value, brand) : "" },
      cvc: { ...prev.cvc, error: prev.cvc.touched ? validateCvc(prev.cvc.value, brand) : "" },
    }));
  };

  const isFormValid = (): boolean => {
    return (
      !validateCardNumber(form.cardNumber.value, form.brand) &&
      !validateCardholderName(form.cardholderName.value) &&
      !validateExpiry(form.expiry.value) &&
      !validateCvc(form.cvc.value, form.brand) &&
      !validateBalance(form.balance.value)
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || submitting) return;
    const digits = form.cardNumber.value.replace(/\s/g, "");
    const balRaw = form.balance.value.replace(/[^0-9.]/g, "");
    const [mm, yy] = form.expiry.value.split("/");
    const expiryMonth = parseInt(mm, 10);
    const expiryYear = 2000 + parseInt(yy, 10);

    setSubmitting(true);
    setApiError("");
    try {
      const backendCard = await addCreditCard(
        token,
        form.cardholderName.value.trim(),
        digits,
        expiryMonth,
        expiryYear,
        form.cvc.value,
        balRaw ? parseFloat(balRaw) : undefined,
      );
      setSubmitted(true);
      onSuccess({
        _id: backendCard._id,
        brand: form.brand,
        lastFour: digits.slice(-4),
        cardholderName: form.cardholderName.value.trim(),
        expiry: form.expiry.value,
        balance: balRaw ? parseFloat(balRaw) : undefined,
      });
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Failed to add card");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field: FormField): React.CSSProperties => ({
    width: "100%", padding: "10px 12px",
    border: `1px solid ${field.touched ? (field.error ? "#e24b4a" : field.value ? "#3b6d11" : "#e2ddd5") : "#e2ddd5"}`,
    borderRadius: 8, fontSize: 13, color: "#1e2a1c",
    background: field.touched && field.error ? "#fefafa" : "#fff",
    outline: "none", fontFamily: "inherit",
    transition: "border-color 0.15s",
  });

  return (
    <>
      <style>{`
        .acp { font-family: 'Helvetica Neue', Arial, sans-serif; background: #faf9f6; padding: 1.5rem; min-height: 100vh; }
        .acp-back { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; font-size: 12px; color: #7a7a6a; padding: 0; font-family: inherit; margin-bottom: 1.25rem; }
        .acp-back:hover { color: #2a2a1a; }
        .acp-title { font-size: 20px; font-weight: 500; color: #1e2a1c; margin-bottom: 1.25rem; letter-spacing: -0.2px; }
        .acp-layout { display: grid; grid-template-columns: 1fr 260px; gap: 1.5rem; align-items: start; }
        .acp-card { background: #fff; border: 0.5px solid #e2ddd5; border-radius: 13px; padding: 1.25rem; }
        .sec-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8a7a; margin-bottom: 0.75rem; }
        .field { margin-bottom: 1rem; }
        .field:last-child { margin-bottom: 0; }
        .field-lbl { font-size: 11px; font-weight: 600; color: #5a5a4a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .brand-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 1rem; }
        .brand-btn { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px 6px; border: 1px solid #e2ddd5; border-radius: 9px; cursor: pointer; background: #fff; transition: border-color 0.15s, background 0.15s; }
        .brand-btn:hover { border-color: #bbb5aa; background: #fdfcfa; }
        .brand-btn.brand-sel { border: 1.5px solid #4a6741; background: #f2f7f0; }
        .brand-logo { width: 36px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; }
        .brand-nm { font-size: 10px; color: #5a5a4a; font-weight: 500; }
        .brand-btn.brand-sel .brand-nm { color: #3b6d11; }
        .acp-divider { border: none; border-top: 0.5px solid #e8e4dc; margin: 1rem 0; }
        .add-btn { width: 100%; padding: 12px; background: #4a6741; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; letter-spacing: 0.02em; transition: background 0.15s; margin-top: 1rem; }
        .add-btn:hover:not(:disabled) { background: #3a5433; }
        .add-btn:disabled { background: #e8e4dc; color: #aaa89a; cursor: not-allowed; }
        .success-box { background: #eaf3de; border: 1px solid #97c459; border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 10px; margin-top: 1rem; }
        .success-title { font-size: 13px; font-weight: 500; color: #27500a; }
        .success-sub { font-size: 11px; color: #3b6d11; margin-top: 2px; }
        .preview-col { position: sticky; top: 1rem; }
        .info-card { background: #fff; border: 0.5px solid #e2ddd5; border-radius: 13px; padding: 1rem; }
        .info-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 12px; color: #5a5a4a; }
        .info-row:last-child { margin-bottom: 0; }
        .info-row svg { flex-shrink: 0; margin-top: 1px; }
        .field-hint { font-size: 11px; color: #8a8a7a; margin-top: 4px; }
        @media (max-width: 640px) { .acp-layout { grid-template-columns: 1fr; } .brand-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>

      <div className="acp">
        <button className="acp-back" onClick={onBack}>
          <BackIcon /> Back to payment
        </button>
        <div className="acp-title">Add new card</div>

        <div className="acp-layout">
          {/* ── Form ── */}
          <div>
            <div className="acp-card">

              <div className="sec-lbl">Card brand</div>
              <div className="brand-grid">
                {(Object.entries(BRAND_CONFIG) as [CardBrand, CardBrandConfig][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    className={`brand-btn ${form.brand === key ? "brand-sel" : ""}`}
                    onClick={() => setBrand(key)}
                    disabled={submitted}
                  >
                    <div className="brand-logo" style={{ background: cfg.bg, color: "#fff" }}>
                      {cfg.logoText}
                    </div>
                    <span className="brand-nm">{cfg.displayName}</span>
                  </button>
                ))}
              </div>

              <div className="acp-divider" />
              <div className="sec-lbl">Card details</div>

              <div className="field">
                <div className="field-lbl">Card number</div>
                <input
                  style={inputStyle(form.cardNumber)}
                  type="text"
                  value={form.cardNumber.value}
                  placeholder="0000 0000 0000 0000"
                  maxLength={form.brand === "amex" ? 17 : 19}
                  disabled={submitted}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value, form.brand);
                    updateField("cardNumber", formatted, validateCardNumber(formatted, form.brand));
                  }}
                  onBlur={() => updateField("cardNumber", form.cardNumber.value, validateCardNumber(form.cardNumber.value, form.brand))}
                />
                <FieldMessage error={form.cardNumber.error} touched={form.cardNumber.touched} successMsg="Valid card number" />
              </div>

              <div className="field">
                <div className="field-lbl">Cardholder name</div>
                <input
                  style={inputStyle(form.cardholderName)}
                  type="text"
                  value={form.cardholderName.value}
                  placeholder="Name as on card"
                  disabled={submitted}
                  onChange={(e) => updateField("cardholderName", e.target.value, validateCardholderName(e.target.value))}
                  onBlur={() => updateField("cardholderName", form.cardholderName.value, validateCardholderName(form.cardholderName.value))}
                />
                <FieldMessage error={form.cardholderName.error} touched={form.cardholderName.touched} />
              </div>

              <div className="row2">
                <div className="field">
                  <div className="field-lbl">Expiry date</div>
                  <input
                    style={inputStyle(form.expiry)}
                    type="text"
                    value={form.expiry.value}
                    placeholder="MM/YY"
                    maxLength={5}
                    disabled={submitted}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value);
                      updateField("expiry", formatted, validateExpiry(formatted));
                    }}
                    onBlur={() => updateField("expiry", form.expiry.value, validateExpiry(form.expiry.value))}
                  />
                  <FieldMessage error={form.expiry.error} touched={form.expiry.touched} />
                </div>
                <div className="field">
                  <div className="field-lbl">CVC / CVV</div>
                  <input
                    style={inputStyle(form.cvc)}
                    type="text"
                    value={form.cvc.value}
                    placeholder={form.brand === "amex" ? "0000" : "000"}
                    maxLength={BRAND_CONFIG[form.brand].cvvLen}
                    disabled={submitted}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, BRAND_CONFIG[form.brand].cvvLen);
                      updateField("cvc", v, validateCvc(v, form.brand));
                    }}
                    onBlur={() => updateField("cvc", form.cvc.value, validateCvc(form.cvc.value, form.brand))}
                  />
                  <FieldMessage error={form.cvc.error} touched={form.cvc.touched} />
                </div>
              </div>

              <div className="field">
                <div className="field-lbl">Balance (optional)</div>
                <input
                  style={inputStyle(form.balance)}
                  type="text"
                  value={form.balance.value}
                  placeholder="฿ 0.00"
                  disabled={submitted}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, "");
                    const formatted = raw ? "฿ " + raw : "";
                    updateField("balance", formatted, validateBalance(formatted));
                  }}
                  onBlur={() => updateField("balance", form.balance.value, validateBalance(form.balance.value))}
                />
                <div className="field-hint">Enter your available balance for tracking purposes.</div>
                <FieldMessage error={form.balance.error} touched={form.balance.touched} />
              </div>

              {submitted && (
                <div className="success-box">
                  <SuccessCircleIcon />
                  <div>
                    <div className="success-title">Card added successfully</div>
                    <div className="success-sub">
                      {BRAND_CONFIG[form.brand].displayName} card ending in{" "}
                      {form.cardNumber.value.replace(/\s/g, "").slice(-4)} is ready to use.
                    </div>
                  </div>
                </div>
              )}

              {apiError && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a32d2d", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
                  <ErrorIcon /> {apiError}
                </div>
              )}

              <button
                className="add-btn"
                disabled={!isFormValid() || submitted || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Adding card…" : submitted ? "Card added" : "Add card"}
              </button>
            </div>
          </div>

          {/* ── Preview ── */}
          <div className="preview-col">
            <CardPreview
              brand={form.brand}
              cardNumber={form.cardNumber.value}
              cardholderName={form.cardholderName.value}
              expiry={form.expiry.value}
            />
            <div className="info-card">
              <div className="info-row">
                <LockIcon />
                <span>Your card info is secured and encrypted.</span>
              </div>
              <div className="info-row">
                <ClockIcon />
                <span>Cards are saved for future bookings.</span>
              </div>
              <div className="info-row">
                <CheckIcon2 />
                <span>Remove saved cards anytime in your account settings.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M10 12L6 8l4-4" />
  </svg>
);
const ErrorIcon = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11v.5" />
  </svg>
);
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink: 0 }}>
    <path d="M3 8l3 3 7-7" />
  </svg>
);
const SuccessCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#27500a" strokeWidth={1.5} style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6.5" /><path d="M5 8.5l2 2 4-4" />
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4a6741" strokeWidth={1.4} style={{ flexShrink: 0 }}>
    <rect x="2" y="5" width="12" height="9" rx="1.5" /><path d="M5 5V4a3 3 0 0 1 6 0v1" /><path d="M2 9h12" />
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4a6741" strokeWidth={1.4} style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
  </svg>
);
const CheckIcon2 = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4a6741" strokeWidth={1.4} style={{ flexShrink: 0 }}>
    <path d="M3 8l3 3 7-7" />
  </svg>
);

// ─── Demo export ───────────────────────────────────────────────────────────────

const AddCreditCardPageDemo = () => (
  <AddCreditCardPage
    token=""
    onBack={() => history.back()}
    onSuccess={(card) => console.log("Card added:", card)}
  />
);

export type { NewCard, AddCreditCardPageProps };
export { AddCreditCardPage, BRAND_CONFIG };
export default AddCreditCardPageDemo;
