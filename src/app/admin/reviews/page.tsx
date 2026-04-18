'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getToken } from '@/lib/auth'
import { getMe, getAllReviews, deleteReview } from '@/lib/api'

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
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function StarRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} viewBox="0 0 16 16" width={size} height={size}
          fill={s <= rating ? '#c47f17' : '#ddd9cf'} style={{ flexShrink: 0 }}>
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

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/auth'); return }
    getMe(token).then(user => {
      if (user.role !== 'admin') { router.push('/'); return }
      getAllReviews(token)
        .then(setReviews)
        .catch(() => setReviews([]))
        .finally(() => setLoading(false))
    }).catch(() => router.push('/auth'))
  }, [router])

  const getName = (r: ReviewItem) =>
    typeof r.user === 'object' ? r.user.name : 'Unknown'

  const getCampName = (r: ReviewItem) =>
    typeof r.campground === 'object' ? r.campground.name : 'Unknown'

  const getCampLocation = (r: ReviewItem) => {
    if (typeof r.campground !== 'object') return ''
    const { district, province } = r.campground
    return [district, province].filter(Boolean).join(', ')
  }

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const name = getName(r).toLowerCase()
      const camp = getCampName(r).toLowerCase()
      const q = search.toLowerCase()
      const matchSearch = !q || name.includes(q) || camp.includes(q) || r.comment.toLowerCase().includes(q)
      const matchRating = !filterRating || r.rating === filterRating
      const vis = r.visibility ?? 'visible'
      const matchVis = filterVisibility === 'all' || vis === filterVisibility
      return matchSearch && matchRating && matchVis
    })
  }, [reviews, search, filterRating, filterVisibility])

  const totalReviews = reviews.length
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0
  const hiddenCount = reviews.filter(r => r.visibility === 'hidden').length

  const handleDelete = async (id: string) => {
    if (!confirm('ลบรีวิวนี้?')) return
    const token = getToken()
    if (!token) return
    await deleteReview(token, id)
    setReviews(prev => prev.filter(r => r._id !== id))
  }

  return (
    <main style={{ background: '#f5f3ee', minHeight: '100vh' }}>
      <Navbar showTrips={false} />

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', background: '#fff', borderBottom: '1px solid #ece8e0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1e2a1c' }}>Reviews & Comments</h1>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#8a8a7a' }}>All campground reviews</p>
        </div>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '8px 16px', borderRadius: '10px', border: 'none',
            background: '#4a6741', color: '#fff', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          ← Admin
        </button>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: '960px', margin: '0 auto' }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <StatCard label="TOTAL REVIEWS" value={totalReviews} sub="All time" />
          <StatCard label="AVERAGE RATING" value={avgRating.toFixed(1)} sub="★ Overall" valueColor="#4a6741" />
          <StatCard label="HIDDEN" value={hiddenCount} sub="Not visible" valueColor={hiddenCount > 0 ? '#c0392b' : undefined} />
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa89a', fontSize: '14px' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search reviews or names..."
              style={{
                width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px',
                border: 'none', background: '#1e1e1e', color: '#fff',
                fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <select
            value={filterRating}
            onChange={e => setFilterRating(Number(e.target.value))}
            style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #e0ddd6', background: '#fff', fontSize: '13px', fontFamily: 'inherit', color: '#3a3a2a', cursor: 'pointer' }}
          >
            <option value={0}>All ratings</option>
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <select
            value={filterVisibility}
            onChange={e => setFilterVisibility(e.target.value as 'all' | 'visible' | 'hidden')}
            style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #e0ddd6', background: '#fff', fontSize: '13px', fontFamily: 'inherit', color: '#3a3a2a', cursor: 'pointer' }}
          >
            <option value="all">All visibility</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #ece8e0', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 120px 110px 90px', padding: '10px 16px', borderBottom: '1px solid #ece8e0', background: '#faf9f6' }}>
            {['REVIEWER & COMMENT', 'CAMP', 'RATING', 'DATE', 'ACTIONS'].map(h => (
              <span key={h} style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', color: '#8a8a7a', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {loading && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#8a8a7a', fontSize: '13px' }}>Loading...</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#8a8a7a', fontSize: '13px' }}>No reviews found</div>
          )}

          {!loading && filtered.map((r, i) => {
            const name = getName(r)
            const campName = getCampName(r)
            const location = getCampLocation(r)
            const initials = getInitials(name)
            const avatarStyle = getAvatarColor(name)
            const vis = r.visibility ?? 'visible'
            const isLast = i === filtered.length - 1

            return (
              <div key={r._id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 120px 110px 90px',
                padding: '14px 16px', alignItems: 'center',
                borderBottom: isLast ? 'none' : '1px solid #ece8e0',
                transition: 'background 0.1s'
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#faf9f6')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Reviewer + comment */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: avatarStyle.bg, color: avatarStyle.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700
                  }}>{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a2a1a', marginBottom: '2px' }}>{name}</div>
                    <div style={{ fontSize: '12px', color: '#8a8a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                      {r.comment}
                    </div>
                  </div>
                </div>

                {/* Camp */}
                <div>
                  <div style={{ fontSize: '13px', color: '#2a2a1a', fontWeight: 500 }}>{campName}</div>
                  {location && <div style={{ fontSize: '11px', color: '#8a8a7a' }}>{location}</div>}
                </div>

                {/* Rating */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <StarRow rating={r.rating} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#2a2a1a' }}>{r.rating.toFixed(1)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: vis === 'visible' ? '#4a6741' : '#aaa89a', display: 'inline-block' }} />
                    <span style={{ fontSize: '11px', color: vis === 'visible' ? '#4a6741' : '#aaa89a' }}>
                      {vis === 'visible' ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div style={{ fontSize: '12px', color: '#5a5a4a' }}>
                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleDelete(r._id)}
                    title="Delete"
                    style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      border: '1px solid #e0ddd6', background: '#fff',
                      cursor: 'pointer', fontSize: '14px', color: '#c0392b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value, sub, valueColor }: { label: string; value: string | number; sub: string; valueColor?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ece8e0', padding: '14px 16px' }}>
      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a8a7a', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: valueColor ?? '#1e2a1c', lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#aaa89a' }}>{sub}</div>
    </div>
  )
}
