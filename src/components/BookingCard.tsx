'use client'
import React, { useState, useEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BookingStatus = "pending" | "upcoming" | "completed" | "cancelled";

export interface Booking {
  id: string;
  campgroundId: string;
  status: BookingStatus;
  campName: string;
  location: string;
  imageUrl?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType?: string;
  guests?: number;
  totalPrice?: number;
  createdAt: string;
  createdAtRaw?: string;
  tel: string;
  paymentExpiresAt?: string;
  deniedByAdmin?: boolean;
}

interface BookingCardProps {
  booking: Booking;
  onEdit: (booking: Booking) => void;
  onRemove: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  onPay?: (booking: Booking) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending:   "Pending payment",
  upcoming:  "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<BookingStatus, React.CSSProperties> = {
  pending:   { background: "#faeeda", color: "#633806" },
  upcoming:  { background: "#e6f1fb", color: "#0c447c" },
  completed: { background: "#eaf3de", color: "#27500a" },
  cancelled: { background: "#f1efea", color: "#5f5e5a" },
};

const DENIED_STYLE: React.CSSProperties = { background: "#fce8e8", color: "#a32d2d" };


// ─── Countdown Timer ───────────────────────────────────────────────────────────

const PAYMENT_WINDOW_MS = 60 * 60 * 1000; // 1 hour fallback

const CountdownTimer: React.FC<{ createdAt: string; paymentExpiresAt?: string }> = ({
  createdAt,
  paymentExpiresAt,
}) => {
  const deadline = paymentExpiresAt
    ? new Date(paymentExpiresAt)
    : new Date(new Date(createdAt).getTime() + PAYMENT_WINDOW_MS);

  const calcSecs = () => Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));

  const [secs, setSecs] = useState(calcSecs);

  useEffect(() => {
    const id = setInterval(() => setSecs(calcSecs), 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline.getTime()]);

  if (secs <= 0) return null;

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  const urgent = secs < 300; // red tint when under 5 min

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        fontVariantNumeric: "tabular-nums",
        color: urgent ? "#b83228" : "#a05c0a",
        background: urgent ? "#fef0f0" : "#fef6e7",
        border: `0.5px solid ${urgent ? "#f9c0bc" : "#f5dda0"}`,
        borderRadius: 6,
        padding: "2px 7px",
        display: "inline-block",
      }}
    >
      [{pad(h)}:{pad(m)}:{pad(s)}]
    </span>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────

