import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('trang chủ được hiển thị', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/universaltea/i)
  })
})

test.describe('Navigation', () => {
  test('trang thực phẩm được load', async ({ page }) => {
    const response = await page.goto('/thuc-pham')
    expect(response?.status()).toBeLessThan(400)
  })
})
