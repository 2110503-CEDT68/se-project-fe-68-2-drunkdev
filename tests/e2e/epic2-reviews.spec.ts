import { expect, Page, test } from '@playwright/test'

type MockUser = {
  _id: string
  name: string
  email: string
  tel: string
  role: 'user' | 'admin'
}

type MockRoom = {
  _id: string
  roomType: string
  description: string
  price: number
  capacity: number
  available: number
}

type MockCamp = {
  _id: string
  name: string
  description: string
  address: string
  district: string
  province: string
  postalcode: string
  tel: string
  region: string
  imgSrc: string[]
  rooms: MockRoom[]
  averageRating: number
  totalReviews: number
}

type MockReview = {
  _id: string
  rating: number
  comment: string
  user: MockUser
  campground: {
    _id: string
    name: string
    district: string
    province: string
  }
  createdAt: string
  visibility?: 'visible' | 'hidden'
}

type ReviewRequest = {
  rating: number
  comment: string
}

type AuditEntry = {
  reviewId: string
  reason: string
  actorId: string
}

type MockServerOptions = {
  token?: 'user-token' | 'admin-token'
  initialReviews?: MockReview[]
}

const campId = 'camp-epic2'
const userToken = 'user-token'
const adminToken = 'admin-token'

const defaultUser: MockUser = {
  _id: 'user-1',
  name: 'Alice Camper',
  email: 'alice@example.com',
  tel: '0812345678',
  role: 'user',
}

const adminUser: MockUser = {
  _id: 'admin-1',
  name: 'Park Ranger',
  email: 'admin@example.com',
  tel: '0899999999',
  role: 'admin',
}

const otherUser: MockUser = {
  _id: 'user-2',
  name: 'Bob Hiker',
  email: 'bob@example.com',
  tel: '0822222222',
  role: 'user',
}

const camp: MockCamp = {
  _id: campId,
  name: 'Pine Ridge Campground',
  description: 'Forest escape with mountain views and quiet cabins.',
  address: '11 Forest Road',
  district: 'Mae Rim',
  province: 'Chiang Mai',
  postalcode: '50180',
  tel: '0812345678',
  region: 'North',
  imgSrc: ['/img/camp1.jpg', '/img/camp2.jpg'],
  rooms: [
    {
      _id: 'room-1',
      roomType: 'Tent Platform',
      description: 'Raised wooden platform for a two-person tent.',
      price: 1200,
      capacity: 2,
      available: 3,
    },
  ],
  averageRating: 4.7,
  totalReviews: 12,
}

const formatReviewDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

function buildReview(overrides: Partial<MockReview> & Pick<MockReview, '_id' | 'rating' | 'comment' | 'user' | 'createdAt'>): MockReview {
  return {
    _id: overrides._id,
    rating: overrides.rating,
    comment: overrides.comment,
    user: overrides.user,
    campground: {
      _id: campId,
      name: camp.name,
      district: camp.district,
      province: camp.province,
      ...(overrides.campground ?? {}),
    },
    createdAt: overrides.createdAt,
    visibility: overrides.visibility ?? 'visible',
  }
}

