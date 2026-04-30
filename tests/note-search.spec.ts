import { test, expect } from '@playwright/test'

test.describe('Note search', () => {
  const searchQuery = 'test'

  test.beforeEach(async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt')
      await dialog.accept(process.env.TEST_SECRET!)
    })
  })

  test('search and navigate to a note', async ({ page }) => {
    // Navigate to directory page and authenticate
    await page.goto('/')
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Open search modal
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-search') })
      .click()
    await expect(page.getByText('Start typing to search for notes')).toBeVisible()

    // Type search query
    await page.getByPlaceholder('Search notes...').fill(searchQuery)

    // Wait for debounce (200ms) + API response
    await page.waitForTimeout(500)
    await expect(page.locator('ul li').first()).toBeVisible({ timeout: 5000 })

    // Verify each result has an icon (emerald for detail, blue for directory)
    const resultCount = await page.locator('ul li').count()
    expect(resultCount).toBeGreaterThan(0)

    const emeraldCount = await page.locator('ul li svg.text-emerald-400').count()
    const blueCount = await page.locator('ul li svg.text-blue-400').count()
    expect(emeraldCount + blueCount).toBe(resultCount)

    // Click the first search result
    await page.locator('ul li button').first().click()

    // Verify navigation to note detail page
    await expect(page).toHaveURL(/\/noteDetails\/\d+/)

    // Verify detail page loads (SVG visible)
    await expect(page.locator('svg').first()).toBeVisible()
  })

  test('show no results for nonsense query', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Open search modal
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-search') })
      .click()
    await expect(page.getByText('Start typing to search for notes')).toBeVisible()

    // Type nonsense query
    await page.getByPlaceholder('Search notes...').fill('xyznonexistent123456')

    // Wait for debounce + API response
    await page.waitForTimeout(500)

    // Verify "No notes found" appears
    await expect(page.getByText('No notes found')).toBeVisible()
  })

  test('close via X button', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Open search modal
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-search') })
      .click()
    await expect(page.getByText('Start typing to search for notes')).toBeVisible()

    // Click X button in modal header
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-x') })
      .click()

    // Verify modal dismissed
    await expect(page.getByText('Start typing to search for notes')).not.toBeVisible()
  })

  test('close via Escape key', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Open search modal
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-search') })
      .click()
    await expect(page.getByText('Start typing to search for notes')).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Verify modal dismissed
    await expect(page.getByText('Start typing to search for notes')).not.toBeVisible()
  })

  test('mask click does not close modal', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Open search modal
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-search') })
      .click()
    await expect(page.getByText('Start typing to search for notes')).toBeVisible()

    // Click the dark overlay background (top-left corner, outside modal content)
    await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } })

    // Verify modal is still visible — mask click does not close it
    await expect(page.getByText('Start typing to search for notes')).toBeVisible()

    // Close via X button for cleanup
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-x') })
      .click()
    await expect(page.getByText('Start typing to search for notes')).not.toBeVisible()
  })

  test('unauthorized user cannot access search', async ({ browser }) => {
    // Create a new context without auth token (no localStorage)
    const context = await browser.newContext()
    const page = await context.newPage()

    // Navigate to directory page — should redirect to unauthorized
    await page.goto('/')
    await expect(page.getByText('无权限访问')).toBeVisible()

    await context.close()
  })
})
