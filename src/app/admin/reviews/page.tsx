'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getToken } from '@/lib/auth'
import { deleteReview, getAllReviews, getMe } from '@/lib/api'

interface ReviewItem {
  _id: string
  rating: number
  comment: string
  user: { _id: string; name: string } | string
  campground: { _id: string; name: string; district?: string; province?: string } | string
  createdAt: string
  visibility?: 'visible' | 'hidden'
}

const AVATAR_COLORS = [
  { bg: '#e1f5ee', color: '#0f6e56' },
  { bg: '#e6f1fb', color: '#185fa5' },
  { bg: '#faeeda', color: '#854f0b' },
  { bg: '#f3e8fb', color: '#6b3fa0' },
  { bg: '#fde8e8', color: '#a03f3f' },
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getAvatarColor(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index++) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span
      aria-label={`Rated ${rating} out of 5 stars`}
      style={{ display: 'flex', gap: '2px', alignItems: 'center' }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 16 16"
          width={size}
          height={size}
          fill={star <= rating ? '#c47f17' : '#ddd9cf'}
          style={{ flexShrink: 0 }}
        >
          <path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.12L8 10.5l-3.71 1.95.71-4.12L2 5.5l4.15-.75L8 1z" />
        </svg>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRating, setFilterRating] = useState(0)
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden'>('all')
  const [pendingDelete, setPendingDelete] = useState<ReviewItem | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/auth')
      return
    }

    getMe(token)
      .then((user) => {
        if (user.role !== 'admin') {
          router.push('/')
          return
        }

        getAllReviews(token)
          .then(setReviews)
          .catch(() => setReviews([]))
          .finally(() => setLoading(false))
      })
      .catch(() => router.push('/auth'))
  }, [router])

  const getName = (review: ReviewItem) =>
    typeof review.user === 'object' ? review.user.name : 'Unknown'

  const getCampName = (review: ReviewItem) =>
    typeof review.campground === 'object' ? review.campground.name : 'Unknown'

  const getCampLocation = (review: ReviewItem) => {
    if (typeof review.campground !== 'object') return ''
    const { district, province } = review.campground
    return [district, province].filter(Boolean).join(', ')
  }

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      const reviewerName = getName(review).toLowerCase()
      const campName = getCampName(review).toLowerCase()
      const query = search.toLowerCase()
      const matchSearch =
        !query ||
        reviewerName.includes(query) ||
        campName.includes(query) ||
        review.comment.toLowerCase().includes(query)
      const matchRating = !filterRating || review.rating === filterRating
      const visibility = review.visibility ?? 'visible'
      const matchVisibility =
        filterVisibility === 'all' || visibility === filterVisibility

      return matchSearch && matchRating && matchVisibility
    })
  }, [reviews, search, filterRating, filterVisibility])

  const totalReviews = reviews.length
  const avgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0
  const hiddenCount = reviews.filter((review) => review.visibility === 'hidden').length

  const openDeleteDialog = (review: ReviewItem) => {
    setPendingDelete(review)
    setDeleteReason('')
    setDeleteError('')
  }

  const closeDeleteDialog = () => {
    setPendingDelete(null)
    setDeleteReason('')
    setDeleteError('')
    setDeleting(false)
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    if (!deleteReason.trim()) {
      setDeleteError('Please provide a deletion reason.')
      return
    }

    const token = getToken()
    if (!token) return

    setDeleting(true)
    try {
      await deleteReview(token, pendingDelete._id, deleteReason.trim())
      setReviews((prev) => prev.filter((review) => review._id !== pendingDelete._id))
      closeDeleteDialog()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete review'
      setDeleteError(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main style={{ background: '#f5f3ee', minHeight: '100vh' }}>
      <Navbar showTrips={false} />

      <div
        style={{
          padding: '20px 24px 16px',
          background: '#fff',
          borderBottom: '1px solid #ece8e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e2a1c' }}
          >
            Reviews & Comments
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8a8a7a' }}>
            All campground reviews
          </p>
        </div>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: '#4a6741',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ← Admin
        </button>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <StatCard label="TOTAL REVIEWS" value={totalReviews} sub="All time" />
          <StatCard
            label="AVERAGE RATING"
            value={avgRating.toFixed(1)}
            sub="★ Overall"
            valueColor="#4a6741"
          />
          <StatCard
            label="HIDDEN"
            value={hiddenCount}
            sub="Not visible"
            valueColor={hiddenCount > 0 ? '#c0392b' : undefined}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#aaa89a',
                fontSize: '14px',
              }}
            >
              🔍
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reviews or names..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '10px',
                border: 'none',
                background: '#1e1e1e',
                color: '#fff',
                fontSize: '13px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <select
            value={filterRating}
            onChange={(event) => setFilterRating(Number(event.target.value))}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #e0ddd6',
              background: '#fff',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: '#3a3a2a',
              cursor: 'pointer',
            }}
          >
            <option value={0}>All ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} stars
              </option>
            ))}
          </select>
          <select
            value={filterVisibility}
            onChange={(event) =>
              setFilterVisibility(event.target.value as 'all' | 'visible' | 'hidden')
            }
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #e0ddd6',
              background: '#fff',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: '#3a3a2a',
              cursor: 'pointer',
            }}
          >
            <option value="all">All visibility</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '14px',
            border: '1px solid #ece8e0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 120px 110px 90px',
              padding: '10px 16px',
              borderBottom: '1px solid #ece8e0',
              background: '#faf9f6',
            }}
          >
            {['REVIEWER & COMMENT', 'CAMP', 'RATING', 'DATE', 'ACTIONS'].map((heading) => (
              <span
                key={heading}
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  color: '#8a8a7a',
                  textTransform: 'uppercase',
                }}
              >
                {heading}
              </span>
            ))}
          </div>

          {loading && (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: '#8a8a7a',
                fontSize: '13px',
              }}
            >
              Loading...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: '#8a8a7a',
                fontSize: '13px',
              }}
            >
              No reviews found
            </div>
          )}

          {!loading &&
            filtered.map((review, index) => {
              const name = getName(review)
              const campName = getCampName(review)
              const location = getCampLocation(review)
              const initials = getInitials(name)
              const avatarStyle = getAvatarColor(name)
              const visibility = review.visibility ?? 'visible'
              const isLast = index === filtered.length - 1

              return (
                <div
                  key={review._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 120px 110px 90px',
                    padding: '14px 16px',
                    alignItems: 'center',
                    borderBottom: isLast ? 'none' : '1px solid #ece8e0',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = '#faf9f6'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div
                    style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0 }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: avatarStyle.bg,
                        color: avatarStyle.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#2a2a1a',
                          marginBottom: '2px',
                        }}
                      >
                        {name}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#8a8a7a',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px',
                        }}
                      >
                        {review.comment}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', color: '#2a2a1a', fontWeight: 500 }}>
                      {campName}
                    </div>
                    {location && (
                      <div style={{ fontSize: '11px', color: '#8a8a7a' }}>{location}</div>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <StarRow rating={review.rating} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#2a2a1a' }}>
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: visibility === 'visible' ? '#4a6741' : '#aaa89a',
                          display: 'inline-block',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '11px',
                          color: visibility === 'visible' ? '#4a6741' : '#aaa89a',
                        }}
                      >
                        {visibility === 'visible' ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#5a5a4a' }}>
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openDeleteDialog(review)}
                      title="Delete"
                      aria-label={`Delete review by ${name}`}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        border: '1px solid #e0ddd6',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#c0392b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              )
            })}
        </div>

        {pendingDelete && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-review-title"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(20, 20, 20, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#fff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
              }}
            >
              <h2
                id="delete-review-title"
                style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e2a1c' }}
              >
                Delete review
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#5a5a4a', lineHeight: 1.5 }}>
                Add a short deletion reason for the moderation audit trail before removing this review from public view.
              </p>
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#faf9f6',
                  border: '1px solid #ece8e0',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#2a2a1a',
                    marginBottom: '6px',
                  }}
                >
                  {typeof pendingDelete.user === 'object' ? pendingDelete.user.name : 'Unknown'}
                </div>
                <div style={{ fontSize: '12px', color: '#8a8a7a' }}>
                  {pendingDelete.comment}
                </div>
              </div>
              <textarea
                aria-label="Deletion reason"
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Why is this review being removed?"
                rows={4}
                style={{
                  width: '100%',
                  marginTop: '14px',
                  borderRadius: '12px',
                  border: '1px solid #e0ddd6',
                  padding: '12px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  color: '#2a2a1a',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              {deleteError && (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#c0392b' }}>
                  {deleteError}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e0ddd6',
                    background: '#fff',
                    color: '#5a5a4a',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#c0392b',
                    color: '#fff',
                    cursor: deleting ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: deleting ? 0.7 : 1,
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string
  value: string | number
  sub: string
  valueColor?: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #ece8e0',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#8a8a7a',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: valueColor ?? '#1e2a1c',
          lineHeight: 1,
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#aaa89a' }}>{sub}</div>
    </div>
  )
}
