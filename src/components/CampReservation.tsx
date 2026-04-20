import React from "react";
import { Room } from "@/types/camp";

interface CampReservationProps {
  selectedRoom: Room | null;
  bookDate: string;
  duration: number;
  guests: number;
  onBookDateChange: (date: string) => void;
  onDurationChange: (duration: number) => void;
  onGuestsChange: (guests: number) => void;
  onBook: () => Promise<void>;
  bookingLoading?: boolean;
  bookingError?: string;
}

const SERVICE_FEE_RATE = 0.1;

const CampReservation: React.FC<CampReservationProps> = ({
  selectedRoom,
  bookDate,
  duration,
  guests,
  onBookDateChange,
  onDurationChange,
  onGuestsChange,
  onBook,
  bookingLoading = false,
  bookingError = '',
}) => {
  const subtotal = selectedRoom ? selectedRoom.price * duration : 0;
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + fee;
  const maxGuests = selectedRoom?.capacity ?? 10;
  const guestExceeds = guests > maxGuests;
  const canBook = selectedRoom !== null && selectedRoom.available !== 0 && !!bookDate && !guestExceeds;

  return (
    <div className="reservation-card">
      {/* Price header */}
      {selectedRoom ? (
        <div className="price-block">
          <div className="price-main">
            <span className="price-amount">฿{selectedRoom.price.toLocaleString()}</span>
            <span className="price-unit">/ night</span>
          </div>
          <div className="selected-room-label">{selectedRoom.roomType}</div>
        </div>
      ) : (
        <div className="price-block">
          <div className="no-selection">Select a site type to see pricing</div>
        </div>
      )}

      {/* Check-in date */}
      <div className="field-cell">
        <div className="field-lbl">Check-in date</div>
        <input
          type="date"
          className="date-input"
          value={bookDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => onBookDateChange(e.target.value)}
        />
      </div>

      {/* Duration stepper */}
      <div className="field-cell">
        <div className="field-lbl">Duration</div>
        <div className="stepper-row">
          <button
            className="stepper-btn"
            onClick={() => onDurationChange(Math.max(1, duration - 1))}
            disabled={duration <= 1}
          >−</button>
          <span className="stepper-val">{duration} {duration === 1 ? 'night' : 'nights'}</span>
          <button
            className="stepper-btn"
            onClick={() => onDurationChange(Math.min(3, duration + 1))}
            disabled={duration >= 3}
          >+</button>
        </div>
        <div className="field-hint">Maximum 3 nights</div>
      </div>

      {/* Guests stepper */}
      <div className="field-cell">
        <div className="field-lbl">Guests</div>
        <div className="stepper-row">
          <button
            className="stepper-btn"
            onClick={() => onGuestsChange(Math.max(1, guests - 1))}
            disabled={guests <= 1}
          >−</button>
          <span className="stepper-val">{guests} {guests === 1 ? 'guest' : 'guests'}</span>
          <button
            className="stepper-btn"
            onClick={() => onGuestsChange(guests + 1)}
            disabled={selectedRoom !== null && guests >= maxGuests}
          >+</button>
        </div>
        {selectedRoom && (
          <div className={`field-hint ${guestExceeds ? 'hint-error' : ''}`}>
            {guestExceeds
              ? `Exceeds capacity (max ${maxGuests})`
              : `Capacity: ${maxGuests} guests`}
          </div>
        )}
      </div>

      {/* Cost breakdown */}
      {selectedRoom && (
        <>
          <div className="divider" />
          <div className="cost-row">
            <span className="cost-lbl">฿{selectedRoom.price.toLocaleString()} × {duration} nights</span>
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

      {bookingError && <p className="booking-error">{bookingError}</p>}

      <button
        className="book-btn"
        disabled={!canBook || bookingLoading}
        onClick={onBook}
      >
        {bookingLoading ? 'Reserving...' : 'Reserve now'}
      </button>

      <p className="reservation-note">You won't be charged yet</p>

      <style>{`
        .reservation-card {
          background: #fff;
          border: 1px solid #e2ddd5;
          border-radius: 14px;
          padding: 1.25rem;
          top: 1rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .price-block { margin-bottom: 2px; }
        .price-main {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .price-amount {
          font-size: 24px;
          font-weight: 700;
          color: #1e2a1c;
        }
        .price-unit { font-size: 13px; color: #8a8a7a; }
        .selected-room-label { font-size: 12px; color: #8a8a7a; margin-top: 2px; }
        .no-selection { font-size: 13px; color: #aaa89a; font-style: italic; }

        .field-cell {
          border: 1px solid #e2ddd5;
          border-radius: 9px;
          padding: 9px 12px;
          transition: border-color 0.15s;
        }
        .field-cell:focus-within {
          border-color: #4a6741;
        }
        .field-lbl {
          font-size: 10px;
          font-weight: 600;
          color: #8a8a7a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 5px;
        }
        .date-input {
          font-size: 13px;
          color: #1e2a1c;
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-family: inherit;
          padding: 0;
          cursor: pointer;
        }
        .stepper-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .stepper-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid #d6d1c8;
          background: #fff;
          color: #3a3a2a;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.12s, border-color 0.12s;
          font-family: inherit;
          padding: 0;
          flex-shrink: 0;
        }
        .stepper-btn:hover:not(:disabled) {
          background: #f2f0ea;
          border-color: #bbb5aa;
        }
        .stepper-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .stepper-val {
          font-size: 13px;
          font-weight: 500;
          color: #1e2a1c;
          min-width: 70px;
          text-align: center;
        }
        .field-hint {
          font-size: 11px;
          color: #aaa89a;
          margin-top: 4px;
        }
        .hint-error { color: #a32d2d; }

        .divider {
          border: none;
          border-top: 1px solid #ece8e0;
          margin: 2px 0;
        }
        .cost-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #5a5a4a;
        }
        .cost-lbl { color: #7a7a6a; }
        .cost-val { color: #3a3a2a; }
        .total-row {
          font-weight: 600;
          font-size: 14px;
          color: #1e2a1c;
        }
        .booking-error {
          color: #a32d2d;
          font-size: 12px;
          margin: 0;
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
          letter-spacing: 0.02em;
          transition: background 0.15s;
          margin-top: 4px;
        }
        .book-btn:hover:not(:disabled) { background: #3a5433; }
        .book-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .reservation-note {
          font-size: 11px;
          color: #aaa89a;
          text-align: center;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default CampReservation;
