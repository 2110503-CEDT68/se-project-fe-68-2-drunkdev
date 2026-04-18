import { Camp, Booking, User } from '@/types/camp'

const BASE_URL = 'http://localhost:5000'

// ── Campgrounds ──────────────────────────────
export async function getCamps(): Promise<Camp[]> {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds`)
  const data = await res.json()
  return data.data
}

export async function getCampById(id: string): Promise<Camp> {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds/${id}`)
  const data = await res.json()
  return data.data
}

export async function createCamp(token: string, camp: Partial<Camp>) : Promise<Camp> {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(camp)
  })

  const data = await res.json();
  if(!data.success) throw new Error(data.message || 'Can not create new Campground');
  return data;
}

// ── Auth ─────────────────────────────────────
export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.msg || 'Login failed')
  return data // { success, token }
}

export async function register(name: string, email: string, tel: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, tel, password, role: 'user' })
  })
  const data = await res.json()
  if (!data.success) throw new Error('Register failed')
  return data
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  return data.data
}

// ── Bookings ──────────────────────────────────
export async function getMyBookings(token: string): Promise<Booking[]> {
  const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  return data.data
}

export async function createBooking(token: string, campgroundId: string, bookDate: string, duration: number) {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds/${campgroundId}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bookDate, duration })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Booking failed')
  return data.data
}

export async function deleteBooking(token: string, bookingId: string) {
  const res = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Delete failed')
  return data
}

export async function updateBooking(token: string, bookingId: string, bookDate: string, duration: number) {
  const res = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bookDate, duration })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Update failed')
  return data.data
}
// ── Review ──────────────────────────────────
export async function createReview(token: string, campgroundId: string, rating: number, comment: string) {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds/${campgroundId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ rating, comment })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Review failed')
  return data.data
}