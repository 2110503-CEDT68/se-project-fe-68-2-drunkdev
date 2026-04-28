import { expect, test } from '@playwright/test'

const camps = [
  {
    _id: 'camp-1',
    name: 'Pine Ridge Campground',
    description: 'Forest escape with mountain views.',
    address: '11 Forest Road',
    district: 'Mae Rim',
    province: 'Chiang Mai',
    postalcode: '50180',
    tel: '0812345678',
    region: 'North',
    imgSrc: ['/img/camp1.jpg'],
    rooms: [],
    averageRating: 4.8,
    totalReviews: 124,
  },
  {
    _id: 'camp-2',
    name: 'Riverstone Retreat',
    description: 'Riverside tents and bonfire nights.',
    address: '24 River Lane',
    district: 'Mueang',
    province: 'Chiang Rai',
    postalcode: '57000',
    tel: '0898765432',
    region: 'North',
    imgSrc: ['/img/camp2.jpg'],
    rooms: [],
    averageRating: 4.6,
    totalReviews: 98,
  },
  {
    _id: 'camp-3',
    name: 'Sunset Canyon Basecamp',
    description: 'Red cliffs and quiet trails.',
    address: '7 Canyon View',
    district: 'Pak Chong',
    province: 'Nakhon Ratchasima',
    postalcode: '30130',
    tel: '0821112233',
    region: 'Central',
    imgSrc: ['/img/camp3.jpg'],
    rooms: [],
    averageRating: 4.7,
    totalReviews: 77,
  },
  {
    _id: 'camp-4',
    name: 'Coastal Breeze Camp',
    description: 'Beachfront camping with sea views.',
    address: '59 Shoreline Road',
    district: 'Cha-am',
    province: 'Phetchaburi',
    postalcode: '76120',
    tel: '0832223344',
    region: 'South',
    imgSrc: ['/img/camp4.jpg'],
    rooms: [],
    averageRating: 4.5,
    totalReviews: 88,
  },
  {
    _id: 'camp-5',
    name: 'Lotus Lake Hideout',
    description: 'Cabins beside a calm freshwater lake.',
    address: '88 Lake Road',
    district: 'Sikhiu',
    province: 'Nakhon Ratchasima',
    postalcode: '30140',
    tel: '0843334455',
    region: 'East',
    imgSrc: ['/img/camp5.jpg'],
    rooms: [],
    averageRating: 4.4,
    totalReviews: 51,
  },
  {
    _id: 'camp-6',
    name: 'Highland Echo Camp',
    description: 'Cool weather and sunrise viewpoints.',
    address: '3 Summit Pass',
    district: 'Pai',
    province: 'Mae Hong Son',
    postalcode: '58130',
    tel: '0854445566',
    region: 'North',
    imgSrc: ['/img/camp6.jpg'],
    rooms: [],
    averageRating: 4.9,
    totalReviews: 143,
  },
]

test.beforeEach(async ({ page }) => {
  // Keep e2e smoke tests deterministic even when the backend is offline.
  await page.route('**/api/v1/campgrounds', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: camps,
      }),
    })
  })
})

test('shows the landing page with featured campgrounds', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /find your stay/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Popular spots' })).toBeVisible()
  await expect(page.getByText('Pine Ridge Campground')).toBeVisible()
  await expect(page.getByText('Highland Echo Camp')).toBeVisible()
})

test('searches from the home page and keeps the query on the results screen', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('Where do you want to camp?').fill('chiang')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page).toHaveURL(/\/search\?q=chiang/i)
  await expect(page.getByPlaceholder('Search campsites, locations...')).toHaveValue('chiang')
  await expect(page.getByText('2 campsites found')).toBeVisible()
  await expect(page.getByText('Riverstone Retreat')).toBeVisible()
})
