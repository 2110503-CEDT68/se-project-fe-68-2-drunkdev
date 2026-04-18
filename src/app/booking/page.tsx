'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import CreateCampForm from '@/components/CreateCampForm'
import CampgroundDetailPage from '@/components/CampgroundDetailPage'


export default function BookingPage() {
  const [guests, setGuests] = useState(2)
  const router = useRouter()
  const pricePerNight = 850, nights = 2, serviceFee = 85
  const total = pricePerNight * nights + serviceFee
  const changeGuest = (d: number) => setGuests(p => Math.max(1, Math.min(10, p + d)))

  return (
    <>
      <CampgroundDetailPage/>
    </>
  )
}