import { Camp, Booking, User } from '@/types/camp'

const BASE_URL = 'http://localhost:5001'

// ── Campgrounds ──────────────────────────────
export async function getCamps(): Promise<Camp[]> {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds`)
  const data = await res.json()
  if(!data.success) throw new Error(data.message || 'Can not get Campground');
  return data.data
}

export async function getCampById(id: string): Promise<Camp> {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds/${id}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Can not get Campground')
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
  if (!data.success) throw new Error(data.message || 'Failed to fetch user')
  return data.data
}

// ── Bookings ──────────────────────────────────
export async function getMyBookings(token: string): Promise<Booking[]> {
  const res = await fetch(`${BASE_URL}/api/v1/bookings`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to fetch bookings')
  return data.data
}

export interface BookingRoom {
  roomType: string;
  description: string;
  price: number;
  capacity: number;
}

export async function createBooking(
  token: string,
  campgroundId: string,
  bookDate: string,
  duration: number,
  room: BookingRoom,
) {
  const res = await fetch(`${BASE_URL}/api/v1/campgrounds/${campgroundId}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ bookDate, duration, room })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Booking failed')
  return data.data
}

export async function payBooking(token: string, bookingId: string, cardId: string) {
  const res = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ cardId })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Payment failed')
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

export async function cancelBooking(token: string, bookingId: string) {
  const res = await fetch(`${BASE_URL}/api/v1/bookings/${bookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'cancelled' })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Cancel failed')
  return data.data
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
  if (!data.success) throw new Error(data.message || 'Create review failed')
  return data.data
}

export async function getAllReviews(token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/reviews`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to fetch reviews')
  return data.data
}

export async function getReviews({
  token,
  campgroundId
}: {
  token?: string;
  campgroundId?: string;
}) {
  let res;
  if(token) {
    if(campgroundId) {
      res = await fetch(`${BASE_URL}/api/v1/reviews/${campgroundId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    else {
      res = await fetch(`${BASE_URL}/api/v1/reviews/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }
  else {
    res = await fetch(`${BASE_URL}/api/v1/campgrounds/${campgroundId}/reviews`)
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch reviews')
  return data.data
}

export async function updateReview(token: string, reviewId: string, rating: number, comment: string) {
  const res = await fetch(`${BASE_URL}/api/v1/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ rating, comment })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Update review failed')
  return data
}

export async function deleteReview(token: string, reviewId: string, reason?: string) {
  const res = await fetch(`${BASE_URL}/api/v1/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(reason ? { 'Content-Type': 'application/json' } : {})
    },
    ...(reason ? { body: JSON.stringify({ reason }) } : {})
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Delete review failed')
  return data
}

/**
 * Get all saved credit cards
 */
export async function getCreditCards(token: string) {
  const res = await fetch(`${BASE_URL}/api/v1/cards`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to get cards')
  return data.data
}

/**
 * Get single credit card by ID
 */
export async function getCreditCard(token: string, cardId: string) {
  const res = await fetch(`${BASE_URL}/api/v1/cards/${cardId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to get card')
  return data.data
}

/**
 * Add new credit card
 */
export async function addCreditCard(
  token: string,
  cardHolderName: string,
  cardNumber: string,
  expiryMonth: number,
  expiryYear: number,
  CVV: string,
  balance?: number,
  isDefault: boolean = false
) {
  const res = await fetch(`${BASE_URL}/api/v1/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      cardHolderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      CVV,
      ...(balance !== undefined && { balance }),
      isDefault
    })
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to add card')
  return data.data
}

/**
 * Update credit card
 */
export async function updateCreditCard(
  token: string,
  cardId: string,
  updateData: {
    cardHolderName?: string
    cardNumber?: string
    expiryMonth?: number
    expiryYear?: number
    isDefault?: boolean
    balance?: number
  }
) {
  const res = await fetch(`${BASE_URL}/api/v1/cards/${cardId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to update card')
  return data.data
}

/**
 * Delete credit card
 */
export async function deleteCreditCard(token: string, cardId: string) {
  const res = await fetch(`${BASE_URL}/api/v1/cards/${cardId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to delete card')
  return true
}
