'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getCampById, createBooking, updateBooking } from '@/lib/api'
import { getToken } from '@/lib/auth'
import { Camp } from '@/types/camp'
import styles from '../page.module.css'
import CampgroundDetailPage from '@/components/CampgroundDetailPage'

export default function BookingPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()

  const bookingId = searchParams.get('bookingId')  // มีค่า = มาจาก edit
  const [camp, setCamp] = useState<Camp | null>(null)
  const [bookDate, setBookDate] = useState(searchParams.get('bookDate') ?? '')
  const [duration, setDuration] = useState(Number(searchParams.get('duration') ?? 1))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCampById(id).then(setCamp).catch(err => console.error('Failed to load camp:', err))
  }, [id])

  const handleBook = async () => {
    const token = getToken()
    if (!token) { router.push('/auth'); return }
    if (!bookDate) { setError('กรุณาเลือกวันที่'); return }
    if (duration < 1) { setError('จำนวนคืนต้องมากกว่า 0'); return }
    setLoading(true)
    try {
      if (bookingId) {
        await updateBooking(token, bookingId, new Date(bookDate).toISOString(), duration)
      } else {
        await createBooking(token, id, new Date(bookDate).toISOString(), duration)
      }
      router.push('/my-trips')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (!camp) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <main className={styles.wrapper} style={{ minHeight: '100vh' }}>
      <CampgroundDetailPage/>
      {/* <div className={styles.hero}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <span className={styles.heroEmoji}>🏕️</span>
        <div className={styles.heroOverlay} />
        <div className={styles.heroInfo}>
          <div className={styles.heroName}>{camp.name}</div>
          <div className={styles.heroLoc}>📍 {camp.district}, {camp.province} · ⭐ {camp.averageRating.toFixed(1)}</div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Campground info</div>
          <div className={styles.amenityGrid}>
            <div className={styles.amenityItem}><span>📍</span>{camp.address}</div>
            <div className={styles.amenityItem}><span>📞</span>{camp.tel || '-'}</div>
            <div className={styles.amenityItem}><span>🗺️</span>{camp.region}</div>
            <div className={styles.amenityItem}><span>📮</span>{camp.postalcode}</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Select dates</div>
          <div className={styles.dateRow}>
            <div className={styles.dateBox}>
              <div className={styles.dateLabel}>Book date</div>
              <input
                type="date"
                value={bookDate.split('T')[0]}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setBookDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, color: 'var(--soil)', outline: 'none', width: '100%' }}
              />
            </div>
            <div className={styles.dateBox}>
              <div className={styles.dateLabel}>Duration (nights)</div>
              <input
                type="number"
                value={duration}
                min={1}
                max={3}
                onChange={e => setDuration(Number(e.target.value))}
                style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 500, color: 'var(--soil)', outline: 'none', width: '100%' }}
              />
            </div>
          </div>
        </div>

        {error && <p style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>{error}</p>}
        <button className={styles.bookBtn} onClick={handleBook} disabled={loading}>
          {loading ? (bookingId ? 'Updating...' : 'Booking...') : (bookingId ? 'Confirm edit →' : 'Confirm booking →')}
        </button>
      </div> */}
    </main>
  )
}