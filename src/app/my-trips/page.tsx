'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import { getMyBookings, deleteBooking, createReview } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { Booking } from '@/types/camp'
import styles from './page.module.css'

interface ReviewModal {
  campgroundId: string
  bookingId: string
  campName: string
  bookDate: string
}

export default function MyTripsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState<ReviewModal | null>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [visibility, setVisibility] = useState<'visible' | 'hidden'>('visible')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/auth'); return }
    getMyBookings(token)
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [router])

  const handleDelete = async (id: string) => {
    const token = getToken()
    if (!token) return
    await deleteBooking(token, id)
    setBookings(prev => prev.filter(b => b._id !== id))
  }

  const getCheckout = (bookDate: string, duration: number) => {
    const date = new Date(bookDate)
    date.setDate(date.getDate() + duration)
    return date
  }

  const isCompleted = (bookDate: string, duration: number) => {
    return getCheckout(bookDate, duration) < new Date()
  }

  const handleOpenReview = (campgroundId: string, bookingId: string, campName: string, bookDate: string) => {
    setRating(0)
    setHoverRating(0)
    setComment('')
    setVisibility('visible')
    setReviewError('')
    setReviewModal({ campgroundId, bookingId, campName, bookDate })
  }

  const handleSubmitReview = async () => {
    if (!reviewModal) return
    const token = getToken()
    if (!token) return
    if (!comment.trim()) { setReviewError('กรุณาเขียน comment'); return }
    setSubmitting(true)
    try {
      await createReview(token, reviewModal.campgroundId, rating, comment)
      setReviewModal(null)
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.wrapper}>
      <Navbar showTrips={false} />
      <div className={styles.header}>
        <h1 className={styles.title}>My Trips</h1>
        <p className={styles.sub}>All your campground bookings</p>
      </div>

      <div className={styles.body}>
        {loading && <p style={{ padding: '20px', color: 'var(--muted)' }}>กำลังโหลด...</p>}
        {!loading && bookings.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏕️</div>
            <p className={styles.emptyText}>No bookings yet</p>
            <button className={styles.btnSm} onClick={() => router.push('/search')}>Explore camps</button>
          </div>
        )}

        {bookings.map(b => {
          const completed = isCompleted(b.bookDate, b.duration)
          return (
            <div key={b._id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardImg} style={{ background: 'linear-gradient(135deg,#4A5E4A,#3A4E3A)' }}>🏕️</div>
                <div className={styles.cardMeta}>
                  <div className={styles.cardName}>{b.campground?.name}</div>
                  <div className={styles.cardDates}>
                    {new Date(b.bookDate).toLocaleDateString('th-TH')} – {getCheckout(b.bookDate, b.duration).toLocaleDateString('th-TH')}
                    <span style={{ color: 'var(--muted)', fontSize: '12px', marginLeft: '6px' }}>[{b.duration} night(s)]</span>
                  </div>
                  <StatusBadge status={completed ? 'completed' : 'confirmed'} />
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.cardFooter}>
                <div className={styles.cardGuests}>📞 {b.campground?.tel || '-'}</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {completed ? (
                    <span
                      className={styles.cardAction}
                      onClick={() => handleOpenReview(b.campground?._id, b._id, b.campground?.name, b.bookDate)}
                    >
                      ⭐ Rate
                    </span>
                  ) : (
                    <span
                      className={styles.cardAction}
                      onClick={() => router.push(`/booking/${b.campground?._id}?bookingId=${b._id}&bookDate=${b.bookDate}&duration=${b.duration}`)}
                    >
                      Edit ✎
                    </span>
                  )}
                  <span className={styles.cardAction} onClick={() => handleDelete(b._id)}>Cancel ×</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: '#f0ede8', borderRadius: '20px', padding: '6px',
            width: '100%', maxWidth: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '22px 24px',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2a2a1a' }}>Edit review</h3>
                <button
                  onClick={() => setReviewModal(null)}
                  style={{
                    width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e0ddd6',
                    background: '#f5f3ee', cursor: 'pointer', fontSize: '16px', color: '#8a8a7a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                  }}
                >×</button>
              </div>

              {/* Reviewer card */}
              <div style={{
                background: '#f5f3ee', borderRadius: '10px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: '#d4ede3', color: '#0f6e56',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0
                }}>
                  {reviewModal.campName?.slice(0, 2).toUpperCase() || 'CA'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a2a1a' }}>{reviewModal.campName}</div>
                  <div style={{ fontSize: '11px', color: '#8a8a7a' }}>
                    {new Date(reviewModal.bookDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a8a7a', marginBottom: '8px' }}>Rating</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span
                      key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ cursor: 'pointer', fontSize: '22px', lineHeight: 1, transition: 'transform 0.1s', display: 'inline-block' }}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22"
                        fill={s <= (hoverRating || rating) ? '#c47f17' : 'none'}
                        stroke={s <= (hoverRating || rating) ? '#c47f17' : '#c8c3b8'}
                        strokeWidth="1.5"
                      >
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                      </svg>
                    </span>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a8a7a', marginBottom: '8px' }}>Comment</div>
                <textarea
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 500))}
                  rows={4}
                  style={{
                    width: '100%', borderRadius: '10px', border: 'none',
                    background: '#1e1e1e', color: '#fff',
                    padding: '12px 14px', fontSize: '13px', resize: 'none',
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                    lineHeight: 1.6
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#aaa89a', marginTop: '4px' }}>
                  {comment.length} / 500
                </div>
              </div>

              {/* Visibility */}
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a8a7a', marginBottom: '8px' }}>Visibility</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setVisibility('visible')}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                      fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s',
                      border: visibility === 'visible' ? '1.5px solid #4a6741' : '1.5px solid #e0ddd6',
                      background: visibility === 'visible' ? '#eef5eb' : '#fff',
                      color: visibility === 'visible' ? '#4a6741' : '#8a8a7a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <span>👁</span> Visible to guests
                  </button>
                  <button
                    onClick={() => setVisibility('hidden')}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer',
                      fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s',
                      border: visibility === 'hidden' ? '1.5px solid #4a6741' : '1.5px solid #e0ddd6',
                      background: visibility === 'hidden' ? '#eef5eb' : '#fff',
                      color: visibility === 'hidden' ? '#4a6741' : '#8a8a7a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <span>🚫</span> Hidden
                  </button>
                </div>
              </div>

              {reviewError && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{reviewError}</p>}

              {/* Footer buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #ece8e0', paddingTop: '14px' }}>
                <button
                  onClick={() => setReviewModal(null)}
                  style={{
                    padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd',
                    background: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', color: '#5a5a4a'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  style={{
                    padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd',
                    background: '#fff', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', color: '#5a5a4a'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  style={{
                    padding: '8px 18px', borderRadius: '8px', border: 'none',
                    background: '#4a6741', color: '#fff',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit'
                  }}
                >
                  {submitting ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}