async function setupEpic2MockServer(page: Page, options: MockServerOptions = {}) {
  const createRequests: ReviewRequest[] = []
  const auditTrail: AuditEntry[] = []
  let reviewCounter = (options.initialReviews?.length ?? 0) + 10
  const reviews: MockReview[] = [...(options.initialReviews ?? [])]

  if (options.token) {
    await page.addInitScript((token) => {
      window.localStorage.setItem('token', token)
    }, options.token)
  }

  const usersByToken: Record<string, MockUser> = {
    [userToken]: defaultUser,
    [adminToken]: adminUser,
  }

  const getUserFromHeaders = (authorization: string | undefined) => {
    const token = authorization?.replace(/^Bearer\s+/i, '') ?? ''
    return usersByToken[token] ?? null
  }

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const path = url.pathname
    const authorization = request.headers()['authorization']
    const actingUser = getUserFromHeaders(authorization)

    if (path === '/api/v1/auth/me' && method === 'GET') {
      if (!actingUser) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unauthorized' }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: actingUser }),
      })
      return
    }

    if (path === `/api/v1/campgrounds/${campId}` && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: camp }),
      })
      return
    }

    if (path === `/api/v1/campgrounds/${campId}/reviews` && method === 'GET') {
      const publicReviews = reviews.filter((review) => review.visibility !== 'hidden')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: publicReviews }),
      })
      return
    }

    if (path === `/api/v1/campgrounds/${campId}/reviews` && method === 'POST') {
      if (!actingUser) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unauthorized' }),
        })
        return
      }

      const body = request.postDataJSON() as ReviewRequest
      createRequests.push(body)

      if (!body.rating || !body.comment?.trim()) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Please provide both a star rating and a written review.',
          }),
        })
        return
      }

      const newReview: MockReview = buildReview({
        _id: `review-${reviewCounter++}`,
        rating: body.rating,
        comment: body.comment.trim(),
        user: actingUser,
        createdAt: new Date(2026, 3, reviewCounter).toISOString(),
      })

      const existingIndex = reviews.findIndex(
        (review) => review.user._id === actingUser._id,
      )

      if (existingIndex >= 0) {
        reviews.splice(existingIndex, 1, newReview)
      } else {
        reviews.unshift(newReview)
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: newReview }),
      })
      return
    }

    if (path === '/api/v1/reviews' && method === 'GET') {
      if (!actingUser || actingUser.role !== 'admin') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Forbidden' }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: reviews }),
      })
      return
    }

    const reviewIdMatch = path.match(/^\/api\/v1\/reviews\/([^/]+)$/)
    if (reviewIdMatch && method === 'PUT') {
      if (!actingUser) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unauthorized' }),
        })
        return
      }

      const reviewId = reviewIdMatch[1]
      const body = request.postDataJSON() as ReviewRequest
      const review = reviews.find((item) => item._id === reviewId)

      if (!review) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Review not found' }),
        })
        return
      }

      review.rating = body.rating
      review.comment = body.comment.trim()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: review }),
      })
      return
    }

    if (reviewIdMatch && method === 'DELETE') {
      if (!actingUser) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unauthorized' }),
        })
        return
      }

      const reviewId = reviewIdMatch[1]
      const rawBody = request.postData()
      const body = rawBody ? (JSON.parse(rawBody) as { reason?: string }) : {}

      if (actingUser.role === 'admin' && !body.reason?.trim()) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Please provide a deletion reason.',
          }),
        })
        return
      }

      const reviewIndex = reviews.findIndex((item) => item._id === reviewId)
      if (reviewIndex === -1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Review not found' }),
        })
        return
      }

      reviews.splice(reviewIndex, 1)

      if (actingUser.role === 'admin' && body.reason?.trim()) {
        auditTrail.push({
          reviewId,
          reason: body.reason.trim(),
          actorId: actingUser._id,
        })
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: `Unhandled mock route: ${method} ${path}` }),
    })
  })

  return { createRequests, auditTrail, reviews }
}

async function openCampgroundReviews(page: Page) {
  await page.goto(`/booking/${campId}`)
  await expect(page.getByText('Ratings & Reviews')).toBeVisible()
}

