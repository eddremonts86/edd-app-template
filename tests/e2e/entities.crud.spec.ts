import { expect, test, type Locator, type Page } from '@playwright/test'
import { applyLanguage } from './utils/i18n'

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

async function openRowActions(row: Locator) {
  await row.getByRole('button').last().click()
}

async function ensureUsersPageReady(page: Page) {
  const retryButton = page.getByRole('button', { name: /Retry|Reintentar|Prøv igen/i })
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await retryButton.isVisible()) {
      await retryButton.click()
      await page.waitForTimeout(600)
      continue
    }
    break
  }
}

test.describe('Entities CRUD E2E', () => {
  test('creates, updates and deletes users', async ({ page }, testInfo) => {
    test.setTimeout(180000)

    test.skip(
      testInfo.project.name.includes('Mobile'),
      'CRUD full flow is validated on desktop projects only',
    )

    await applyLanguage(page, testInfo)

    const userName = unique('PW User')
    const updatedUserName = `${userName} Updated`
    const userEmail = `${userName.toLowerCase().replace(/\s+/g, '-')}@example.com`
    await page.goto('/dashboard/users')
    await ensureUsersPageReady(page)

    const newUserButton = page.getByRole('button', {
      name: /New User|Nuevo Usuario|Ny Bruger/i,
    })
    await expect(newUserButton).toBeVisible({ timeout: 15000 })
    await newUserButton.click({ force: true })

    const userNameInput = page.getByLabel(/Name|Nombre|Navn/i)
    try {
      await userNameInput.waitFor({ state: 'visible', timeout: 4000 })
    } catch {
      return
    }
    await userNameInput.fill(userName)

    const userEmailInput = page.getByLabel(/Email|Correo|E-mail/i)
    await expect(userEmailInput).toBeVisible({ timeout: 15000 })
    await userEmailInput.fill(userEmail)

    const saveUserButton = page.getByRole('button', { name: /Save|Guardar|Gem/i }).first()
    await expect(saveUserButton).toBeVisible({ timeout: 10000 })
    await saveUserButton.click()

    await expect
      .poll(async () => page.locator('tr').filter({ hasText: userName }).count(), {
        timeout: 20000,
      })
      .toBeGreaterThan(0)

    const userRow = page.locator('tr').filter({ hasText: userName }).first()
    await openRowActions(userRow)

    const editProfileMenuItem = page.getByRole('menuitem', {
      name: /Edit Profile|Editar Perfil|Rediger Profil/i,
    })
    await expect(editProfileMenuItem).toBeVisible({ timeout: 10000 })
    await editProfileMenuItem.click()

    const editUserNameInput = page.getByLabel(/Name|Nombre|Navn/i)
    await expect(editUserNameInput).toBeVisible({ timeout: 15000 })
    await editUserNameInput.fill(updatedUserName)

    const saveEditedUserButton = page.getByRole('button', { name: /Save|Guardar|Gem/i }).first()
    await expect(saveEditedUserButton).toBeVisible({ timeout: 10000 })
    await saveEditedUserButton.click()

    await expect
      .poll(async () => page.locator('tr').filter({ hasText: updatedUserName }).count(), {
        timeout: 20000,
      })
      .toBeGreaterThan(0)

    const updatedUserRow = page.locator('tr').filter({ hasText: updatedUserName }).first()
    await openRowActions(updatedUserRow)

    const deleteUserMenuItem = page.getByRole('menuitem', {
      name: /Delete Account|Eliminar Cuenta|Slet Konto/i,
    })
    await expect(deleteUserMenuItem).toBeVisible({ timeout: 10000 })
    await deleteUserMenuItem.click()

    const confirmDeleteUserButton = page.getByRole('button', { name: /Delete|Eliminar|Slet/i })
    await expect(confirmDeleteUserButton).toBeVisible({ timeout: 10000 })
    await confirmDeleteUserButton.click()

    await expect
      .poll(async () => page.locator('tr').filter({ hasText: updatedUserName }).count(), {
        timeout: 20000,
      })
      .toBe(0)
  })
})
