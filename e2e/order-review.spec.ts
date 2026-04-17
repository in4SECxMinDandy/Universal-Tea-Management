import { test, expect, type Page } from '@playwright/test'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD

async function registerUser(page: Page, email: string, password: string, fullName: string) {
  await page.goto('/login')
  await page.getByRole('button', { name: /Đăng ký miễn phí/i }).click()
  await page.locator('#fullName').fill(fullName)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /Tạo tài khoản/i }).click()

  const registeredMessage = page.getByText(/Đăng ký thành công/i)
  try {
    await page.waitForURL(/\/home$/, { timeout: 10000 })
  } catch {
    if (await registeredMessage.isVisible()) {
      await page.getByRole('button', { name: /Đăng nhập ngay/i }).click()
      await page.locator('#email').fill(email)
      await page.locator('#password').fill(password)
      await page.getByRole('button', { name: /^Đăng nhập$/ }).click()
      await page.waitForURL(/\/home$/, { timeout: 10000 })
    } else {
      throw new Error('User registration did not reach a logged-in state')
    }
  }
}

async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto('/adminlogin')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/auth/login?admin=1') && response.request().method() === 'POST'
  )
  await page.getByRole('button', { name: /Đăng nhập hệ thống/i }).click()
  const response = await responsePromise
  const payload = await response.json().catch(() => null)
  console.log('ADMIN LOGIN RESPONSE:', response.status(), JSON.stringify(payload))
  await page.waitForTimeout(750)
  await page.goto('/admin')
  await page.waitForURL(/\/admin$/, { timeout: 10000 })
}

async function createProduct(page: Page) {
  const productName = `Codex E2E Tea ${Date.now()}`

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/admin/foods/create-test') && response.request().method() === 'POST'
  )

  await page.goto('/admin')
  await page.evaluate(async (name) => {
    await fetch('/api/admin/foods/create-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        price: 25000,
        stock_quantity: 25,
        description: 'San pham test cho E2E review flow',
      }),
    })
  }, productName)

  const response = await responsePromise
  const payload = await response.json().catch(() => null)
  console.log('CREATE FOOD RESPONSE:', response.status(), JSON.stringify(payload))

  if (response.status() !== 200 || !payload?.food?.slug) {
    throw new Error(`Create food failed: ${response.status()} ${JSON.stringify(payload)}`)
  }

  return { productName, productPath: `/thuc-pham/${payload.food.slug}` }
}

async function placeOrder(page: Page, productPath: string, productName: string) {
  await page.goto(productPath)
  await expect(page.locator('h1').first()).toContainText(productName)

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/orders/create') && response.request().method() === 'POST'
  )
  await page.getByTestId('order-submit').click()
  const response = await responsePromise
  const payload = await response.json().catch(() => null)

  if (response.status() !== 200 || !payload?.order?.id) {
    throw new Error(`Order failed: ${response.status()} ${JSON.stringify(payload)}`)
  }

  await expect(page.getByText(/Đặt hàng thành công/i)).toBeVisible()
  return payload.order.id as string
}

async function setOrderStatus(page: Page, orderId: string, status: 'confirmed' | 'completed') {
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/admin/orders/set-status') && response.request().method() === 'POST'
  )

  await page.goto('/admin')
  await page.evaluate(async ({ orderIdValue, nextStatus }) => {
    await fetch('/api/admin/orders/set-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderIdValue, status: nextStatus }),
    })
  }, { orderIdValue: orderId, nextStatus: status })

  const response = await responsePromise
  const payload = await response.json().catch(() => null)
  console.log('SET ORDER STATUS RESPONSE:', status, response.status(), JSON.stringify(payload))
  expect(response.status()).toBe(200)
}

