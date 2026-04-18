import React from "react";

interface CampDetails {
  name: string,
  location: string,
  description: string
}

export default function CampDetails({
  name,
  location,
  description,
}: CampDetails) {
  return (
    <div className="camp-details">
      <h1 className="camp-name">{name}</h1>
      <div className="camp-location">
        <PinIcon />
        {location}
      </div>

      <hr className="divider" />

      <div className="section-label">About</div>
      <p className="camp-description">{description}</p>

      <style>{`
        .camp-details {
          width: 100%;
        }
        .camp-name {
          // font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 600;
          color: #1e2a1c;
          margin: 0 0 6px;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        .camp-location {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #b83228;
          margin-bottom: 0;
        }
        .camp-location svg {
          width: 13px;
          height: 13px;
          flex-shrink: 0;
        }
        .divider {
          border: none;
          border-top: 1px solid #e8e4dc;
          margin: 1.1rem 0;
        }
        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a8a7a;
          margin-bottom: 0.5rem;
        }
        .camp-description {
          font-size: 14px;
          color: #5a5a4a;
          line-height: 1.75;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

const PinIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
  </svg>
);
