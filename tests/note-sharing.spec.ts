import { test, expect } from '@playwright/test'

test.describe('note sharing', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt')
      await dialog.accept(process.env.TEST_SECRET!)
    })
  })

  test('share and unshare a note', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('无权限访问')).toBeVisible()
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Wait for SVG nodes to render
    await page.locator('svg tspan').first().waitFor({ timeout: 10000 })

    // Enter edit mode
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page.waitForTimeout(500)

    // Find a detail node: right-click each text node until "share" appears in the menu
    const nodeCount = await page.locator('svg tspan').count()
    let detailNodeIndex = -1

    for (let i = 0; i < nodeCount; i++) {
      const node = page.locator('svg g.cursor-pointer').nth(i)
      await node.click({ button: 'right', force: true })
      await page.waitForTimeout(300)

      if (
        await page
          .getByRole('button', { name: 'share' })
          .isVisible()
          .catch(() => false)
      ) {
        detailNodeIndex = i
        // Click share
        await page.getByRole('button', { name: 'share' }).click()
        await page.waitForTimeout(500)
        break
      }

      // Close the context menu by clicking the fixed overlay
      await page.mouse.click(5, 5)
      await page.waitForTimeout(200)
    }

    expect(detailNodeIndex).toBeGreaterThanOrEqual(0)

    // Verify share icon (foreignObject) appears in the SVG
    await expect(page.locator('svg foreignObject').first()).toBeVisible({ timeout: 5000 })

    // Right-click the same node again to verify "unshare" is now in the menu
    await page
      .locator('svg g.cursor-pointer')
      .nth(detailNodeIndex)
      .click({ button: 'right', force: true })
    await page.waitForTimeout(300)

    const unshareButton = page.getByRole('button', { name: 'unshare' })
    await expect(unshareButton).toBeVisible()
    await unshareButton.click()
    await page.waitForTimeout(500)

    // Verify share icon disappears
    await expect(page.locator('svg foreignObject').first()).toHaveCount(0)
  })

  test('shared note is publicly accessible', async ({ page, browser }) => {
    await page.goto('/')
    await expect(page.getByText('无权限访问')).toBeVisible()
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Wait for SVG nodes to render
    await page.locator('svg tspan').first().waitFor({ timeout: 10000 })

    // Enter edit mode
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page.waitForTimeout(500)

    // Find a detail node and share it
    const nodeCount = await page.locator('svg tspan').count()
    let detailNodeIndex = -1

    for (let i = 0; i < nodeCount; i++) {
      const node = page.locator('svg g.cursor-pointer').nth(i)
      await node.click({ button: 'right', force: true })
      await page.waitForTimeout(300)

      if (
        await page
          .getByRole('button', { name: 'share' })
          .isVisible()
          .catch(() => false)
      ) {
        detailNodeIndex = i
        await page.getByRole('button', { name: 'share' }).click()
        await page.waitForTimeout(500)
        break
      }

      await page.mouse.click(5, 5)
      await page.waitForTimeout(200)
    }

    expect(detailNodeIndex).toBeGreaterThanOrEqual(0)
    await expect(page.locator('svg foreignObject').first()).toBeVisible({ timeout: 5000 })

    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()
    await page.waitForTimeout(300)

    // Switch to select mode so double-click navigates to detail page
    await page.getByRole('button', { name: 'select mode' }).click()
    await page.waitForTimeout(200)

    // Double-click the shared node to navigate to its detail page and capture the note ID
    await page
      .locator('svg g')
      .filter({ has: page.locator('tspan') })
      .nth(detailNodeIndex)
      .dblclick({ force: true })
    await page.waitForURL(/\/noteDetails\/\d+/, { timeout: 10000 })

    const noteId = page.url().match(/\/noteDetails\/(\d+)/)?.[1]
    expect(noteId).toBeTruthy()

    // Create an incognito context (no auth token) and navigate to the shared note
    const incognitoContext = await browser.newContext()
    const incognitoPage = await incognitoContext.newPage()

    await incognitoPage.goto(`/noteDetails/${noteId}`)

    // SVG should load — shared notes are publicly accessible
    await expect(incognitoPage.locator('svg')).toBeVisible({ timeout: 10000 })
    // "edit mode" button should NOT be present (allowOperate = false without auth)
    await expect(incognitoPage.getByRole('button', { name: 'edit mode' })).not.toBeVisible()

    await incognitoContext.close()
  })

  test('unshared note redirects unauthorized users', async ({ page, browser }) => {
    await page.goto('/')
    await expect(page.getByText('无权限访问')).toBeVisible()
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Wait for SVG nodes to render
    await page.locator('svg tspan').first().waitFor({ timeout: 10000 })

    // Enter edit mode
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page.waitForTimeout(500)

    // Find a detail node, share it, then unshare it
    const nodeCount = await page.locator('svg tspan').count()
    let detailNodeIndex = -1

    for (let i = 0; i < nodeCount; i++) {
      const node = page.locator('svg g.cursor-pointer').nth(i)
      await node.click({ button: 'right', force: true })
      await page.waitForTimeout(300)

      if (
        await page
          .getByRole('button', { name: 'share' })
          .isVisible()
          .catch(() => false)
      ) {
        detailNodeIndex = i
        // Share first
        await page.getByRole('button', { name: 'share' }).click()
        await page.waitForTimeout(500)

        // Right-click the same node again and unshare
        await page.locator('svg g.cursor-pointer').nth(i).click({ button: 'right', force: true })
        await page.waitForTimeout(300)

        await page.getByRole('button', { name: 'unshare' }).click()
        await page.waitForTimeout(500)
        break
      }

      await page.mouse.click(5, 5)
      await page.waitForTimeout(200)
    }

    expect(detailNodeIndex).toBeGreaterThanOrEqual(0)

    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()
    await page.waitForTimeout(300)

    // Switch to select mode
    await page.getByRole('button', { name: 'select mode' }).click()
    await page.waitForTimeout(200)

    // Double-click to navigate to the (now unshared) note's detail page and capture the ID
    await page
      .locator('svg g')
      .filter({ has: page.locator('tspan') })
      .nth(detailNodeIndex)
      .dblclick({ force: true })
    await page.waitForURL(/\/noteDetails\/\d+/, { timeout: 10000 })

    const noteId = page.url().match(/\/noteDetails\/(\d+)/)?.[1]
    expect(noteId).toBeTruthy()

    // Create incognito context and navigate to the unshared note
    const incognitoContext = await browser.newContext()
    const incognitoPage = await incognitoContext.newPage()

    await incognitoPage.goto(`/noteDetails/${noteId}`)

    // Unshared notes should redirect to unauthorized
    await expect(incognitoPage.getByText('无权限访问')).toBeVisible({ timeout: 10000 })

    await incognitoContext.close()
  })

  test('share option only appears for detail nodes in directory graph', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('无权限访问')).toBeVisible()
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    // Wait for SVG nodes to render
    await page.locator('svg tspan').first().waitFor({ timeout: 10000 })

    // Enter edit mode
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page.waitForTimeout(500)

    // Test 1: Non-detail nodes should NOT show "share" in the context menu
    const nodeCount = await page.locator('svg tspan').count()
    let foundNonDetail = false
    let detailNodeIndex = -1

    for (let i = 0; i < nodeCount; i++) {
      const node = page.locator('svg g.cursor-pointer').nth(i)
      await node.click({ button: 'right', force: true })
      await page.waitForTimeout(300)

      const hasAddChild = await page
        .getByRole('button', { name: 'add child node' })
        .isVisible()
        .catch(() => false)
      const hasShare = await page
        .getByRole('button', { name: 'share' })
        .isVisible()
        .catch(() => false)

      if (!foundNonDetail && hasAddChild) {
        // Non-detail node: "share" should NOT be visible
        await expect(page.getByRole('button', { name: 'share' })).not.toBeVisible()
        foundNonDetail = true
      }

      if (detailNodeIndex === -1 && hasShare) {
        detailNodeIndex = i
      }

      // Close the menu
      await page.mouse.click(5, 5)
      await page.waitForTimeout(200)

      if (foundNonDetail && detailNodeIndex >= 0) break
    }

    expect(foundNonDetail).toBe(true)
    expect(detailNodeIndex).toBeGreaterThanOrEqual(0)

    // Test 2: Detail graph should NOT show "share" in context menu
    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()
    await page.waitForTimeout(300)

    // Switch to select mode
    await page.getByRole('button', { name: 'select mode' }).click()
    await page.waitForTimeout(200)

    // Double-click the detail node to navigate to its detail page
    await page
      .locator('svg g')
      .filter({ has: page.locator('tspan') })
      .nth(detailNodeIndex)
      .dblclick({ force: true })
    await page.waitForURL(/\/noteDetails\/\d+/, { timeout: 10000 })

    // Wait for detail graph SVG nodes to render
    await page.locator('svg tspan').first().waitFor({ timeout: 10000 })

    // Enter edit mode in detail graph
    await page.getByRole('button', { name: 'edit mode' }).click()
    await page.waitForTimeout(500)

    // Right-click a node in the detail graph
    const detailNodeCount = await page.locator('svg tspan').count()
    expect(detailNodeCount).toBeGreaterThan(0)

    await page.locator('svg g.cursor-pointer').first().click({ button: 'right', force: true })
    await page.waitForTimeout(300)

    // "share" should NOT be in the menu in detail graph
    await expect(page.getByRole('button', { name: 'share' })).not.toBeVisible()
  })
})
