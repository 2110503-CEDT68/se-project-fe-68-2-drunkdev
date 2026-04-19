import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isLoggedIn } from "@/lib/auth";
import { createReview, deleteReview, getMe, getReviews, updateReview } from "@/lib/api";
import { Review } from "@/types/camp";

// interface Review {
//   id: string;
//   name: string;
//   initials: string;
//   avatarColor: "green" | "blue" | "amber";
//   date: string;
//   rating: number;
//   text: string;
// }

interface CampRatingsReviewsProps {
  overallRating: number;
  reviewCount: number;
  ratingBreakdown: number[]; // index 0 = 5 stars, index 5 = 1 star
  reviews: Review[];
}

const avatarColor = ['green', 'blue', 'amber'];
const avatarStyles: Record<string, { bg: string; color: string }> = {
  green: { bg: "#e1f5ee", color: "#0f6e56" },
  blue: { bg: "#e6f1fb", color: "#185fa5" },
  amber: { bg: "#faeeda", color: "#854f0b" },
};

const CampRatingsReviews = ({campgroundId}: {campgroundId: string}) => {
  // For store data

  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingBreakdown, setRatingBrekdown] = useState([0,0,0,0,0])
  const [avgRating, setAvgRating] = useState(0);
  const userIdRef = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(0);
  useEffect(() => {
    if (isLoggedIn()) {
      const token = getToken();
      if (token) {
        getMe(token).then((user) => {
          setUsername(user.name);
          userIdRef.current = user._id;
      });
      }
    }
    getReviews({ campgroundId: campgroundId }).then((r) => {
      // console.log("Review")
      // console.log(r);
      setReviews(r);
    });
  }, [campgroundId]);

  useEffect(() => {
    let breakdown = [0, 0, 0, 0, 0];
    let totalRating = 0;

    (reviews ?? []).forEach( (r) => {
      const rating = Number(r.rating);
      const i = rating - 1;
      if (i >= 0 && i < 5) {
        totalRating += rating;
        breakdown[4-i]++;
      }
    })

    setAvgRating(reviews && reviews.length > 0 ? Number((totalRating/reviews.length).toFixed(1)) : 0);

    setRatingBrekdown(breakdown);
  }, [reviews]);
  

  // For UI 
  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const visibleReviews = expanded ? reviews : reviews.slice(0, 1);
  const maxBar = Math.max(...ratingBreakdown);

  const handleSubmitReview = async () => {
    if (!userRating || !reviewText.trim()) return;

    const token = getToken();
    if (!token) return;

    await createReview(token, campgroundId, userRating, reviewText)
    // refresh
    const r = await getReviews({ campgroundId });
    setReviews(r ?? []);

    // reset form
    setUserRating(0);
    setReviewText("");
  };  

  const handleDelete = async (reviewId: string) => {
    const token = getToken();
    if (!token) return;

    const oldReviews = reviews;

    //  remove from Reviews first
    setReviews((prev) => prev.filter((r) => r._id !== reviewId));

    try {
      await deleteReview(token, reviewId);
    } catch (err) {
      console.error(err);

      // rollback
      setReviews(oldReviews);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review._id);
    setEditText(review.comment);
    setEditRating(review.rating);
  };

  const handleEdit = async () => {
    const token = getToken();
    if (!token || !editingId) return;

    const oldReviews = reviews;

    // ✅ optimistic update
    setReviews((prev) =>
      prev.map((r) =>
        r._id === editingId
          ? { ...r, rating: editRating, comment: editText }
          : r,
      ),
    );

    try {
      await updateReview(token, editingId, editRating, editText);

      setEditingId(null);
    } catch (err) {
      console.error(err);

      // ❌ rollback
      setReviews(oldReviews);
    }
  };

  return (
    <div className="ratings-wrap">
      <div className="section-label">Ratings & Reviews</div>

      <div className="rating-summary">
        <div className="big-rating">{avgRating}</div>
        <div className="rating-right">
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} filled={s <= Math.round(avgRating)} />
            ))}
          </div>
          <div className="review-count">{reviews.length} reviews</div>
          <div className="bar-list">
            {ratingBreakdown.map((count, i) => (
              <div className="bar-row" key={i}>
                <span className="bar-lbl">{5 - i}</span>
                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{
                      width: maxBar > 0 ? `${(count / maxBar) * 100}%` : "0%",
                    }}
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
              style={{
                color: s <= (hoverRating || userRating) ? "#c47f17" : "#d4c9b0",
              }}
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
          <span className="reviewer-hint">
            {username ? `Reviewing as ${username}` : "Sign in?"}
          </span>
          <button className="submit-btn" onClick={handleSubmitReview}>
            Submit
          </button>
        </div>
      </div>

      <div className="reviews-list">
        {visibleReviews.map((review, i) => (
          <div key={review._id} className="review-card">
            <div className="reviewer-row">
              <div
                className="avatar"
                style={{
                  background:
                    avatarStyles[avatarColor[i % avatarColor.length]].bg,
                  color:
                    avatarStyles[avatarColor[i % avatarColor.length]].color,
                }}
              >
                {review.user.name[0].toUpperCase() +
                  review.user.name[review.user.name.length - 1].toUpperCase()}
              </div>
              <div className="reviewer-meta">
                <div className="reviewer-name">
                  {review.user.name}
                  {review.user._id === userIdRef.current && (
                    <span className="own-badge"> (You)</span>
                  )}
                </div>
                <div className="reviewer-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Stars — edit mode แสดง interactive stars, ปกติแสดง static */}
              <div className="review-stars">
                {editingId === review._id ? (
                  <div className="edit-stars-wrap">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className="edit-star-btn"
                        style={{
                          color: s <= editRating ? "#c47f17" : "#ddd9cf",
                        }}
                        onClick={() => setEditRating(s)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                ) : (
                  [1, 2, 3, 4, 5].map((s) => (
                    <StarIcon key={s} filled={s <= review.rating} size={11} />
                  ))
                )}
              </div>
            </div>

            {/* Comment area */}
            {editingId === review._id ? (
              <textarea
                className="review-textarea"
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : (
              <p className="review-text">{review.comment}</p>
            )}

            {/* Action buttons (only user's review) */}
            {review.user._id === userIdRef.current && (
              <div className="review-actions">
                {editingId === review._id ? (
                  <>
                    <button
                      className="action-btn save-btn"
                      onClick={handleEdit}
                      title="Save"
                    >
                      <svg viewBox="0 0 640 640" fill="currentColor">
                        <path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" />
                      </svg>
                    </button>
                    <button
                      className="action-btn cancel-btn"
                      onClick={() => setEditingId(null)}
                      title="Cancel"
                    >
                      <svg viewBox="0 0 640 640" fill="currentColor">
                        <path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => startEdit(review)}
                      title="Edit"
                    >
                      <svg viewBox="0 0 640 640" fill="currentColor">
                        <path d="M505 122.9L517.1 135C526.5 144.4 526.5 159.6 517.1 168.9L488 198.1L441.9 152L471 122.9C480.4 113.5 495.6 113.5 504.9 122.9zM273.8 320.2L408 185.9L454.1 232L319.8 366.2C316.9 369.1 313.3 371.2 309.4 372.3L250.9 389L267.6 330.5C268.7 326.6 270.8 323 273.7 320.1zM437.1 89L239.8 286.2C231.1 294.9 224.8 305.6 221.5 317.3L192.9 417.3C190.5 425.7 192.8 434.7 199 440.9C205.2 447.1 214.2 449.4 222.6 447L322.6 418.4C334.4 415 345.1 408.7 353.7 400.1L551 202.9C579.1 174.8 579.1 129.2 551 101.1L538.9 89C510.8 60.9 465.2 60.9 437.1 89zM152 128C103.4 128 64 167.4 64 216L64 488C64 536.6 103.4 576 152 576L424 576C472.6 576 512 536.6 512 488L512 376C512 362.7 501.3 352 488 352C474.7 352 464 362.7 464 376L464 488C464 510.1 446.1 528 424 528L152 528C129.9 528 112 510.1 112 488L112 216C112 193.9 129.9 176 152 176L264 176C277.3 176 288 165.3 288 152C288 138.7 277.3 128 264 128L152 128z" />
                      </svg>
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(review._id)}
                      title="Delete"
                    >
                      <svg viewBox="0 0 640 640" fill="currentColor">
                        <path d="M504.6 148.5C515.9 134.9 514.1 114.7 500.5 103.4C486.9 92.1 466.7 93.9 455.4 107.5L320 270L184.6 107.5C173.3 93.9 153.1 92.1 139.5 103.4C125.9 114.7 124.1 134.9 135.4 148.5L278.3 320L135.4 491.5C124.1 505.1 125.9 525.3 139.5 536.6C153.1 547.9 173.3 546.1 184.6 532.5L320 370L455.4 532.5C466.7 546.1 486.9 547.9 500.5 536.6C514.1 525.3 515.9 505.1 504.6 491.5L361.7 320L504.6 148.5z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <button
          className="show-more-btn"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less" : `Show all ${reviews.length} reviews`}
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
        .edit-stars-wrap {
          display: flex;
          gap: 2px;
          align-items: center;
          padding: 4px 8px;
          border: 1px solid #e2ddd5;
          border-radius: 8px;
          background: #fff;
        }
        .edit-stars-wrap:focus-within {
          border-color: #4a6741;
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
        .edit-star-btn {
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.1s;
          line-height: 1;
        }
        .edit-star-btn:hover {
          transform: scale(1.2);
        }
        .review-actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 8px;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid #e2ddd5;
          background: #fff;
          cursor: pointer;
          padding: 6px;
          transition: background 0.15s, border-color 0.15s;
        }
        .action-btn svg {
          width: 100%;
          height: 100%;
        }
        .edit-btn { margin: 0px; color: #5a5a4a; }
        .edit-btn:hover { background: #f5f3ee; border-color: #bbb5aa; }
        .delete-btn { color: #a32d2d; }
        .delete-btn:hover { background: #fcebeb; border-color: #f09595; }
        .save-btn { color: #3b6d11; }
        .save-btn:hover { background: #eaf3de; border-color: #97c459; }
        .cancel-btn { color: #5a5a4a; }
        .cancel-btn:hover { background: #f5f3ee; border-color: #bbb5aa; }
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
