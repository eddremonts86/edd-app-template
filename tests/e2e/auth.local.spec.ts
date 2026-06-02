import { expect, test } from '@playwright/test'
import {
  createAuthCredentials,
  expectDashboard,
  provisionAccount,
  signInInBrowser,
} from './utils/auth-local'

const defaultAdminCredentials = {
  email: process.env.DEFAULT_ADMIN_EMAIL ?? 'edd_admin@local.com',
  password: process.env.DEFAULT_ADMIN_PASSWORD ?? 'Passw0rd!234',
}

test.describe.serial('local auth journey', () => {
  test('opens /auth and exposes sign-in/sign-up tabs', async ({ page }) => {
    await page.goto('/auth')

    await expect(page).toHaveURL(/\/auth$/)
    await expect(page.getByTestId('auth-tab-sign-in')).toBeVisible()
    await expect(page.getByTestId('auth-tab-sign-up')).toBeVisible()
  })

  test('switches from sign-in to sign-up and reveals the registration form', async ({ page }) => {
    await page.goto('/auth')

    await page.getByTestId('auth-tab-sign-up').click()

    await expect(page.locator('#sign-up-name')).toBeVisible()
    await expect(page.locator('#sign-up-email')).toBeVisible()
    await expect(page.locator('#sign-up-password')).toBeVisible()
  })

  test('signs in with default seeded admin from .env and reaches the dashboard', async ({
    page,
  }) => {
    await page.goto('/auth')
    await expect(page).toHaveURL(/\/auth$/)
    await page.getByTestId('auth-input-sign-in-email').fill(defaultAdminCredentials.email)
    await page.getByTestId('auth-input-sign-in-password').fill(defaultAdminCredentials.password)
    await page.getByTestId('auth-submit-sign-in').click()
    await expectDashboard(page)
  })

  test('redirects authenticated users away from /auth', async ({ page, request }) => {
    const redirectCredentials = createAuthCredentials('redirect')

    await provisionAccount(request, redirectCredentials)

    await page.goto('/auth')
    await signInInBrowser(page, redirectCredentials)
    await expectDashboard(page)

    await page.goto('/auth')

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
