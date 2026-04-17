import { expect, test, type Page } from '@playwright/test'

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
      return
    }

    throw new Error('User registration did not complete successfully')
  }
}

test.describe('stability', () => {
  test('menu page leaves loading state', async ({ page }) => {
    await page.goto('/thuc-pham')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/Đang tải thực đơn/i)).not.toBeVisible({ timeout: 15000 })
  })

  test('authenticated user can open chat without hanging', async ({ browser }) => {
    test.setTimeout(120000)

    const context = await browser.newContext()
    const page = await context.newPage()
    const email = `codex.chat.${Date.now()}@example.com`
    const password = 'Codex123!'

    try {
      await registerUser(page, email, password, 'Codex Chat User')
      await page.goto('/chat')
      await expect(page.getByRole('heading', { name: /Chat với cửa hàng/i })).toBeVisible({ timeout: 15000 })
      await expect(page.getByPlaceholder(/Nhập tin nhắn/i)).toBeVisible({ timeout: 15000 })
    } finally {
      await context.close().catch(() => {})
    }
  })

  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing admin E2E credentials')
  test('admin login reaches dashboard without hanging', async ({ page }) => {
    await page.goto('/adminlogin')
    await page.locator('#email').fill(ADMIN_EMAIL!)
    await page.locator('#password').fill(ADMIN_PASSWORD!)
    await page.getByRole('button', { name: /Đăng nhập hệ thống/i }).click()

    await page.waitForURL(/\/admin$/, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()
  })
})
