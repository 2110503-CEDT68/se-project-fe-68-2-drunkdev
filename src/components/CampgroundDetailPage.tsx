import React, { useEffect, useState } from "react";
import CampImage from "./CampImage";
import CampDetails from "./CampDetails";
import CampRatingsReviews from "./CampRatingsReviews";
import CampRoomTypes, { RoomType } from "./CampRoomTypes";
import CampReservation from "./CampReservation";
import { getCampById } from "@/lib/api";
import { useParams } from "next/navigation";
import { Camp } from "@/types/camp";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const CAMP_DATA = {
  name: "Forest Breeze Camp",
  location: "หาดใหญ่, สงขลา",
  region: "South",
  description:
    "A peaceful hillside retreat surrounded by towering pine trees and fresh mountain air. Forest Breeze Camp offers a balance of wilderness and comfort — perfect for families, solo travelers, and groups looking to disconnect from the city. Wake up to birdsong, brew coffee over an open fire, and spend your evenings under a canopy of stars.",
  imageUrl:
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80",
  rating: 4.9,
  reviewCount: 38,
};

const RATING_BREAKDOWN = [34, 3, 1, 0, 0]; // 5→1 star counts

const REVIEWS = [
  {
    id: "r1",
    name: "Thanakorn K.",
    initials: "TK",
    avatarColor: "green" as const,
    date: "March 2025",
    rating: 5,
    text: "Absolutely loved it. The forest is dense and quiet — we barely heard anything at night except crickets. The fire pits are well-spaced and the staff were super helpful. Will be back next season.",
  },
  {
    id: "r2",
    name: "Sunisa L.",
    initials: "SL",
    avatarColor: "blue" as const,
    date: "February 2025",
    rating: 5,
    text: "Perfect weekend escape from Bangkok. Brought the whole family and my kids are still talking about it. The campsite is clean and the showers were surprisingly good!",
  },
  {
    id: "r3",
    name: "Mana P.",
    initials: "MP",
    avatarColor: "amber" as const,
    date: "January 2025",
    rating: 4,
    text: "Great atmosphere, friendly staff. Only minor thing — the Wi-Fi signal near campsite B is weak. Otherwise it was a really lovely stay.",
  },
];

const ROOM_TYPES: RoomType[] = [
  {
    id: "tent",
    name: "Standard tent site",
    description:
      "A flat, shaded plot with ground stakes. Fits tents up to 4×4m. Shared bathrooms nearby.",
    price: 850,
    imageUrl:
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=200&q=70",
    tags: ["Up to 4 guests", "Shared bathroom", "Fire pit"],
    availability: "available",
    availabilityLabel: "Available",
    popular: true,
  },
  {
    id: "glamping",
    name: "Glamping tent",
    description:
      "Pre-set canvas bell tent with a real bed, side table, fairy lights, and a private outdoor shower.",
    price: 1800,
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=70",
    tags: ["Up to 2 guests", "Private shower", "Bed & linens"],
    availability: "low",
    availabilityLabel: "2 left",
  },
  {
    id: "cabin",
    name: "Forest cabin",
    description:
      "A cozy wooden cabin tucked in the trees with a private deck, en-suite bathroom, and kitchenette.",
    price: 2600,
    imageUrl:
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=200&q=70",
    tags: ["Up to 4 guests", "En-suite", "Kitchenette", "Deck"],
    availability: "available",
    availabilityLabel: "Available",
  },
  {
    id: "rv",
    name: "RV hookup site",
    description:
      "A paved pad with electric and water hookup. Suitable for trailers and motorhomes up to 10m.",
    price: 1200,
    imageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=200&q=70",
    tags: ["Electric hookup", "Water hookup", "Dump station"],
    availability: "unavailable",
    availabilityLabel: "Fully booked",
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

const CampgroundDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [camp, setCamp] = useState<Camp | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(
    ROOM_TYPES[0]
  );

  useEffect( ()=> {
    getCampById(id).then(setCamp);
  }, [id])

  // Simulate: change to false to see normal user view
  const isAdmin = true;

  if (!camp) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <>
      {/* <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap"
        rel="stylesheet"
      /> */}

      <div className="page">
        {/* Back nav */}
        <button className="back-link" onClick={() => history.back()}>
          <BackIcon />
          Back to explore
        </button>

        {/* Full-width hero image */}
        <CampImage
          imgSrc={camp.imgSrc[0]}
          campName={camp.name}
          region={camp.region}
          rating={camp.averageRating}
          reviewCount={camp.totalReviews}
        />

        {/* Main two-column layout */}
        <div className="main-layout">
          {/* ── Left column ── */}
          <div className="left-col">
            {/* Camp name + about */}
            <CampDetails
              name={camp.name}
              location={`${camp.district}, ${camp.province}`}
              description={camp.description}
            />

            <div className="section-divider" />

            {/* Room type selection */}
            <CampRoomTypes
              rooms={ROOM_TYPES}
              selectedRoomId={selectedRoom?.id ?? null}
              onSelectRoom={setSelectedRoom}
            />
          </div>

          {/* ── Right column ── */}
          <div className="right-col">
            {/* Reservation card */}
            <CampReservation
              selectedRoom={selectedRoom}
              checkIn="Apr 20"
              checkOut="Apr 22"
              guests={2}
              nights={2}
              isAdmin={isAdmin}
              onEditCamp={() => alert("Open edit camp form")}
            />

            <div className="section-divider" />

            {/* Ratings & Reviews — compact, under reservation */}
            <CampRatingsReviews
              overallRating={camp.averageRating}
              reviewCount={camp.totalReviews}
              ratingBreakdown={RATING_BREAKDOWN}
            />
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          // font-family: 'Helvetica Neue', Arial, sans-serif;
          background: #faf9f6;
          min-height: 100vh;
          
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #7a7a6a;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 1.4rem;
          font-family: inherit;
          transition: color 0.15s;
        }
        .back-link:hover {
          color: #3a3a2a;
        }
        .back-link svg {
          width: 14px;
          height: 14px;
        }

        .main-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
          align-items: start;
        }

        .left-col {
          min-width: 0;
        }

        .right-col {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .section-divider {
          border: none;
          border-top: 1px solid #e8e4dc;
          margin: 1.25rem 0;
        }

        @media (max-width: 680px) {
          .main-layout {
            grid-template-columns: 1fr;
          }
          .right-col {
            order: -1;
          }
        }
      `}</style>
    </>
  );
};

const BackIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path d="M10 12L6 8l4-4" />
  </svg>
);

export default CampgroundDetailPage;
