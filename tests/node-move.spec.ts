import { test, expect } from '@playwright/test'

/**
 * Authenticate the page session by handling the prompt dialog
 * and navigating through the auth flow.
 */
async function authenticate(page: import('@playwright/test').Page) {
  page.on('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt')
    await dialog.accept(process.env.TEST_SECRET!)
  })

  await page.goto('/')

  if (
    await page
      .getByRole('button', { name: 'edit mode' })
      .isVisible({ timeout: 1000 })
      .catch(() => false)
  ) {
    return
  }

  await expect(page.getByText('无权限访问')).toBeVisible()
  await page.getByRole('button', { name: '输入密钥' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()
}

/**
 * Navigate to a note detail page by finding a detail node on the directory page.
 * Detail nodes navigate to /noteDetails/:id on double-click in browse mode.
 */
async function navigateToDetailPage(page: import('@playwright/test').Page) {
  // Wait for SVG to render
  await page.locator('svg tspan').first().waitFor({ timeout: 15000 })

  // Enter edit mode so we can right-click to find a detail node
  await page.getByRole('button', { name: 'edit mode' }).click()
  await page.waitForTimeout(500)

  // Find a detail node: right-click each g element, check if "share" is in menu
  // Share only appears for detail nodes in directory graph
  const nodeCount = await page.locator('svg tspan').count()
  let detailNodeIndex = -1

  for (let i = 0; i < nodeCount; i++) {
    const node = page.locator('svg g.cursor-pointer').nth(i)
    await node.click({ button: 'right', force: true })
    await page.waitForTimeout(300)

    const hasShare = await page
      .getByRole('button', { name: 'share' })
      .isVisible()
      .catch(() => false)

    if (hasShare) {
      detailNodeIndex = i
      // Close the menu by clicking the overlay
      await page.mouse.click(5, 5)
      await page.waitForTimeout(200)
      break
    }

    // Close the menu
    await page.mouse.click(5, 5)
    await page.waitForTimeout(200)
  }

  expect(detailNodeIndex).toBeGreaterThanOrEqual(0)

  // Exit edit mode and switch to select mode to enable double-click navigation
  await page.getByRole('button', { name: 'exit' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'select mode' }).click()
  await page.waitForTimeout(200)

  // Double-click the detail node to navigate to its detail page
  // In browse/select mode, g elements don't have cursor-pointer class
  await page
    .locator('svg g')
    .filter({ has: page.locator('tspan') })
    .nth(detailNodeIndex)
    .dblclick({ force: true })
  await page.waitForURL(/\/noteDetails\/\d+/, { timeout: 10000 })
}

test.describe('Node move functionality', () => {
  test('move a single node (happy path)', async ({ page }) => {
    await authenticate(page)
    await navigateToDetailPage(page)

    // Wait for SVG text nodes to render on detail page
    await page.locator('svg tspan').first().waitFor({ timeout: 15000 })

    // Enter edit mode
    await page.getByRole('button', { name: 'edit mode' }).click()

    // Right-click on the first node to open the NodeMenu
    await page
      .locator('svg g')
      .filter({ has: page.locator('tspan') })
      .first()
      .click({ button: 'right', force: true })

    // Verify NodeMenu appears with "move to" option (only in detail graph)
    await expect(page.getByText('move to')).toBeVisible()

    // Click "move to"
    await page.getByText('move to').click()

    // Verify SearchModal opens with the select-mode placeholder
    await expect(page.getByPlaceholder('Search for a note to move to...')).toBeVisible()

    // Type a search query
    await page.getByPlaceholder('Search for a note to move to...').fill('a')

    // Wait for debounced search (200ms) + API response
    await page.waitForTimeout(1000)

    // Check for search results
    const searchResults = page.locator('ul li button')
    const resultCount = await searchResults.count()

    if (resultCount > 0) {
      await searchResults.first().click()

      // Verify MoveSuccessModal appears with "Moved successfully"
      await expect(page.getByText('Moved successfully')).toBeVisible()

      // Click "Close" button
      await page.getByRole('button', { name: 'Close' }).click()

      // Verify the modal dismisses
      await expect(page.getByText('Moved successfully')).not.toBeVisible()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('MoveSuccessModal "Go to check" navigates to target note', async ({ page }) => {
    await authenticate(page)
    await navigateToDetailPage(page)

    await page.locator('svg tspan').first().waitFor({ timeout: 15000 })
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page
      .locator('svg g')
      .filter({ has: page.locator('tspan') })
      .first()
      .click({ button: 'right', force: true })
    await expect(page.getByText('move to')).toBeVisible()
    await page.getByText('move to').click()
    await expect(page.getByPlaceholder('Search for a note to move to...')).toBeVisible()
    await page.getByPlaceholder('Search for a note to move to...').fill('a')
    await page.waitForTimeout(1000)

    const searchResults = page.locator('ul li button')
    const resultCount = await searchResults.count()

    if (resultCount > 0) {
      await searchResults.first().click()
      await expect(page.getByText('Moved successfully')).toBeVisible()

      // Click "Go to check"
      await page.getByRole('button', { name: 'Go to check' }).click()

      // Verify navigation to the target note detail page with label query param
      expect(page.url()).toMatch(/\/noteDetails\/\d+\?label=/)
      await expect(page.locator('svg')).toBeVisible()
    } else {
      await page.keyboard.press('Escape')
    }
  })

  test('search results in select mode only show detail notes', async ({ page }) => {
    await authenticate(page)
    await navigateToDetailPage(page)

    await page.locator('svg tspan').first().waitFor({ timeout: 15000 })
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page
      .locator('svg g')
      .filter({ has: page.locator('tspan') })
      .first()
      .click({ button: 'right', force: true })
    await expect(page.getByText('move to')).toBeVisible()
    await page.getByText('move to').click()
    await expect(page.getByPlaceholder('Search for a note to move to...')).toBeVisible()

    // Type a broad query to get results
    await page.getByPlaceholder('Search for a note to move to...').fill('a')
    await page.waitForTimeout(1000)

    const searchResults = page.locator('ul li button')
    const count = await searchResults.count()
    if (count > 0) {
      // In select mode, only detail notes are shown.
      // Each detail note result has a "detail" badge.
      const detailBadges = page.locator('ul li button span:has-text("detail")')
      const badgeCount = await detailBadges.count()
      expect(badgeCount).toBe(count)
    }

    // Get the current note label to verify it is excluded from results.
    const noteLabel = await page.evaluate(() => {
      const goBackBtn = document.querySelector('button[title="Go back"]')
      const toolbar = goBackBtn?.parentElement
      return toolbar?.querySelector('span')?.textContent?.trim() || ''
    })

    if (noteLabel) {
      await page.getByPlaceholder('Search for a note to move to...').fill(noteLabel)
      await page.waitForTimeout(1000)

      const resultTexts = await page.locator('ul li button').allTextContents()
      const found = resultTexts.some((text) => text.includes(noteLabel))
      expect(found).toBe(false)
    }

    await page.keyboard.press('Escape')
  })

  test('"move to" not available in directory graph', async ({ page }) => {
    await authenticate(page)

    // Stay on the directory page
    await page.locator('svg tspan').first().waitFor({ timeout: 15000 })

    // Enter edit mode
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page.waitForTimeout(500)

    // Right-click on a node to open NodeMenu
    await page.locator('svg g.cursor-pointer').first().click({ button: 'right', force: true })
    await page.waitForTimeout(300)

    // Verify NodeMenu is open by checking for a common menu item
    await expect(page.getByText('edit text')).toBeVisible()

    // Verify "move to" is NOT present in the directory graph NodeMenu
    await expect(page.getByText('move to')).not.toBeVisible()
  })

  test('auth enforcement redirects unauthenticated users', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/')
    await expect(page).toHaveURL('/unauthorized')

    await context.close()
  })
})
