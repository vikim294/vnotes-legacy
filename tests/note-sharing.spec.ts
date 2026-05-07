import { test, expect } from '@playwright/test'
import {
  login,
  createNode,
  deleteNode,
  enterEditMode,
  goToDirectory,
  navigateToDetail,
} from './helpers/vnote'

test.describe('note sharing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('share and unshare a detail node', async ({ page }) => {
    const label = crypto.randomUUID()

    // Create a detail node
    await createNode(page, label, { isDetail: true })

    // Enter edit mode
    await enterEditMode(page)

    // Right-click the created detail node — context menu should show "share"
    await page.locator('svg tspan').filter({ hasText: label }).first().click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'share' })).toBeVisible()

    // Click share — this is an immediate API call, no save needed.
    const nodeGroup = page.locator('svg g').filter({
      has: page.locator('tspan', { hasText: label }),
    })
    await page.getByRole('button', { name: 'share' }).click()
    await expect(nodeGroup.locator('foreignObject')).toBeVisible()

    // Right-click the same node again — "unshare" should now be in the menu
    await page.locator('svg tspan').filter({ hasText: label }).first().click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'unshare' })).toBeVisible()

    await page.getByRole('button', { name: 'unshare' }).click()
    await expect(nodeGroup.locator('foreignObject')).toHaveCount(0)

    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()

    // Cleanup
    await deleteNode(page, label)
  })

  test('shared note is publicly accessible without auth', async ({ page, browser }) => {
    const label = crypto.randomUUID()

    // Create a detail node
    await createNode(page, label, { isDetail: true })

    // Enter edit mode
    await enterEditMode(page)

    // Right-click and share the node
    await page.locator('svg tspan').filter({ hasText: label }).first().click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'share' })).toBeVisible()
    const nodeGroup = page.locator('svg g').filter({
      has: page.locator('tspan', { hasText: label }),
    })
    await page.getByRole('button', { name: 'share' }).click()
    await expect(nodeGroup.locator('foreignObject')).toBeVisible()

    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    await navigateToDetail(page, label)

    const match = page.url().match(/\/noteDetails\/(\d+)/)
    expect(match).toBeTruthy()
    const noteId = match![1]

    // Create an incognito context (no auth token) and navigate to the shared note
    const incognitoContext = await browser.newContext()
    const incognitoPage = await incognitoContext.newPage()
    await incognitoPage.goto(`/noteDetails/${noteId}`)

    // Shared notes are publicly accessible — the SVG graph should load
    await expect(incognitoPage.getByTestId('note-graph')).toBeVisible({
      timeout: 10000,
    })
    // Without auth, edit mode should NOT be available
    await expect(incognitoPage.getByRole('button', { name: 'edit mode' })).not.toBeVisible()

    await incognitoContext.close()

    // Navigate back to directory for cleanup
    await goToDirectory(page)

    // Cleanup
    await deleteNode(page, label)
  })

  test('unshared note redirects to unauthorized for unauthenticated users', async ({
    page,
    browser,
  }) => {
    const label = crypto.randomUUID()

    // Create a detail node (do NOT share it)
    await createNode(page, label, { isDetail: true })

    // Switch to select mode for double-click navigation
    await navigateToDetail(page, label)

    const match = page.url().match(/\/noteDetails\/(\d+)/)
    expect(match).toBeTruthy()
    const noteId = match![1]

    // Create incognito context (no auth token) and access the unshared note
    const incognitoContext = await browser.newContext()
    const incognitoPage = await incognitoContext.newPage()
    await incognitoPage.goto(`/noteDetails/${noteId}`)

    // Unshared notes should redirect to unauthorized page
    await expect(incognitoPage.getByText('无权限访问')).toBeVisible({
      timeout: 10000,
    })

    await incognitoContext.close()

    // Navigate back to directory for cleanup
    await goToDirectory(page)

    // Cleanup
    await deleteNode(page, label)
  })

  test('share option NOT visible for non-detail nodes in directory graph', async ({ page }) => {
    const label = crypto.randomUUID()

    await createNode(page, label)

    // Enter edit mode
    await enterEditMode(page)

    // Right-click the regular node — "share" should NOT be in the menu
    await page.locator('svg tspan').filter({ hasText: label }).first().click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'add child node' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'share' })).not.toBeVisible()

    // Dismiss the context menu by clicking the full-screen overlay
    await page.mouse.click(1, 1)
    await expect(page.getByRole('button', { name: 'add child node' })).not.toBeVisible()

    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()

    await deleteNode(page, label)
  })

  test('share option visible for detail nodes in directory graph', async ({ page }) => {
    const label = crypto.randomUUID()

    await createNode(page, label, { isDetail: true })

    // Enter edit mode
    await enterEditMode(page)

    // Right-click the detail node — "share" SHOULD be in the menu
    await page.locator('svg tspan').filter({ hasText: label }).first().click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'share' })).toBeVisible()

    // Dismiss the context menu by clicking the full-screen overlay
    await page.mouse.click(1, 1)

    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()

    await deleteNode(page, label)
  })

  test('share option NOT visible in detail graph', async ({ page }) => {
    const detailLabel = crypto.randomUUID()
    const childLabel = crypto.randomUUID()

    // Create a detail node in directory
    await createNode(page, detailLabel, { isDetail: true })

    await navigateToDetail(page, detailLabel)

    await createNode(page, childLabel)

    // Enter edit mode and right-click the child node
    await enterEditMode(page)

    await page
      .locator('svg tspan')
      .filter({ hasText: childLabel })
      .first()
      .click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'edit text' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'share' })).not.toBeVisible()

    // Dismiss menu, exit edit mode, and navigate back to directory for cleanup
    await page.mouse.click(1, 1)
    await page.getByRole('button', { name: 'exit' }).click()
    await goToDirectory(page)

    await deleteNode(page, detailLabel)
  })
})
