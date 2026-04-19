import { Room } from "@/types/camp";
import React from "react";

export interface RoomType {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  tags: string[];
  availability: "available" | "low" | "unavailable";
  availabilityLabel: string;
  popular?: boolean;
}

interface CampRoomTypesProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
}

const availColors = {
  available: { bg: "#eaf3de", color: "#3b6d11" },
  low: { bg: "#faeeda", color: "#854f0b" },
  unavailable: { bg: "#f0efea", color: "#8a8a7a" },
};

const CampRoomTypes: React.FC<CampRoomTypesProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
}) => {
  return (
    <div className="room-types-wrap">
      <div className="section-label">Choose your site type</div>

      <div className="rooms-list">
        {rooms.map((room) => {
          const isSelected = selectedRoomId === room._id;
          const isUnavailable = room.available == 0;
          let avail;
          let availabilityLabel;
          if(room.available > 5) {
            availabilityLabel = "Avaliable"
            avail = { bg: "#eaf3de", color: "#3b6d11" };
          }
          else if(room.available > 0) {
            availabilityLabel = `${room.available} left`
            avail = { bg: "#faeeda", color: "#854f0b" };
          }
          else {
            availabilityLabel = "Fully Booked"
            avail = { bg: "#f0efea", color: "#8a8a7a" };
          }

          return (
            <div
              key={room._id}
              className={`room-card ${isSelected ? "room-selected" : ""} ${isUnavailable ? "room-unavailable" : ""}`}
              onClick={() => !isUnavailable && onSelectRoom(room)}
            >
              <div className="radio-dot-wrap">
                <div className={`radio-dot ${isSelected ? "dot-checked" : ""}`}>
                  {isSelected && <div className="dot-inner" />}
                </div>
              </div>

              <div className="room-thumb">
                {/* <img src={room.imgSrc} alt={room.name} /> */}
              </div>

              <div className="room-body">
                <div className="room-name-row">
                  <span className="room-name">{room.roomType}</span>
                  {/* {room.popular && <span className="popular-badge">Popular</span>} */}
                </div>
                <p className="room-desc">{room.description}</p>
                <div className="room-tags">
                  {/* {room.tags.map((tag) => (
                    <span key={tag} className="rtag">{tag}</span>
                  ))} */}
                </div>
              </div>

              <div className="room-right">
                <div className="room-price-group">
                  <span className="room-price">
                    ฿{room.price.toLocaleString()}
                  </span>
                  <span className="room-price-unit">/ night</span>
                </div>
                <span
                  className="avail-badge"
                  style={{ background: avail.bg, color: avail.color }}
                >
                  {availabilityLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .room-types-wrap {
          width: 100%;
        }
        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a8a7a;
          margin-bottom: 0.75rem;
        }
        .rooms-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .room-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border: 1px solid #e2ddd5;
          border-radius: 12px;
          padding: 13px 14px;
          cursor: pointer;
          background: #fff;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .room-card:hover:not(.room-unavailable) {
          border-color: #bbb5aa;
          background: #fdfcfa;
        }
        .room-selected {
          border: 2px solid #4a6741 !important;
          background: #fafcf9 !important;
        }
        .room-unavailable {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .radio-dot-wrap {
          padding-top: 2px;
          flex-shrink: 0;
        }
        .radio-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid #c8c3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color 0.15s, background 0.15s;
        }
        .dot-checked {
          border-color: #4a6741;
          background: #4a6741;
        }
        .dot-inner {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fff;
        }
        .room-thumb {
          width: 72px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          background: #ece8e0;
        }
        .room-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .room-body {
          flex: 1;
          min-width: 0;
        }
        .room-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
          flex-wrap: wrap;
        }
        .room-name {
          font-size: 14px;
          font-weight: 500;
          color: #1e2a1c;
        }
        .popular-badge {
          font-size: 10px;
          background: #eaf3de;
          color: #3b6d11;
          border-radius: 99px;
          padding: 2px 8px;
          font-weight: 600;
        }
        .room-desc {
          font-size: 12px;
          color: #7a7a6a;
          line-height: 1.5;
          margin: 0 0 6px;
        }
        .room-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .rtag {
          font-size: 11px;
          color: #7a7a6a;
          background: #f2f0ea;
          border-radius: 99px;
          padding: 2px 9px;
          border: 1px solid #e5e1d8;
        }
        .room-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
          min-width: 80px;
        }
        .room-price-group {
          text-align: right;
        }
        .room-price {
          font-size: 15px;
          font-weight: 600;
          color: #1e2a1c;
          display: block;
        }
        .room-price-unit {
          font-size: 11px;
          color: #aaa89a;
        }
        .avail-badge {
          font-size: 11px;
          padding: 3px 9px;
          border-radius: 99px;
          font-weight: 500;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default CampRoomTypes;
