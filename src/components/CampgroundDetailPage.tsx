import React, { useEffect, useState } from "react";
import CampImage from "./CampImage";
import CampDetails from "./CampDetails";
import CampRatingsReviews from "./CampRatingsReviews";
import CampRoomTypes from "./CampRoomTypes";
import CampReservation from "./CampReservation";
import { ReservationPaymentPage, ReservationInfo } from "./ReservationPaymentPage";
import { getCampById, createBooking, getCreditCards, payBooking, BookingRoom } from "@/lib/api";
import { getToken, isLoggedIn } from "@/lib/auth";
import { useParams, useRouter } from "next/navigation";
import { Camp, Room } from "@/types/camp";
import type { CreditCard } from "./ReservationPaymentPage";


// ─── Page Component ───────────────────────────────────────────────────────────

const CampgroundDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [camp, setCamp] = useState<Camp | null>(null)
  const [roomType, setRoomType] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookDate, setBookDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [reservationInfo, setReservationInfo] = useState<ReservationInfo | null>(null);
  const [savedCards, setSavedCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    getCampById(id).then((c) => {
      setCamp(c);
      setRoomType(c.rooms ?? []);
      setSelectedRoom(c.rooms?.[0] ?? null);
    }).catch(err => console.error('Failed to fetch camp:', err));
  }, [id])

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapBackendCard = (c: any): CreditCard => {
    const digits = String(c.cardNumber ?? '').replace(/\D/g, '');
    const first = digits[0];
    const type: CreditCard['type'] =
      first === '4' ? 'visa' : first === '5' ? 'mastercard' : first === '3' ? 'amex' : 'visa';
    const lastFour = digits.slice(-4) || '????';
    const mm = String(c.expiryMonth ?? '').padStart(2, '0');
    const yy = String(c.expiryYear ?? '').slice(-2);
    return {
      id: c._id,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      lastFour,
      expiry: `${mm}/${yy}`,
      isDefault: c.isDefault ?? false,
    };
  };

  const handleBook = async () => {
    if (!isLoggedIn()) { router.push('/auth'); return; }
    if (!bookDate) { setBookingError('กรุณาเลือกวันที่'); return; }
    if (selectedRoom && guests > selectedRoom.capacity) { setBookingError(`จำนวนคนเกินความจุ (สูงสุด ${selectedRoom.capacity} คน)`); return; }
    if (!selectedRoom || !camp) return;
    setBookingError('');

    const checkOutDate = new Date(bookDate + 'T12:00:00');
    checkOutDate.setDate(checkOutDate.getDate() + duration);

    const token = getToken();
    const cards = token
      ? await getCreditCards(token).then((list) => list.map(mapBackendCard)).catch(() => [])
      : [];
    setSavedCards(cards);

    setReservationInfo({
      campName: camp.name,
      campLocation: `${camp.district}, ${camp.province}`,
      campImageUrl: camp.imgSrc?.[0] ?? '',
      checkIn: formatDate(bookDate),
      checkOut: checkOutDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      checkInTime: '2:00 PM',
      checkOutTime: '12:00 PM',
      nights: duration,
      guests,
      roomName: selectedRoom.roomType,
      roomImageUrl: camp.imgSrc?.[1] ?? camp.imgSrc?.[0] ?? '',
      roomTags: [`Up to ${selectedRoom.capacity} guests`],
      pricePerNight: selectedRoom.price,
    });
    setShowPayment(true);
  };

  const buildRoom = (): BookingRoom => ({
    roomType: selectedRoom?.roomType ?? '',
    description: selectedRoom?.description ?? '',
    price: selectedRoom?.price ?? 0,
    capacity: selectedRoom?.capacity ?? 1,
  });

  const handleConfirmPayment = async (cardId: string) => {
    const token = getToken();
    if (!token) { router.push('/auth'); return; }
    const booking = await createBooking(token, id, new Date(bookDate).toISOString(), duration, buildRoom());
    try {
      await payBooking(token, booking._id, cardId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment failed';
      throw new Error(msg.toLowerCase().includes('expired') ? 'Credit Card out of balance' : msg);
    }
    router.push('/my-trips');
  };

  const handleReserve = async () => {
    const token = getToken();
    if (!token) { router.push('/auth'); return; }
    await createBooking(token, id, new Date(bookDate).toISOString(), duration, buildRoom());
    router.push('/my-trips');
  };

  const isAdmin = false;

  if (!camp) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  if (showPayment && reservationInfo) {
    return (
      <ReservationPaymentPage
        token={getToken() ?? ''}
        reservation={reservationInfo}
        savedCards={savedCards}
        onConfirmPayment={handleConfirmPayment}
        onReserve={handleReserve}
        onBack={() => setShowPayment(false)}
        onAddCard={() => {}}
      />
    );
  }

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
          imgSrc={camp.imgSrc?.[0]}
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
              rooms={roomType}
              selectedRoomId={selectedRoom?._id ?? null}
              onSelectRoom={setSelectedRoom}
            />
          </div>

          {/* ── Right column ── */}
          <div className="right-col">
            {/* Reservation card */}
            <CampReservation
              selectedRoom={selectedRoom}
              bookDate={bookDate}
              duration={duration}
              guests={guests}
              onBookDateChange={setBookDate}
              onDurationChange={setDuration}
              onGuestsChange={setGuests}
              onBook={handleBook}
              bookingLoading={bookingLoading}
              bookingError={bookingError}
            />

            <div className="section-divider" />

            {/* Ratings & Reviews — compact, under reservation */}
            <CampRatingsReviews campgroundId={id}/>
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