test.describe('Epic 2 review user stories', () => {
  test('US2-1 records a user review and displays it on the campground page', async ({ page }) => {
    await setupEpic2MockServer(page, { token: 'user-token' })

    await openCampgroundReviews(page)
    await page.getByLabel('Rate 5 stars').click()
    await page.getByPlaceholder('Share your experience...').fill('Amazing sunrise views and very clean facilities.')
    await page.getByRole('button', { name: 'Submit' }).click()

    const createdReview = page.locator('.review-card').filter({
      hasText: 'Amazing sunrise views and very clean facilities.',
    })

    await expect(createdReview).toHaveCount(1)
    await expect(createdReview).toContainText('Alice Camper')
    await expect(page.getByLabel('Rated 5 out of 5 stars')).toBeVisible()
  })

  test('US2-1 shows a validation message and does not publish an incomplete user review', async ({ page }) => {
    const server = await setupEpic2MockServer(page, { token: 'user-token' })

    await openCampgroundReviews(page)
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(
      page.getByText('Please provide both a star rating and a written review.'),
    ).toBeVisible()
    await expect(page.getByText('No reviews yet')).toBeVisible()
    expect(server.createRequests).toHaveLength(0)
  })

  test('US2-2 replaces a previous review with the latest one and keeps only the newest version after refresh', async ({ page }) => {
    await setupEpic2MockServer(page, {
      token: 'user-token',
      initialReviews: [
        buildReview({
          _id: 'review-old',
          rating: 3,
          comment: 'Old review from my first stay.',
          user: defaultUser,
          createdAt: '2026-04-10T10:00:00.000Z',
        }),
        buildReview({
          _id: 'review-other',
          rating: 5,
          comment: 'Still my favorite mountain campsite.',
          user: otherUser,
          createdAt: '2026-04-12T10:00:00.000Z',
        }),
      ],
    })

    await openCampgroundReviews(page)
    await page.getByLabel('Rate 4 stars').click()
    await page.getByPlaceholder('Share your experience...').fill('Updated review after a second stay.')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByText('Updated review after a second stay.')).toBeVisible()
    await expect(page.getByText('Old review from my first stay.')).toHaveCount(0)
    await expect(page.locator('.review-card').filter({ hasText: 'Alice Camper' })).toHaveCount(1)

    await page.reload()
    await expect(page.getByText('Updated review after a second stay.')).toBeVisible()
    await expect(page.getByText('Old review from my first stay.')).toHaveCount(0)
    await expect(page.locator('.review-card').filter({ hasText: 'Alice Camper' })).toHaveCount(1)
  })

  test('US2-3 displays published campground reviews with rating, comment, reviewer, and date', async ({ page }) => {
    const publishedReview = buildReview({
      _id: 'review-published',
      rating: 4,
      comment: 'Quiet nights, friendly staff, and a great breakfast basket.',
      user: otherUser,
      createdAt: '2026-04-14T09:00:00.000Z',
    })

    await setupEpic2MockServer(page, {
      initialReviews: [publishedReview],
    })

    await openCampgroundReviews(page)

    const reviewCard = page.locator('.review-card').filter({
      hasText: 'Quiet nights, friendly staff, and a great breakfast basket.',
    })

    await expect(reviewCard).toContainText('Bob Hiker')
    await expect(reviewCard).toContainText(formatReviewDate(publishedReview.createdAt))
    await expect(page.getByLabel('Rated 4 out of 5 stars')).toBeVisible()
  })

  test('US2-3 shows a no reviews message when the campground has no reviews', async ({ page }) => {
    await setupEpic2MockServer(page)

    await openCampgroundReviews(page)

    await expect(page.getByText('No reviews yet')).toBeVisible()
    await expect(page.locator('.review-card')).toHaveCount(0)
  })

  test('US2-4 lets an admin delete a review, removes it from public view, and records the deletion reason', async ({ page }) => {
    const reviewToDelete = buildReview({
      _id: 'review-delete',
      rating: 1,
      comment: 'This review contains a personal attack.',
      user: otherUser,
      createdAt: '2026-04-15T10:00:00.000Z',
    })
    const server = await setupEpic2MockServer(page, {
      token: 'admin-token',
      initialReviews: [reviewToDelete],
    })

    await page.goto('/admin/reviews')
    await expect(page.getByRole('heading', { name: 'Reviews & Comments' })).toBeVisible()

    await page.getByLabel('Delete review by Bob Hiker').click()
    await page.getByLabel('Deletion reason').fill('Contains personal attack')
    await page.getByRole('button', { name: 'Delete review', exact: true }).click()

    await expect(page.getByText('This review contains a personal attack.')).toHaveCount(0)
    expect(server.auditTrail).toHaveLength(1)
    expect(server.auditTrail[0].reason).toBe('Contains personal attack')
    expect(server.auditTrail[0].actorId).toBe(adminUser._id)

    await page.evaluate(() => window.localStorage.removeItem('token'))
    await openCampgroundReviews(page)
    await expect(page.getByText('This review contains a personal attack.')).toHaveCount(0)
    await expect(page.getByText('No reviews yet')).toBeVisible()
  })

  test('US2-5 saves an admin review and displays it with an official badge', async ({ page }) => {
    await setupEpic2MockServer(page, { token: 'admin-token' })

    await openCampgroundReviews(page)
    await page.getByLabel('Rate 5 stars').click()
    await page.getByPlaceholder('Share your experience...').fill('Official inspection passed with top marks.')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page.getByText('Official inspection passed with top marks.')).toBeVisible()
    await expect(page.getByText('Official', { exact: true })).toBeVisible()

    await page.reload()
    await expect(page.getByText('Official inspection passed with top marks.')).toBeVisible()
    await expect(page.getByText('Official', { exact: true })).toBeVisible()
  })

  test('US2-5 shows validation feedback and blocks incomplete admin reviews', async ({ page }) => {
    const server = await setupEpic2MockServer(page, { token: 'admin-token' })

    await openCampgroundReviews(page)
    await page.getByLabel('Rate 4 stars').click()
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(
      page.getByText('Please provide both a star rating and a written review.'),
    ).toBeVisible()
    await expect(page.getByText('No reviews yet')).toBeVisible()
    expect(server.createRequests).toHaveLength(0)
  })
})