const BookingCard: React.FC<BookingCardProps> = ({ booking: b, onEdit, onRemove, onCancel, onPay }) => {
  const canEdit = b.status !== "completed" && b.status !== "cancelled" && b.status !== "pending";

  return (
    <>
      <style>{`
        .bk-card { background: #fff; border: 0.5px solid #e2ddd5; border-radius: 13px; overflow: hidden; transition: border-color 0.15s; }
        .bk-card:hover { border-color: #bbb5aa; }
        .bk-top { display: flex; gap: 14px; padding: 14px 16px; align-items: flex-start; }
        .bk-img { width: 80px; height: 68px; border-radius: 9px; overflow: hidden; flex-shrink: 0; background: #3d5a3e; }
        .bk-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bk-main { flex: 1; min-width: 0; }
        .bk-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
        .bk-name { font-size: 14px; font-weight: 500; color: #1e2a1c; }
        .bk-status { font-size: 10px; font-weight: 600; padding: 2px 9px; border-radius: 99px; }
        .bk-loc { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #b83228; margin-bottom: 8px; }
        .bk-loc svg { width: 11px; height: 11px; flex-shrink: 0; }
        .bk-meta { display: flex; gap: 14px; flex-wrap: wrap; }
        .bk-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #5a5a4a; }
        .bk-meta-item svg { width: 12px; height: 12px; flex-shrink: 0; color: #8a8a7a; }
        .bk-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; min-width: 110px; }
        .bk-price { font-size: 16px; font-weight: 500; color: #1e2a1c; }
        .bk-price-lbl { font-size: 10px; color: #8a8a7a; }
        .bk-created { font-size: 10px; color: #aaa89a; }
        .bk-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-top: 0.5px solid #f0ede8; background: #fdfcfa; }
        .bk-tel { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #5a5a4a; }
        .bk-tel svg { width: 12px; height: 12px; color: #8a8a7a; }
        .bk-actions-col { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .bk-actions { display: flex; gap: 6px; }
        .act-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 7px; border: 0.5px solid #e2ddd5; background: #fff; font-size: 11px; font-weight: 500; cursor: pointer; font-family: inherit; color: #5a5a4a; transition: all 0.15s; }
        .act-btn:hover { background: #f5f3ee; border-color: #bbb5aa; }
        .act-btn-del:hover { background: #fcebeb !important; border-color: #f09595 !important; color: #a32d2d !important; }
        .act-btn-cancel { color: #a32d2d !important; border-color: #fca5a5 !important; }
        .act-btn-cancel:hover { background: #fcebeb !important; border-color: #f09595 !important; }
        .act-btn-pay { background: #4a6741 !important; color: #fff !important; border-color: #4a6741 !important; }
        .act-btn-pay:hover { background: #3a5433 !important; border-color: #3a5433 !important; }
        .act-btn svg { width: 12px; height: 12px; }
      `}</style>

      <div className="bk-card">
        {/* Top section */}
        <div className="bk-top">
          <div className="bk-img">
            {b.imageUrl && <img src={b.imageUrl} alt={b.campName} />}
          </div>

          <div className="bk-main">
            <div className="bk-name-row">
              <span className="bk-name">{b.campName}</span>
              <span
                className="bk-status"
                style={b.deniedByAdmin ? DENIED_STYLE : STATUS_STYLE[b.status]}
              >
                {b.deniedByAdmin ? "Denied" : STATUS_LABEL[b.status]}
              </span>
            </div>
            <div className="bk-loc">
              <PinIcon />
              {b.location}
            </div>
            <div className="bk-meta">
              <div className="bk-meta-item">
                <CalendarIcon />
                {b.checkIn} – {b.checkOut} · {b.nights} {b.nights === 1 ? "night" : "nights"}
              </div>
              {b.guests != null && (
                <div className="bk-meta-item">
                  <PersonIcon />
                  {b.guests} {b.guests === 1 ? "guest" : "guests"}
                </div>
              )}
              {b.roomType && (
                <div className="bk-meta-item">
                  <TentIcon />
                  {b.roomType}
                </div>
              )}
            </div>
          </div>

          <div className="bk-right">
            {b.totalPrice != null && b.totalPrice > 0 && (
              <>
                <div className="bk-price">฿{b.totalPrice.toLocaleString()}</div>
                <div className="bk-price-lbl">
                  {b.status === "pending" ? "Total due" : "Total paid"}
                </div>
              </>
            )}
            <div className="bk-created">Booked {b.createdAt}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="bk-footer">
          <div className="bk-tel">
            <PhoneIcon />
            {b.tel}
          </div>

          <div className="bk-actions-col">
            {b.status === "pending" && (
              <CountdownTimer
                createdAt={b.createdAtRaw ?? b.createdAt}
                paymentExpiresAt={b.paymentExpiresAt}
              />
            )}
            <div className="bk-actions">
              {/* pending: Cancel + Pay */}
              {b.status === "pending" && (
                <>
                  {onCancel && (
                    <button className="act-btn act-btn-cancel" onClick={() => onCancel(b)}>
                      <XIcon /> Cancel
                    </button>
                  )}
                  {onPay && (
                    <button className="act-btn act-btn-pay" onClick={() => onPay(b)}>
                      <CardIcon /> Pay
                    </button>
                  )}
                </>
              )}

              {/* upcoming: Cancel only */}
              {b.status === "upcoming" && onCancel && (
                <button className="act-btn act-btn-cancel" onClick={() => onCancel(b)}>
                  <XIcon /> Cancel
                </button>
              )}

              {/* completed / cancelled: Remove only */}
              {(b.status === "completed" || b.status === "cancelled") && (
                <button className="act-btn act-btn-del" onClick={() => onRemove(b)}>
                  <TrashIcon /> Remove
                </button>
              )}

              {canEdit && (
                <button className="act-btn" onClick={() => onEdit(b)}>
                  <EditIcon /> Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Icons ──────────────────────────────────────────────────────────────────────

const PinIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 11, height: 11, flexShrink: 0 }}>
    <path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 12, height: 12 }}>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M5 3V2M11 3V2M2 7h12" />
  </svg>
);

const PersonIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 12, height: 12 }}>
    <path d="M8 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
  </svg>
);

const TentIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 12, height: 12 }}>
    <path d="M2 5h12v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5zM2 5l1.5-3h9L14 5" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 12, height: 12 }}>
    <path d="M3 2h2.5l1 3-1.5 1.5c.8 1.6 2.4 3.2 4 4L10.5 9l3 1V12.5A1.5 1.5 0 0 1 12 14C6.5 14 2 9.5 2 4a1.5 1.5 0 0 1 1-1.5z" />
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 12, height: 12 }}>
    <rect x="1" y="4" width="14" height="10" rx="1.5" />
    <path d="M1 7h14" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 12, height: 12 }}>
    <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} style={{ width: 12, height: 12 }}>
    <path d="M3 4.5h10M6 4.5V3h4v1.5M5 4.5l.5 8h5l.5-8" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 12, height: 12 }}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);

export default BookingCard;
