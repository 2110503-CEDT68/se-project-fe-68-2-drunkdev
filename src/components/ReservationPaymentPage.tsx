import React, { useState } from "react";
import { AddCreditCardPage } from "./AddCreditCardPage";
import type { NewCard } from "./AddCreditCardPage";
import { updateCreditCard, deleteCreditCard } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReservationInfo {
  campName: string;
  campLocation: string;
  campImageUrl: string;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  nights: number;
  guests: number;
  roomName: string;
  roomImageUrl: string;
  roomTags: string[];
  pricePerNight: number;
}

interface CreditCard {
  id: string;
  type: "visa" | "mastercard" | "amex";
  label: string;
  lastFour: string;
  expiry: string;
  isDefault?: boolean;
}

interface ReservationPaymentPageProps {
  token: string;
  reservation: ReservationInfo;
  savedCards: CreditCard[];
  onConfirmPayment: (cardId: string) => Promise<void>;
  onReserve: () => Promise<void>;
  onBack: () => void;
  onAddCard: () => void;
  showReserveButton?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_FEE_RATE = 0.1;
const TAX_RATE = 0.07;

const CARD_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  visa: { bg: "#1a1f71", color: "#fff", label: "VISA" },
  mastercard: { bg: "#eb001b", color: "#fff", label: "MC" },
  amex: { bg: "#007bc1", color: "#fff", label: "AMEX" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const CardIcon: React.FC<{ type: string; size?: "sm" | "md" }> = ({ type, size = "md" }) => {
  const style = CARD_STYLES[type] ?? CARD_STYLES.visa;
  const w = size === "sm" ? 30 : 36;
  const h = size === "sm" ? 20 : 24;
  return (
    <div
      style={{
        width: w, height: h, borderRadius: 4,
        background: style.bg, color: style.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size === "sm" ? 8 : 9, fontWeight: 700, flexShrink: 0,
      }}
    >
      {style.label}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ReservationPaymentPage: React.FC<ReservationPaymentPageProps> = ({
  token,
  reservation: res,
  savedCards,
  onConfirmPayment,
  onReserve,
  onBack,
  onAddCard,
  showReserveButton = true,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    savedCards.find((c) => c.isDefault)?.id ?? null
  );
  const [localCards, setLocalCards] = useState<CreditCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState("");

  // Edit card state
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editStep, setEditStep] = useState<"form" | "confirm-delete">("form");
  const [editName, setEditName] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editExpiryMonth, setEditExpiryMonth] = useState("");
  const [editExpiryYear, setEditExpiryYear] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [cardOverrides, setCardOverrides] = useState<Record<string, CreditCard>>({});
  const [deletedCardIds, setDeletedCardIds] = useState<string[]>([]);

  const allCards = [...savedCards, ...localCards]
    .filter((c) => !deletedCardIds.includes(c.id))
    .map((c) => cardOverrides[c.id] ?? c);

  const handleAddCardSuccess = (card: NewCard) => {
    const newCard: CreditCard = {
      id: card._id,
      type: (card.brand === "discover" ? "visa" : card.brand) as CreditCard["type"],
      label: card.brand.charAt(0).toUpperCase() + card.brand.slice(1),
      lastFour: card.lastFour,
      expiry: card.expiry,
    };
    setLocalCards((prev) => [...prev, newCard]);
    setSelectedCardId(newCard.id);
    setShowAddCard(false);
  };

  const openEditCard = (card: CreditCard) => {
    const [mm, yy] = card.expiry.split("/");
    setEditingCard(card);
    setEditStep("form");
    setEditName("");
    setEditNumber("");
    setEditExpiryMonth(mm ?? "");
    setEditExpiryYear(yy ?? "");
    setEditError("");
  };

  const handleEditSubmit = async () => {
    if (!editingCard || !token) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {};
      if (editName.trim()) updateData.cardHolderName = editName.trim();
      const digits = editNumber.replace(/\D/g, "");
      if (digits.length >= 4) updateData.cardNumber = digits;
      if (editExpiryMonth) updateData.expiryMonth = parseInt(editExpiryMonth, 10);
      if (editExpiryYear) {
        const yr = editExpiryYear.length === 2 ? "20" + editExpiryYear : editExpiryYear;
        updateData.expiryYear = parseInt(yr, 10);
      }
      await updateCreditCard(token, editingCard.id, updateData);
      const newLastFour = digits.length >= 4 ? digits.slice(-4) : editingCard.lastFour;
      const first = digits[0];
      const newType: CreditCard["type"] =
        digits.length > 0
          ? first === "4" ? "visa" : first === "5" ? "mastercard" : first === "3" ? "amex" : editingCard.type
          : editingCard.type;
      const mm = editExpiryMonth ? editExpiryMonth.padStart(2, "0") : editingCard.expiry.split("/")[0];
      const yy = editExpiryYear ? editExpiryYear.slice(-2) : editingCard.expiry.split("/")[1];
      setCardOverrides((prev) => ({
        ...prev,
        [editingCard.id]: {
          ...editingCard,
          type: newType,
          label: newType.charAt(0).toUpperCase() + newType.slice(1),
          lastFour: newLastFour,
          expiry: `${mm}/${yy}`,
        },
      }));
      setEditingCard(null);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!editingCard || !token) return;
    setDeleteSubmitting(true);
    setEditError("");
    try {
      await deleteCreditCard(token, editingCard.id);
      setDeletedCardIds((prev) => [...prev, editingCard.id]);
      if (selectedCardId === editingCard.id) setSelectedCardId(null);
      setEditingCard(null);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const subtotal = res.pricePerNight * res.nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + serviceFee + tax;

  const selectedCard = allCards.find((c) => c.id === selectedCardId) ?? null;

  return (
    <>
      <style>{`
        .rpp { font-family: 'Helvetica Neue', Arial, sans-serif; background: #faf9f6; padding: 1.5rem; min-height: 100vh; }
        .rpp-back { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; font-size: 12px; color: #7a7a6a; padding: 0; font-family: inherit; margin-bottom: 1.25rem; }
        .rpp-back:hover { color: #2a2a1a; }
        .rpp-title { font-size: 20px; font-weight: 500; color: #1e2a1c; margin-bottom: 1.25rem; letter-spacing: -0.2px; }
        .rpp-layout { display: grid; grid-template-columns: 1fr 300px; gap: 1.5rem; align-items: start; }
        .rpp-card { background: #fff; border: 0.5px solid #e2ddd5; border-radius: 13px; padding: 1.25rem; margin-bottom: 1rem; }
        .rpp-card:last-child { margin-bottom: 0; }
        .sec-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8a8a7a; margin-bottom: 0.75rem; }
        .camp-row { display: flex; align-items: center; gap: 12px; }
        .camp-thumb { width: 56px; height: 48px; border-radius: 8px; overflow: hidden; background: #3d5a3e; flex-shrink: 0; }
        .camp-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .camp-name { font-size: 15px; font-weight: 500; color: #1e2a1c; }
        .camp-loc { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #b83228; margin-top: 2px; }
        .camp-loc svg { width: 11px; height: 11px; }
        .rpp-divider { border: none; border-top: 0.5px solid #e8e4dc; margin: 1rem 0; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .detail-item { background: #f5f3ee; border-radius: 8px; padding: 10px 12px; }
        .detail-lbl { font-size: 10px; color: #8a8a7a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; }
        .detail-val { font-size: 13px; font-weight: 500; color: #1e2a1c; }
        .detail-sub { font-size: 11px; color: #8a8a7a; margin-top: 1px; }
        .room-row { display: flex; align-items: center; gap: 10px; padding: 10px; border: 0.5px solid #e2ddd5; border-radius: 9px; }
        .room-thumb { width: 48px; height: 40px; border-radius: 6px; overflow: hidden; background: #ece8e0; flex-shrink: 0; }
        .room-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .room-nm { font-size: 13px; font-weight: 500; color: #1e2a1c; }
        .room-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 3px; }
        .rtag { font-size: 10px; color: #7a7a6a; background: #f2f0ea; border-radius: 99px; padding: 1px 8px; border: 0.5px solid #e5e1d8; }
        .room-price-area { margin-left: auto; text-align: right; flex-shrink: 0; }
        .room-price-amt { font-size: 14px; font-weight: 500; color: #1e2a1c; }
        .room-price-unit { font-size: 10px; color: #8a8a7a; }
        .cards-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
        .cc-card { display: flex; align-items: center; gap: 10px; padding: 11px 13px; border: 0.5px solid #e2ddd5; border-radius: 9px; cursor: pointer; transition: border-color 0.15s; background: #fff; }
        .cc-card:hover { border-color: #bbb5aa; }
        .cc-card.cc-selected { border: 1.5px solid #4a6741; background: #fafcf9; }
        .cc-radio { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid #c8c3b8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
        .cc-radio.cc-radio-on { border-color: #4a6741; background: #4a6741; }
        .cc-radio-dot { width: 5px; height: 5px; border-radius: 50%; background: #fff; }
        .cc-info { flex: 1; min-width: 0; }
        .cc-number { font-size: 12px; color: #1e2a1c; font-weight: 500; }
        .cc-exp { font-size: 11px; color: #8a8a7a; margin-top: 1px; }
        .cc-default-badge { font-size: 10px; color: #3b6d11; background: #eaf3de; border-radius: 99px; padding: 2px 7px; flex-shrink: 0; }
        .cc-edit-btn { background: none; border: 0.5px solid #d5d0c8; border-radius: 6px; padding: 3px 9px; font-size: 11px; color: #7a7a6a; cursor: pointer; font-family: inherit; flex-shrink: 0; transition: all 0.15s; margin-left: auto; }
        .cc-edit-btn:hover { background: #f5f3ee; border-color: #bbb5aa; color: #3a3a2a; }
        .add-card-btn { display: flex; align-items: center; gap: 7px; padding: 10px 13px; border: 0.5px dashed #c8c3b8; border-radius: 9px; cursor: pointer; font-size: 12px; color: #7a7a6a; background: none; font-family: inherit; width: 100%; transition: background 0.15s, border-color 0.15s; }
        .add-card-btn:hover { background: #f5f3ee; border-color: #9a9590; color: #3a3a2a; }
        .add-icon { width: 20px; height: 20px; border-radius: 50%; background: #f2f0ea; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #7a7a6a; line-height: 1; flex-shrink: 0; }
        .sidebar { background: #fff; border: 0.5px solid #e2ddd5; border-radius: 13px; padding: 1.25rem; position: sticky; top: 1rem; }
        .summary-title { font-size: 13px; font-weight: 500; color: #1e2a1c; margin-bottom: 1rem; }
        .breakdown-row { display: flex; justify-content: space-between; font-size: 12px; color: #7a7a6a; padding: 6px 0; border-bottom: 0.5px solid #ece8e0; }
        .breakdown-row:last-of-type { border-bottom: none; }
        .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; color: #1e2a1c; }
        .selected-card-preview { display: flex; align-items: center; gap: 8px; padding: 9px 11px; background: #f5f3ee; border-radius: 8px; margin-top: 0.9rem; }
        .scp-text { font-size: 12px; color: #1e2a1c; }
        .scp-sub { font-size: 10px; color: #8a8a7a; }
        .pay-btn { width: 100%; padding: 12px; background: #4a6741; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; margin-top: 1rem; letter-spacing: 0.02em; transition: background 0.15s; }
        .pay-btn:hover:not(:disabled) { background: #3a5433; }
        .pay-btn:disabled { background: #ece8e0; color: #aaa89a; cursor: not-allowed; }
        .reserve-btn { width: 100%; padding: 12px; background: #fff; color: #4a6741; border: 1.5px solid #4a6741; border-radius: 9px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; margin-top: 8px; letter-spacing: 0.02em; transition: background 0.15s, color 0.15s; }
        .reserve-btn:hover { background: #f2f7f0; }
        .secure-note { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 11px; color: #8a8a7a; margin-top: 10px; }
        .secure-note svg { width: 11px; height: 11px; }
        .cancel-policy { font-size: 11px; color: #8a8a7a; text-align: center; line-height: 1.55; }
        @media (max-width: 680px) {
          .rpp-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rpp">
        <button className="rpp-back" onClick={onBack}>
          <BackIcon /> Back to camp details
        </button>

        <div className="rpp-title">Reservation & payment</div>

        <div className="rpp-layout">
          {/* ── Left column ── */}
          <div>
            {/* Camp info */}
            <div className="rpp-card">
              <div className="sec-lbl">Camp</div>
              <div className="camp-row">
                <div className="camp-thumb">
                  {res.campImageUrl && <img src={res.campImageUrl} alt={res.campName} />}
                </div>
                <div>
                  <div className="camp-name">{res.campName}</div>
                  <div className="camp-loc">
                    <PinIcon />
                    {res.campLocation}
                  </div>
                </div>
              </div>
            </div>

            {/* Reservation details */}
            <div className="rpp-card">
              <div className="sec-lbl">Reservation details</div>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-lbl">Check-in</div>
                  <div className="detail-val">{res.checkIn}</div>
                  <div className="detail-sub">From {res.checkInTime}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-lbl">Check-out</div>
                  <div className="detail-val">{res.checkOut}</div>
                  <div className="detail-sub">Until {res.checkOutTime}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-lbl">Duration</div>
                  <div className="detail-val">{res.nights} {res.nights === 1 ? "night" : "nights"}</div>
                  <div className="detail-sub">{res.checkIn} – {res.checkOut}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-lbl">Guests</div>
                  <div className="detail-val">{res.guests} {res.guests === 1 ? "guest" : "guests"}</div>
                  <div className="detail-sub">Adults</div>
                </div>
              </div>

              <div className="rpp-divider" />
              <div className="sec-lbl">Room type</div>
              <div className="room-row">
                <div className="room-thumb">
                  {res.roomImageUrl && <img src={res.roomImageUrl} alt={res.roomName} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="room-nm">{res.roomName}</div>
                  <div className="room-tags">
                    {res.roomTags.map((tag) => (
                      <span key={tag} className="rtag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="room-price-area">
                  <div className="room-price-amt">฿{res.pricePerNight.toLocaleString()}</div>
                  <div className="room-price-unit">/ night</div>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="rpp-card">
              <div className="sec-lbl">Payment method</div>

              <div className="cards-list">
                {allCards.map((card) => {
                  const isSelected = card.id === selectedCardId;
                  return (
                    <div
                      key={card.id}
                      className={`cc-card ${isSelected ? "cc-selected" : ""}`}
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <div className={`cc-radio ${isSelected ? "cc-radio-on" : ""}`}>
                        {isSelected && <div className="cc-radio-dot" />}
                      </div>
                      <CardIcon type={card.type} />
                      <div className="cc-info">
                        <div className="cc-number">{card.label} ···· {card.lastFour}</div>
                        <div className="cc-exp">Expires {card.expiry}</div>
                      </div>
                      {card.isDefault && (
                        <span className="cc-default-badge">Default</span>
                      )}
                      <button
                        className="cc-edit-btn"
                        onClick={(e) => { e.stopPropagation(); openEditCard(card); }}
                      >
                        Edit
                      </button>
                    </div>
                  );
                })}
              </div>

              <button className="add-card-btn" onClick={() => setShowAddCard(true)}>
                <div className="add-icon">+</div>
                Add new card
              </button>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div>
            <div className="sidebar">
              <div className="summary-title">Payment summary</div>

              <div className="breakdown-row">
                <span>฿{res.pricePerNight.toLocaleString()} × {res.nights} nights</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="breakdown-row">
                <span>Service fee (10%)</span>
                <span>฿{serviceFee.toLocaleString()}</span>
              </div>
              <div className="breakdown-row">
                <span>Tax (7%)</span>
                <span>฿{tax.toLocaleString()}</span>
              </div>

              <div className="rpp-divider" />
              <div className="total-row">
                <span>Total</span>
                <span>฿{total.toLocaleString()}</span>
              </div>

              {selectedCard && (
                <div className="selected-card-preview">
                  <CardIcon type={selectedCard.type} size="sm" />
                  <div>
                    <div className="scp-text">{selectedCard.label} ···· {selectedCard.lastFour}</div>
                    <div className="scp-sub">Charging ฿{total.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {payError && (
                <div style={{ fontSize: 12, color: "#a32d2d", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>⚠</span> {payError}
                </div>
              )}

              <button
                className="pay-btn"
                disabled={!selectedCardId || paying}
                onClick={async () => {
                  if (!selectedCardId) return;
                  setPayError("");
                  setPaying(true);
                  try {
                    await onConfirmPayment(selectedCardId);
                  } catch (e: unknown) {
                    setPayError(e instanceof Error ? e.message : "Payment failed");
                  } finally {
                    setPaying(false);
                  }
                }}
              >
                {paying
                  ? "Processing…"
                  : selectedCardId
                  ? `Confirm & pay ฿${total.toLocaleString()}`
                  : "Select a card to continue"}
              </button>

              {showReserveButton && (
                <>
                  {reserveError && (
                    <div style={{ fontSize: 11, color: "#a32d2d", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>
                      {reserveError}
                    </div>
                  )}
                  <button
                    className="reserve-btn"
                    disabled={reserving}
                    onClick={async () => {
                      setReserveError("");
                      setReserving(true);
                      try {
                        await onReserve();
                      } catch (e: unknown) {
                        setReserveError(e instanceof Error ? e.message : "Reserve failed");
                      } finally {
                        setReserving(false);
                      }
                    }}
                  >
                    {reserving ? "Reserving…" : "Confirm & Reserve"}
                  </button>
                </>
              )}

              <div className="secure-note">
                <LockIcon />
                Secured with 256-bit encryption
              </div>

              <div className="rpp-divider" />
              <div className="cancel-policy">
                Free cancellation up to 48 hrs before check-in. After that, the first night is non-refundable.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Card Modal ── */}
      {editingCard && (
        <>
          <div
            onClick={() => setEditingCard(null)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 200,
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              zIndex: 201,
              width: "min(92vw,420px)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 16,
              boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
              background: "#faf9f6",
              padding: "1.5rem",
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              boxSizing: "border-box" as const,
            }}
          >
            {editStep === "form" ? (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "#1e2a1c" }}>Edit card</div>
                  <button onClick={() => setEditingCard(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#8a8a7a", padding: 0, lineHeight: 1 }}>×</button>
                </div>

                {/* Current card preview */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f5f3ee", borderRadius: 9, marginBottom: "1.25rem" }}>
                  <CardIcon type={editingCard.type} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1e2a1c" }}>{editingCard.label} ···· {editingCard.lastFour}</div>
                    <div style={{ fontSize: 11, color: "#8a8a7a" }}>Expires {editingCard.expiry}</div>
                  </div>
                </div>

                {/* Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#8a8a7a", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5, display: "block" }}>Name on card</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      style={{ width: "100%", padding: "9px 11px", border: "0.5px solid #d5d0c8", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" as const }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#8a8a7a", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5, display: "block" }}>Card number (leave blank to keep current)</label>
                    <input
                      value={editNumber}
                      onChange={(e) => setEditNumber(e.target.value)}
                      placeholder={`•••• •••• •••• ${editingCard.lastFour}`}
                      maxLength={19}
                      style={{ width: "100%", padding: "9px 11px", border: "0.5px solid #d5d0c8", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", boxSizing: "border-box" as const }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#8a8a7a", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5, display: "block" }}>Expiry date</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input
                        value={editExpiryMonth}
                        onChange={(e) => setEditExpiryMonth(e.target.value)}
                        placeholder="MM"
                        maxLength={2}
                        style={{ padding: "9px 11px", border: "0.5px solid #d5d0c8", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", textAlign: "center" as const }}
                      />
                      <input
                        value={editExpiryYear}
                        onChange={(e) => setEditExpiryYear(e.target.value)}
                        placeholder="YY"
                        maxLength={4}
                        style={{ padding: "9px 11px", border: "0.5px solid #d5d0c8", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit", background: "#fff", textAlign: "center" as const }}
                      />
                    </div>
                  </div>
                </div>

                {editError && (
                  <div style={{ fontSize: 12, color: "#a32d2d", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginTop: "0.85rem" }}>
                    {editError}
                  </div>
                )}

                <button
                  onClick={handleEditSubmit}
                  disabled={editSubmitting}
                  style={{ width: "100%", padding: 11, background: "#4a6741", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: editSubmitting ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: "1.25rem", opacity: editSubmitting ? 0.7 : 1 }}
                >
                  {editSubmitting ? "Saving…" : "Save changes"}
                </button>

                <button
                  onClick={() => { setEditStep("confirm-delete"); setEditError(""); }}
                  style={{ width: "100%", padding: 10, background: "none", color: "#a32d2d", border: "0.5px solid #fca5a5", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
                >
                  Delete card
                </button>
              </>
            ) : (
              <>
                {/* Delete confirmation */}
                <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: 22 }}>
                    🗑
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: "#1e2a1c", marginBottom: 6 }}>Delete this card?</div>
                  <div style={{ fontSize: 13, color: "#8a8a7a", marginBottom: "1.5rem", lineHeight: 1.55 }}>
                    {editingCard.label} ···· {editingCard.lastFour} will be permanently removed.
                  </div>

                  {editError && (
                    <div style={{ fontSize: 12, color: "#a32d2d", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", marginBottom: "1rem" }}>
                      {editError}
                    </div>
                  )}

                  <button
                    onClick={handleDeleteCard}
                    disabled={deleteSubmitting}
                    style={{ width: "100%", padding: 11, background: "#dc2626", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: deleteSubmitting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: deleteSubmitting ? 0.7 : 1 }}
                  >
                    {deleteSubmitting ? "Deleting…" : "Yes, delete card"}
                  </button>
                  <button
                    onClick={() => setEditStep("form")}
                    style={{ width: "100%", padding: 10, background: "none", color: "#7a7a6a", border: "0.5px solid #d5d0c8", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Add Card Modal ── */}
      {showAddCard && (
        <>
          {/* Backdrop — blurs and deactivates the page behind */}
          <div
            onClick={() => setShowAddCard(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 200,
            }}
          />

          {/* Modal panel */}
          <div
            style={{
              position: "fixed",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 201,
              width: "min(92vw, 740px)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 16,
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.28)",
              background: "#faf9f6",
            }}
          >
            <AddCreditCardPage
              token={token}
              onBack={() => setShowAddCard(false)}
              onSuccess={handleAddCardSuccess}
            />
          </div>
        </>
      )}
    </>
  );
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
    <path d="M10 12L6 8l4-4" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11, flexShrink: 0 }}>
    <path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 11, height: 11 }}>
    <rect x="3" y="7" width="10" height="8" rx="1.5" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" />
  </svg>
);

// ─── Example usage / default export ──────────────────────────────────────────

const SAMPLE_RESERVATION: ReservationInfo = {
  campName: "Forest Breeze Camp",
  campLocation: "หาดใหญ่, สงขลา",
  campImageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&q=70",
  checkIn: "Apr 20, 2026",
  checkOut: "Apr 22, 2026",
  checkInTime: "2:00 PM",
  checkOutTime: "12:00 PM",
  nights: 2,
  guests: 2,
  roomName: "Standard tent site",
  roomImageUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=120&q=70",
  roomTags: ["Up to 4 guests", "Fire pit", "Shared bathroom"],
  pricePerNight: 850,
};

const SAMPLE_CARDS: CreditCard[] = [
  { id: "c1", type: "visa", label: "Visa", lastFour: "4242", expiry: "08/27", isDefault: true },
  { id: "c2", type: "mastercard", label: "Mastercard", lastFour: "8810", expiry: "03/26" },
  { id: "c3", type: "amex", label: "Amex", lastFour: "3005", expiry: "11/28" },
];

const ReservationPaymentPageDemo = () => (
  <ReservationPaymentPage
    token=""
    reservation={SAMPLE_RESERVATION}
    savedCards={SAMPLE_CARDS}
    onConfirmPayment={(cardId) => alert(`Payment confirmed with card: ${cardId}`)}
    onReserve={async () => { alert("Reserved"); }}
    onBack={() => history.back()}
    onAddCard={() => alert("Open add card form")}
  />
);

export type { ReservationInfo, CreditCard, ReservationPaymentPageProps };
export { ReservationPaymentPage };
export default ReservationPaymentPageDemo;
