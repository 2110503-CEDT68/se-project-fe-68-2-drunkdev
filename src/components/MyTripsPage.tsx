'use client'
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BookingCard, { Booking, BookingStatus } from "./BookingCard";
import { ReservationPaymentPage, ReservationInfo, CreditCard } from "./ReservationPaymentPage";
import Navbar from "./Navbar";
import { getMyBookings, deleteBooking, getCreditCards, payBooking } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Booking as ApiBooking } from "@/types/camp";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TabKey = "all" | BookingStatus;

interface Tab {
  key: TabKey;
  label: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapStatus(apiStatus: ApiBooking["status"]): BookingStatus {
  if (apiStatus === "confirmed") return "upcoming";
  if (apiStatus === "pending")   return "pending";
  if (apiStatus === "cancelled") return "cancelled";
  if (apiStatus === "completed") return "completed";
  return "upcoming";
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function mapBooking(b: ApiBooking): Booking {
  const checkOutDate = new Date(b.bookDate);
  checkOutDate.setDate(checkOutDate.getDate() + b.duration);

  return {
    id: b._id,
    campgroundId: b.campground?._id ?? "",
    status: mapStatus(b.status),
    campName: b.campground?.name ?? "—",
    location: b.campground?.address ?? "—",
    roomType: b.room?.roomType,
    totalPrice: b.room ? b.room.price * b.duration : undefined,
    checkIn: fmtDate(b.bookDate),
    checkOut: checkOutDate.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    }),
    nights: b.duration,
    tel: b.campground?.tel ?? "—",
    createdAt: fmtDate(b.createdAt),
  };
}

function buildReservationInfo(b: ApiBooking): ReservationInfo {
  const checkOutDate = new Date(b.bookDate);
  checkOutDate.setDate(checkOutDate.getDate() + b.duration);

  return {
    campName: b.campground?.name ?? "—",
    campLocation: b.campground?.address ?? "—",
    campImageUrl: "",
    checkIn: fmtDate(b.bookDate),
    checkOut: checkOutDate.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    }),
    checkInTime: "2:00 PM",
    checkOutTime: "12:00 PM",
    nights: b.duration,
    guests: b.room?.capacity ?? 1,
    roomName: b.room?.roomType ?? "—",
    roomImageUrl: "",
    roomTags: b.room ? [`Up to ${b.room.capacity} guests`] : [],
    pricePerNight: b.room?.price ?? 0,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