test.describe.serial('Order -> Review -> Admin Moderation', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing admin E2E credentials')

  test('user can place order, review it, see admin reply, and handle admin deletion', async ({ browser }) => {
    test.setTimeout(180000)

    const userContext = await browser.newContext()
    const adminContext = await browser.newContext()
    const userPage = await userContext.newPage()
    const adminPage = await adminContext.newPage()

    const generatedUserEmail = `codex.e2e.${Date.now()}@example.com`
    const generatedUserPassword = 'Codex123!'

    try {
      await loginAdmin(adminPage, ADMIN_EMAIL!, ADMIN_PASSWORD!)
      await registerUser(userPage, generatedUserEmail, generatedUserPassword, 'Codex E2E User')

      const { productName, productPath } = await createProduct(adminPage)
      const orderId = await placeOrder(userPage, productPath, productName)

      await setOrderStatus(adminPage, orderId, 'confirmed')
      await setOrderStatus(adminPage, orderId, 'completed')

      await userPage.goto('/history')
      await expect(userPage.getByText(/Đang tải lịch sử/i)).not.toBeVisible({ timeout: 30000 })
      const historyCard = userPage.locator(`[data-testid="history-order-card"][data-order-id="${orderId}"]`)
      await expect(historyCard).toContainText(/Đã hoàn thành/i, { timeout: 30000 })
      await historyCard.getByRole('button', { name: '5 sao' }).click()
      await historyCard.getByTestId('review-comment').fill('Mon rat ngon va dong goi on.')
      const reviewCreateResponsePromise = userPage.waitForResponse((response) =>
        response.url().includes('/api/reviews/create') && response.request().method() === 'POST'
      )
      await historyCard.getByTestId('submit-review').click()
      const reviewCreateResponse = await reviewCreateResponsePromise
      const reviewCreatePayload = await reviewCreateResponse.json().catch(() => null)
      console.log('CREATE REVIEW RESPONSE:', reviewCreateResponse.status(), JSON.stringify(reviewCreatePayload))
      const reviewId = reviewCreatePayload?.review?.id as string | undefined
      if (!reviewId) {
        throw new Error(`Could not resolve review id: ${JSON.stringify(reviewCreatePayload)}`)
      }
      await expect(historyCard).toContainText(/Đánh giá của bạn/i)
      await expect(historyCard).toContainText('Mon rat ngon va dong goi on.')

      await userPage.goto(productPath)
      await expect(userPage.getByText('Mon rat ngon va dong goi on.')).toBeVisible()

      await adminPage.goto('/admin/reviews')
      const reviewCard = adminPage.locator(`[data-testid="admin-review-card"][data-review-id="${reviewId}"]`)
      await expect(reviewCard).toBeVisible({ timeout: 30000 })
      await reviewCard.getByTestId('admin-review-reply').fill('Cam on ban da danh gia. Hen gap lai!')
      const replyResponsePromise = adminPage.waitForResponse((response) =>
        response.url().includes('/api/reviews/reply') && response.request().method() === 'POST'
      )
      await reviewCard.getByTestId('admin-review-save').click()
      const replyResponse = await replyResponsePromise
      const replyPayload = await replyResponse.json().catch(() => null)
      console.log('REPLY REVIEW RESPONSE:', replyResponse.status(), JSON.stringify(replyPayload))
      expect(replyResponse.status()).toBe(200)
      await expect(reviewCard).toContainText('Cam on ban da danh gia. Hen gap lai!')

      await userPage.goto(productPath)
      await expect(userPage.getByText('Cam on ban da danh gia. Hen gap lai!')).toBeVisible()

      const deleteResponsePromise = adminPage.waitForResponse((response) =>
        response.url().includes('/api/reviews/delete') && response.request().method() === 'DELETE'
      )
      adminPage.once('dialog', (dialog) => dialog.accept())
      await reviewCard.getByTestId('admin-review-delete').click()
      const deleteResponse = await deleteResponsePromise
      const deletePayload = await deleteResponse.json().catch(() => null)
      console.log('DELETE REVIEW RESPONSE:', deleteResponse.status(), JSON.stringify(deletePayload))
      expect(deleteResponse.status()).toBe(200)
      await expect(reviewCard).toHaveCount(0)

      await userPage.goto(productPath)
      await expect(userPage.getByText('Mon rat ngon va dong goi on.')).toHaveCount(0)
      await expect(userPage.getByText('Cam on ban da danh gia. Hen gap lai!')).toHaveCount(0)

      await userPage.goto('/history')
      const historyCardAfterDelete = userPage.locator(`[data-testid="history-order-card"][data-order-id="${orderId}"]`)
      await expect(historyCardAfterDelete).toContainText(/Đánh giá món này/i, { timeout: 30000 })
      await historyCardAfterDelete.getByRole('button', { name: '4 sao' }).click()
      await historyCardAfterDelete.getByTestId('review-comment').fill('Danh gia lai sau khi admin xoa.')
      const reviewRecreateResponsePromise = userPage.waitForResponse((response) =>
        response.url().includes('/api/reviews/create') && response.request().method() === 'POST'
      )
      await historyCardAfterDelete.getByTestId('submit-review').click()
      const reviewRecreateResponse = await reviewRecreateResponsePromise
      const reviewRecreatePayload = await reviewRecreateResponse.json().catch(() => null)
      console.log('RECREATE REVIEW RESPONSE:', reviewRecreateResponse.status(), JSON.stringify(reviewRecreatePayload))
      expect(reviewRecreateResponse.status()).toBe(200)
      await expect(historyCardAfterDelete).toContainText('Danh gia lai sau khi admin xoa.')
    } finally {
      await adminContext.close().catch(() => {})
      await userContext.close().catch(() => {})
    }
  })
})
