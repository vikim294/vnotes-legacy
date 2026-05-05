import { test, expect, type Page } from '@playwright/test'
import { createNode, deleteNode, login } from './helpers/vnote'

test.describe('Note search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('search and navigate to a note', async ({ page }) => {
    // Create nodes so the test is self-contained
    const prefix = `search-${crypto.randomUUID().slice(0, 8)}`
    const dirLabel = `${prefix}-dir`
    const detailLabel = `${prefix}-detail`
    await createNode(page, dirLabel)
    await createNode(page, detailLabel, { isDetail: true })

    await openSearchModal(page)

    // Search by the shared prefix — both nodes should appear
    await page.getByPlaceholder('Search notes...').fill(prefix)
    await expect(page.locator('ul li').first()).toBeVisible({ timeout: 5000 })

    // Verify both nodes appear with correct icons (blue for directory, emerald for detail)
    const resultCount = await page.locator('ul li').count()
    expect(resultCount).toBeGreaterThanOrEqual(2)

    const emeraldCount = await page.locator('ul li svg.text-emerald-400').count()
    const blueCount = await page.locator('ul li svg.text-blue-400').count()
    expect(emeraldCount + blueCount).toBe(resultCount)
    expect(emeraldCount).toBeGreaterThanOrEqual(1)
    expect(blueCount).toBeGreaterThanOrEqual(1)

    await expect(page.locator('ul li').filter({ hasText: dirLabel })).toBeVisible()
    await expect(page.locator('ul li').filter({ hasText: detailLabel })).toBeVisible()

    // Click the detail node result — only detail nodes navigate to detail page
    await page.locator('ul li').filter({ hasText: detailLabel }).locator('button').click()
    await expect(page).toHaveURL(/\/noteDetails\/\d+/)
    await expect(page.getByTestId('note-graph')).toBeVisible()

    // Navigate back and clean up
    await page.getByTitle('Go back').click()
    await expect(page).toHaveURL('/')
    await deleteNode(page, detailLabel)
    await deleteNode(page, dirLabel)
  })

  test('show no results for nonsense query', async ({ page }) => {
    await openSearchModal(page)

    // Type nonsense query — assertion below auto-retries up to 5s,
    // covering the 200ms debounce + API round-trip
    await page.getByPlaceholder('Search notes...').fill('xyznonexistent123456')

    // Verify "No notes found" appears
    await expect(page.getByText('No notes found')).toBeVisible()
  })

  test('close via X button', async ({ page }) => {
    await openSearchModal(page)

    // Click X button in modal header
    await closeSearchModal(page)

    // Verify modal dismissed
    await expect(page.getByText('Start typing to search for notes')).not.toBeVisible()
  })

  test('close via Escape key', async ({ page }) => {
    await openSearchModal(page)

    // Press Escape
    await page.keyboard.press('Escape')

    // Verify modal dismissed
    await expect(page.getByText('Start typing to search for notes')).not.toBeVisible()
  })

  test('mask click does not close modal', async ({ page }) => {
    await openSearchModal(page)

    // Click the dark overlay background (top-left corner, outside modal content)
    await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } })

    // Verify modal is still visible — mask click does not close it
    await expect(page.getByText('Start typing to search for notes')).toBeVisible()

    // Close via X button for cleanup
    await closeSearchModal(page)
    await expect(page.getByText('Start typing to search for notes')).not.toBeVisible()
  })

  test('unauthorized user cannot access search', async ({ browser }) => {
    // Create a fresh context with no localStorage (no auth token)
    const context = await browser.newContext()
    const page = await context.newPage()

    // Navigate to directory page — should redirect to unauthorized
    await page.goto('/')
    await expect(page.getByText('无权限访问')).toBeVisible()

    await context.close()
  })
})

/**
 * Open the search modal from the directory page toolbar.
 * Clicks the search icon button and waits for the modal to render.
 */
async function openSearchModal(page: Page) {
  await page
    .locator('button')
    .filter({ has: page.locator('svg.lucide-search') })
    .click()
  await expect(page.getByText('Start typing to search for notes')).toBeVisible()
}

/**
 * Close the search modal by clicking the X button in the modal header.
 */
async function closeSearchModal(page: Page) {
  await page
    .locator('button')
    .filter({ has: page.locator('svg.lucide-x') })
    .click()
}