const MyTripsPage: React.FC = () => {
  const router = useRouter();
  const [rawBookings, setRawBookings] = useState<ApiBooking[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // Pay flow
  const [payingBooking, setPayingBooking] = useState<ApiBooking | null>(null);
  const [paymentCards, setPaymentCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/auth"); return; }

    getMyBookings(token)
      .then((list) => {
        setRawBookings(list);
        setBookings(list.map(mapBooking));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [router]);

  const getCount = (key: TabKey) =>
    key === "all" ? bookings.length : bookings.filter((b) => b.status === key).length;

  const filtered =
    activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);

  const handleEdit = (booking: Booking) => {
    router.push(`/booking/${booking.campgroundId}`);
  };

  const handleRemove = async (booking: Booking) => {
    if (!window.confirm(`Cancel booking for ${booking.campName}?`)) return;
    const token = getToken();
    if (!token) return;
    try {
      await deleteBooking(token, booking.id);
      setRawBookings((prev) => prev.filter((b) => b._id !== booking.id));
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to cancel booking");
    }
  };

  const handlePay = async (booking: Booking) => {
    const token = getToken();
    if (!token) { router.push("/auth"); return; }
    const raw = rawBookings.find((b) => b._id === booking.id) ?? null;
    if (!raw) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cards = await getCreditCards(token).then((list) => list.map((c: any): CreditCard => ({
      id: c._id,
      type: (() => { const f = String(c.cardNumber ?? "").replace(/\D/g, "")[0]; return f === "4" ? "visa" : f === "5" ? "mastercard" : f === "3" ? "amex" : "visa"; })() as CreditCard["type"],
      label: String(c.cardHolderName ?? ""),
      lastFour: String(c.cardNumber ?? "").replace(/\D/g, "").slice(-4),
      expiry: `${String(c.expiryMonth ?? "").padStart(2, "0")}/${String(c.expiryYear ?? "").slice(-2)}`,
      isDefault: c.isDefault ?? false,
    }))).catch(() => []);
    setPaymentCards(cards);
    setPayingBooking(raw);
  };

  const handleConfirmPayment = async (cardId: string) => {
    const token = getToken();
    if (!token || !payingBooking) return;
    try {
      await payBooking(token, payingBooking._id, cardId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment failed';
      throw new Error(msg.toLowerCase().includes('expired') ? 'Credit Card out of balance' : msg);
    }
    // Update local status to upcoming (confirmed after payment)
    setBookings((prev) =>
      prev.map((b) => b.id === payingBooking._id ? { ...b, status: "upcoming" as BookingStatus } : b)
    );
    setRawBookings((prev) =>
      prev.map((b) => b._id === payingBooking._id ? { ...b, status: "confirmed" as ApiBooking["status"] } : b)
    );
    setPayingBooking(null);
  };

  // ── Payment page view ──
  if (payingBooking) {
    return (
      <ReservationPaymentPage
        token={getToken() ?? ""}
        reservation={buildReservationInfo(payingBooking)}
        savedCards={paymentCards}
        onConfirmPayment={handleConfirmPayment}
        onReserve={async () => {}}
        showReserveButton={false}
        onBack={() => setPayingBooking(null)}
        onAddCard={() => {}}
      />
    );
  }

  // ── Trips list view ──
  return (
    <>
      <style>{`
        .mtp { font-family: 'Helvetica Neue', Arial, sans-serif; background: #faf9f6; min-height: 100vh; }
        .mtp-inner { padding: 1.5rem; max-width: 720px; margin: 0 auto; }
        .mtp-head { margin-bottom: 1.25rem; }
        .mtp-title { font-size: 22px; font-weight: 500; color: #1e2a1c; letter-spacing: -0.2px; }
        .mtp-sub { font-size: 13px; color: #8a8a7a; margin-top: 2px; }
        .mtp-tabs { display: flex; gap: 6px; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .mtp-tab { padding: 7px 14px; border-radius: 99px; border: 1px solid #e2ddd5; font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #5a5a4a; transition: all 0.15s; white-space: nowrap; font-family: inherit; }
        .mtp-tab:hover { border-color: #bbb5aa; background: #fdfcfa; }
        .mtp-tab.mtp-tab-active { background: #4a6741; color: #fff; border-color: #4a6741; }
        .mtp-tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; border-radius: 99px; font-size: 10px; font-weight: 600; margin-left: 5px; padding: 0 4px; }
        .mtp-tab-active .mtp-tab-count { background: rgba(255,255,255,0.25); color: #fff; }
        .mtp-tab:not(.mtp-tab-active) .mtp-tab-count { background: #f0ede8; color: #7a7a6a; }
        .mtp-list { display: flex; flex-direction: column; gap: 12px; }
        .mtp-empty { text-align: center; padding: 2.5rem 1rem; color: #8a8a7a; font-size: 13px; }
        .mtp-empty-icon { width: 40px; height: 40px; border-radius: 50%; background: #f2f0ea; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
        .mtp-loading { padding: 2rem; text-align: center; font-size: 13px; color: #8a8a7a; }
        .mtp-error { padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #a32d2d; font-size: 13px; margin-bottom: 1rem; }
        .mtp-explore { margin-top: 12px; padding: 9px 20px; background: #4a6741; color: #fff; border: none; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit; }
        .mtp-explore:hover { background: #3a5433; }
      `}</style>

      <div className="mtp">
        <Navbar showTrips={false} />

        <div className="mtp-inner">
          <div className="mtp-head">
            <div className="mtp-title">My trips</div>
            <div className="mtp-sub">All your campground bookings</div>
          </div>

          {error && <div className="mtp-error">{error}</div>}

          <div className="mtp-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`mtp-tab ${activeTab === tab.key ? "mtp-tab-active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="mtp-tab-count">{getCount(tab.key)}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mtp-loading">Loading your trips…</div>
          ) : (
            <div className="mtp-list">
              {filtered.length === 0 ? (
                <div className="mtp-empty">
                  <div className="mtp-empty-icon">
                    <CalendarEmptyIcon />
                  </div>
                  No bookings found
                  {activeTab === "all" && (
                    <div>
                      <button className="mtp-explore" onClick={() => router.push("/")}>
                        Explore camps
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filtered.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onEdit={handleEdit}
                    onRemove={handleRemove}
                    onPay={handlePay}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Icons ──────────────────────────────────────────────────────────────────────

const CalendarEmptyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#8a8a7a" strokeWidth={1.4}>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M5 3V2M11 3V2M2 7h12" />
  </svg>
);

export default MyTripsPage;
