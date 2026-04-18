'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import CampCard from '@/components/CampCard'
import { getCamps } from '@/lib/api'
import { Camp } from '@/types/camp'
import styles from './page.module.css'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [camps, setCamps] = useState<Camp[]>([])
  const router = useRouter()

  useEffect(() => {
    getCamps().then(data => setCamps(data.slice(0, 6)))
  }, [])

  const campImages = [
    "/img/camp1.jpg",
    "/img/camp2.jpg",
    "/img/camp3.jpg",
    "/img/camp4.jpg",
    "/img/camp5.jpg",
    "/img/camp6.jpg",
  ];

  return (
    <main className={styles.wrapper}>
      <Navbar />
      <section className={styles.hero}>
        <div className={styles.heroTexture} />
        <p className={styles.heroTag}>Your next escape awaits</p>
        <h1 className={styles.heroTitle}>Find your stay<br />in nature.</h1>
        <p className={styles.heroDesc}>
          Discover handpicked campgrounds,<br /> compare amenities, and book with ease.
        </p>
        <div className={styles.heroSearch}>
          <input
            type="text"
            placeholder="Where do you want to camp?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && router.push(`/search?q=${query}`)}
          />
          <button onClick={() => router.push(`/search?q=${query}`)}>Search</button>
        </div>
      </section>

      <section className={styles.grid}>
        <h2 className={styles.sectionTitle}>Popular spots</h2>
        <p className={styles.sectionSub}>Highly rated by campers this season</p>
        <div className={styles.cardGrid}>
          {camps.map((camp) => (
            <CampCard
              key={camp._id}
              href={`/booking/${camp._id}`}
              name={camp.name}
              location={`${camp.district}, ${camp.province}`}
              rating={camp.averageRating}
              reviewCount={camp.totalReviews}
              tags={[camp.region]}
              imgSrc={camp.imgSrc[0]}
            />
          ))}
        </div>
      </section>
    </main>
  )
}