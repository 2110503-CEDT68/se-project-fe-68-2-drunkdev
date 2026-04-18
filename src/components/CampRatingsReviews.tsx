import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isLoggedIn } from "@/lib/auth";
import { getMe } from "@/lib/api";

interface Review {
  id: string;
  name: string;
  initials: string;
  avatarColor: "green" | "blue" | "amber";
  date: string;
  rating: number;
  text: string;
}

interface CampRatingsReviewsProps {
  overallRating: number;
  reviewCount: number;
  ratingBreakdown: number[]; // index 0 = 5 stars, index 4 = 1 star
  reviews: Review[];
}

const avatarStyles: Record<string, { bg: string; color: string }> = {
  green: { bg: "#e1f5ee", color: "#0f6e56" },
  blue: { bg: "#e6f1fb", color: "#185fa5" },
  amber: { bg: "#faeeda", color: "#854f0b" },
};

const CampRatingsReviews: React.FC<CampRatingsReviewsProps> = ({
  overallRating,
  reviewCount,
  ratingBreakdown,
  reviews,
}) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter();

  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const visibleReviews = expanded ? reviews : reviews.slice(0, 1);
  const maxBar = Math.max(...ratingBreakdown);

  useEffect( () => {
    if (isLoggedIn()) {
      const token = getToken();
      if (token) {
        setLoggedIn(true)
        getMe(token).then(user => setUsername(user.name))
      }
    }
  }, [])

  return (
    <div className="ratings-wrap">
      <div className="section-label">Ratings & Reviews</div>

      <div className="rating-summary">
        <div className="big-rating">{overallRating.toFixed(1)}</div>
        <div className="rating-right">
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} filled={s <= Math.round(overallRating)} />
            ))}
          </div>
          <div className="review-count">{reviewCount} reviews</div>
          <div className="bar-list">
            {ratingBreakdown.map((count, i) => (
              <div className="bar-row" key={i}>
                <span className="bar-lbl">{5 - i}</span>
                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{ width: maxBar > 0 ? `${(count / maxBar) * 100}%` : "0%" }}
                  />
                </div>
                <span className="bar-ct">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="write-review-box">
        <div className="write-label">Leave a review</div>
        <div className="star-select">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className="star-btn"
              style={{ color: s <= (hoverRating || userRating) ? "#c47f17" : "#d4c9b0" }}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setUserRating(s)}
            >
              ★
            </span>
          ))}
        </div>
        <textarea
          className="review-textarea"
          rows={3}
          placeholder="Share your experience..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
        />
        <div className="review-footer">
          <span className="reviewer-hint">Reviewing as {username}</span>
          <button className="submit-btn">Submit</button>
        </div>
      </div>

      <div className="reviews-list">
        {visibleReviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="reviewer-row">
              <div
                className="avatar"
                style={{
                  background: avatarStyles[review.avatarColor].bg,
                  color: avatarStyles[review.avatarColor].color,
                }}
              >
                {review.initials}
              </div>
              <div className="reviewer-meta">
                <div className="reviewer-name">{review.name}</div>
                <div className="reviewer-date">{review.date}</div>
              </div>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} filled={s <= review.rating} size={11} />
                ))}
              </div>
            </div>
            <p className="review-text">{review.text}</p>
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <button
          className="show-more-btn"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? "Show less"
            : `Show all ${reviews.length} reviews`}
          <ChevronIcon flipped={expanded} />
        </button>
      )}

      <style>{`
        .ratings-wrap {
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
        .rating-summary {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 1.1rem;
        }
        .big-rating {
          // font-family: 'Playfair Display', Georgia, serif;
          font-size: 44px;
          font-weight: 700;
          color: #1e2a1c;
          line-height: 1;
          flex-shrink: 0;
        }
        .rating-right {
          flex: 1;
          min-width: 0;
        }
        .stars-row {
          display: flex;
          gap: 2px;
          margin-bottom: 2px;
        }
        .review-count {
          font-size: 12px;
          color: #8a8a7a;
          margin-bottom: 8px;
        }
        .bar-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bar-lbl {
          font-size: 11px;
          color: #8a8a7a;
          width: 8px;
          text-align: right;
          flex-shrink: 0;
        }
        .bar-bg {
          flex: 1;
          height: 4px;
          background: #ece8e0;
          border-radius: 99px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: #c47f17;
          border-radius: 99px;
          transition: width 0.3s ease;
        }
        .bar-ct {
          font-size: 10px;
          color: #aaa89a;
          width: 16px;
          text-align: right;
          flex-shrink: 0;
        }
        .write-review-box {
          background: #f5f3ee;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 1rem;
        }
        .write-label {
          font-size: 11px;
          font-weight: 600;
          color: #8a8a7a;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 7px;
        }
        .star-select {
          display: flex;
          gap: 3px;
          margin-bottom: 8px;
        }
        .star-btn {
          font-size: 20px;
          cursor: pointer;
          transition: color 0.1s, transform 0.1s;
          line-height: 1;
        }
        .star-btn:hover {
          transform: scale(1.15);
        }
        .review-textarea {
          width: 100%;
          background: #fff;
          border: 1px solid #e2ddd5;
          border-radius: 8px;
          padding: 9px 11px;
          font-size: 13px;
          color: #3a3a2a;
          resize: none;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
        }
        .review-textarea:focus {
          border-color: #4a6741;
        }
        .review-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .reviewer-hint {
          font-size: 11px;
          color: #aaa89a;
        }
        .submit-btn {
          background: #4a6741;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 6px 15px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }
        .submit-btn:hover {
          background: #3a5433;
        }
        .reviews-list {
          display: flex;
          flex-direction: column;
        }
        .review-card {
          padding: 13px 0;
          border-bottom: 1px solid #ece8e0;
        }
        .review-card:last-child {
          border-bottom: none;
        }
        .reviewer-row {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 7px;
        }
        .avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .reviewer-meta {
          flex: 1;
        }
        .reviewer-name {
          font-size: 13px;
          font-weight: 500;
          color: #2a2a1a;
        }
        .reviewer-date {
          font-size: 11px;
          color: #aaa89a;
        }
        .review-stars {
          display: flex;
          gap: 1px;
        }
        .review-text {
          font-size: 13px;
          color: #5a5a4a;
          line-height: 1.65;
          margin: 0;
        }
        .show-more-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: none;
          border: 1px solid #d6d1c8;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 12px;
          color: #5a5a4a;
          cursor: pointer;
          font-family: inherit;
          margin-top: 10px;
          transition: background 0.15s, border-color 0.15s;
        }
        .show-more-btn:hover {
          background: #f5f3ee;
          border-color: #bbb9b0;
        }
      `}</style>
    </div>
  );
};

const StarIcon = ({ filled, size = 13 }: { filled: boolean; size?: number }) => (
  <svg
    viewBox="0 0 16 16"
    fill={filled ? "#c47f17" : "#ddd9cf"}
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.12L8 10.5l-3.71 1.95.71-4.12L2 5.5l4.15-.75L8 1z" />
  </svg>
);

const ChevronIcon = ({ flipped }: { flipped: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    style={{
      width: 13,
      height: 13,
      transform: flipped ? "rotate(180deg)" : "none",
      transition: "transform 0.2s",
    }}
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);

export default CampRatingsReviews;
