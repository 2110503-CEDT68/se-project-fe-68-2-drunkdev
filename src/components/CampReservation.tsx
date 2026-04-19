import React from "react";
import type { RoomType } from "./CampRoomTypes";
import { Room } from "@/types/camp";

interface CampReservationProps {
  selectedRoom: Room | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  isAdmin?: boolean;
  onEditCamp?: () => void;
}

const SERVICE_FEE_RATE = 0.1;

const CampReservation: React.FC<CampReservationProps> = ({
  selectedRoom,
  checkIn,
  checkOut,
  guests,
  nights,
  isAdmin = false,
  onEditCamp,
}) => {
  const subtotal = selectedRoom ? selectedRoom.price * nights : 0;
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + fee;
  const canBook =
    selectedRoom !== null && selectedRoom.available != 0;

  return (
    <div className="reservation-card">
      {selectedRoom ? (
        <>
          <div className="price-block">
            <div className="price-main">
              <span className="price-amount">
                ฿{selectedRoom.price.toLocaleString()}
              </span>
              <span className="price-unit">/ night</span>
            </div>
            <div className="selected-room-label">{selectedRoom.roomType}</div>
          </div>
        </>
      ) : (
        <div className="price-block">
          <div className="no-selection">Select a site type to see pricing</div>
        </div>
      )}

      <div className="date-grid">
        <div className="date-cell">
          <div className="date-lbl">Check-in</div>
          <div className="date-val">{checkIn}</div>
        </div>
        <div className="date-cell">
          <div className="date-lbl">Check-out</div>
          <div className="date-val">{checkOut}</div>
        </div>
      </div>

      <div className="guest-row">
        <div>
          <div className="date-lbl">Guests</div>
          <div className="date-val">{guests} {guests === 1 ? "guest" : "guests"}</div>
        </div>
        <ChevronIcon />
      </div>

      {selectedRoom && (
        <>
          <div className="divider" />
          <div className="cost-row">
            <span className="cost-lbl">
              ฿{selectedRoom.price.toLocaleString()} × {nights} nights
            </span>
            <span className="cost-val">฿{subtotal.toLocaleString()}</span>
          </div>
          <div className="cost-row">
            <span className="cost-lbl">Service fee</span>
            <span className="cost-val">฿{fee.toLocaleString()}</span>
          </div>
          <div className="divider" />
          <div className="cost-row total-row">
            <span>Total</span>
            <span>฿{total.toLocaleString()}</span>
          </div>
        </>
      )}

      <button
        className="book-btn"
        disabled={!canBook}
        style={canBook ? {} : { opacity: 0.45, cursor: "not-allowed" }}
      >
        Reserve now
      </button>

      {false && (
        <button className="edit-btn" onClick={onEditCamp}>
          Edit camp info
        </button>
      )}

      <p className="reservation-note">You won't be charged yet</p>

      <style>{`
        .reservation-card {
          background: #fff;
          border: 1px solid #e2ddd5;
          border-radius: 14px;
          padding: 1.25rem;
          // position: sticky;
          top: 1rem;
          box-sizing: border-box;
        }
        .price-block {
          margin-bottom: 1rem;
        }
        .price-main {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .price-amount {
          // font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          color: #1e2a1c;
        }
        .price-unit {
          font-size: 13px;
          color: #8a8a7a;
        }
        .selected-room-label {
          font-size: 12px;
          color: #8a8a7a;
          margin-top: 2px;
        }
        .no-selection {
          font-size: 13px;
          color: #aaa89a;
          font-style: italic;
        }
        .date-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 8px;
        }
        .date-cell {
          border: 1px solid #e2ddd5;
          border-radius: 9px;
          padding: 9px 11px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .date-cell:hover {
          border-color: #bbb5aa;
        }
        .date-lbl {
          font-size: 10px;
          font-weight: 600;
          color: #8a8a7a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .date-val {
          font-size: 13px;
          color: #1e2a1c;
          margin-top: 2px;
        }
        .guest-row {
          border: 1px solid #e2ddd5;
          border-radius: 9px;
          padding: 9px 11px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          margin-bottom: 0;
          transition: border-color 0.15s;
        }
        .guest-row:hover {
          border-color: #bbb5aa;
        }
        .guest-row svg {
          width: 14px;
          height: 14px;
          color: #8a8a7a;
        }
        .divider {
          border: none;
          border-top: 1px solid #ece8e0;
          margin: 0.9rem 0;
        }
        .cost-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #5a5a4a;
          margin-bottom: 6px;
        }
        .cost-lbl {
          color: #7a7a6a;
        }
        .cost-val {
          color: #3a3a2a;
        }
        .total-row {
          font-weight: 600;
          font-size: 14px;
          color: #1e2a1c;
          margin-bottom: 0;
        }
        .book-btn {
          width: 100%;
          padding: 12px;
          background: #4a6741;
          color: #fff;
          border: none;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          margin-top: 1rem;
          letter-spacing: 0.02em;
          transition: background 0.15s;
        }
        .book-btn:hover:not(:disabled) {
          background: #3a5433;
        }
        .edit-btn {
          width: 100%;
          padding: 9px;
          background: transparent;
          color: #7a7a6a;
          border: 1px solid #e2ddd5;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          font-family: inherit;
          margin-top: 8px;
          transition: background 0.15s, border-color 0.15s;
        }
        .edit-btn:hover {
          background: #f5f3ee;
          border-color: #bbb5aa;
          color: #3a3a2a;
        }
        .reservation-note {
          font-size: 11px;
          color: #aaa89a;
          text-align: center;
          margin-top: 10px;
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

const ChevronIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);

export default CampReservation;
