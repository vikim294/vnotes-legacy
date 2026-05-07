import { test, expect } from '@playwright/test'
import {
  login,
  createNode,
  createNodeWithoutSave,
  deleteNode,
  dragNodeTo,
  enterEditMode,
  goToDirectory,
  navigateToDetail,
  saveGraph,
} from './helpers/vnote'

test.describe('Node move functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('"move to" is available in detail graph context menu', async ({ page }) => {
    const detailLabel = `detail-${crypto.randomUUID()}`
    const childLabel = `child-${crypto.randomUUID()}`

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

    // Verify "move to" is visible in the detail graph context menu
    await expect(page.getByRole('button', { name: 'move to' })).toBeVisible()

    // Dismiss the context menu by clicking the full-screen overlay
    await page.mouse.click(1, 1)
    await expect(page.getByRole('button', { name: 'move to' })).not.toBeVisible()

    // Exit edit mode and navigate back to directory for cleanup
    await page.getByRole('button', { name: 'exit' }).click()
    await goToDirectory(page)

    await deleteNode(page, detailLabel)
  })

  test('"move to" is NOT available in directory graph context menu', async ({ page }) => {
    const label = crypto.randomUUID()

    await createNode(page, label)

    // Enter edit mode
    await enterEditMode(page)

    // Right-click the node on the directory graph
    await page.locator('svg tspan').filter({ hasText: label }).first().click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'add child node' })).toBeVisible()

    // Verify "move to" is NOT present in the directory graph context menu
    await expect(page.getByRole('button', { name: 'move to' })).not.toBeVisible()

    // Dismiss the context menu by clicking the full-screen overlay
    await page.mouse.click(1, 1)
    await expect(page.getByRole('button', { name: 'add child node' })).not.toBeVisible()

    // Exit edit mode
    await page.getByRole('button', { name: 'exit' }).click()

    await deleteNode(page, label)
  })

  test('move a node to another note (happy path)', async ({ page }) => {
    const sourceLabel = `source-${crypto.randomUUID()}`
    const targetLabel = `target-${crypto.randomUUID()}`
    const childLabel = `child-${crypto.randomUUID()}`

    // Create two detail nodes at different positions, then save once
    await enterEditMode(page)
    await createNodeWithoutSave(page, sourceLabel, { isDetail: true })
    await dragNodeTo(page, sourceLabel, 300, 200)
    await createNodeWithoutSave(page, targetLabel, { isDetail: true })
    await dragNodeTo(page, targetLabel, 600, 400)
    await saveGraph(page)

    await page.reload()
    await expect(page.getByTestId('note-graph')).toBeVisible()
    await expect(page.locator('svg tspan').filter({ hasText: sourceLabel })).toBeVisible()

    await navigateToDetail(page, sourceLabel)

    await createNode(page, childLabel)

    // Enter edit mode, right-click the child node, and click "move to"
    await enterEditMode(page)

    await page
      .locator('svg tspan')
      .filter({ hasText: childLabel })
      .first()
      .click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'move to' })).toBeVisible()

    await page.getByRole('button', { name: 'move to' }).click()

    await expect(page.getByPlaceholder('Search for a note to move to...')).toBeVisible()
    await page.getByPlaceholder('Search for a note to move to...').fill(targetLabel)

    const resultItem = page.locator('ul li button').filter({ hasText: targetLabel })
    await expect(resultItem).toBeVisible({ timeout: 5000 })
    await resultItem.click()

    await expect(page.getByText('Moved successfully')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByText('Moved successfully')).not.toBeVisible()

    // Navigate to target's detail page to verify the node was actually moved.
    // (handleMoveSelectNote already called setEditMode(false), so we are not in edit mode.)
    await goToDirectory(page)
    await navigateToDetail(page, targetLabel)
    await expect(page.locator('svg tspan').filter({ hasText: childLabel })).toBeVisible()

    // Navigate back to directory for cleanup
    await goToDirectory(page)

    await deleteNode(page, sourceLabel)
    await deleteNode(page, targetLabel)
  })

  test('"Go to check" navigates to target note after move', async ({ page }) => {
    const sourceLabel = `source-${crypto.randomUUID()}`
    const targetLabel = `target-${crypto.randomUUID()}`
    const childLabel = `child-${crypto.randomUUID()}`

    // Create two detail nodes at different positions, then save once
    await enterEditMode(page)
    await createNodeWithoutSave(page, sourceLabel, { isDetail: true })
    await dragNodeTo(page, sourceLabel, 300, 200)
    await createNodeWithoutSave(page, targetLabel, { isDetail: true })
    await dragNodeTo(page, targetLabel, 600, 400)
    await saveGraph(page)

    await page.reload()
    await expect(page.getByTestId('note-graph')).toBeVisible()
    await expect(page.locator('svg tspan').filter({ hasText: sourceLabel })).toBeVisible()

    await navigateToDetail(page, sourceLabel)

    await createNode(page, childLabel)

    // Enter edit mode, right-click child, click "move to"
    await enterEditMode(page)

    await page
      .locator('svg tspan')
      .filter({ hasText: childLabel })
      .first()
      .click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'move to' })).toBeVisible()

    await page.getByRole('button', { name: 'move to' }).click()

    await expect(page.getByPlaceholder('Search for a note to move to...')).toBeVisible()
    await page.getByPlaceholder('Search for a note to move to...').fill(targetLabel)
    const resultItem = page.locator('ul li button').filter({ hasText: targetLabel })
    await expect(resultItem).toBeVisible({ timeout: 5000 })
    await resultItem.click()

    await expect(page.getByText('Moved successfully')).toBeVisible()

    // Click "Go to check"
    await page.getByRole('button', { name: 'Go to check' }).click()

    expect(page.url()).toMatch(/\/noteDetails\/\d+\?label=/)
    await expect(page.getByTestId('note-graph')).toBeVisible()
    // Verify the moved node is actually present in target's detail graph
    await expect(page.locator('svg tspan').filter({ hasText: childLabel })).toBeVisible()

    // Navigate back to directory for cleanup
    await goToDirectory(page)

    await deleteNode(page, sourceLabel)
    await deleteNode(page, targetLabel)
  })

  test('search results in move-to only show detail notes with "detail" badge', async ({ page }) => {
    const sourceLabel = `move-src-${crypto.randomUUID()}`
    const targetLabel = `move-tgt-${crypto.randomUUID()}`
    const regularLabel = `move-reg-${crypto.randomUUID()}`
    const childLabel = `child-${crypto.randomUUID()}`

    // Create three nodes at different positions, then save once
    await enterEditMode(page)
    await createNodeWithoutSave(page, sourceLabel, { isDetail: true })
    await dragNodeTo(page, sourceLabel, 300, 200)
    await createNodeWithoutSave(page, targetLabel, { isDetail: true })
    await dragNodeTo(page, targetLabel, 600, 400)
    await createNodeWithoutSave(page, regularLabel)
    await dragNodeTo(page, regularLabel, 450, 600)
    await saveGraph(page)

    await page.reload()
    await expect(page.getByTestId('note-graph')).toBeVisible()
    await expect(page.locator('svg tspan').filter({ hasText: sourceLabel })).toBeVisible()

    await navigateToDetail(page, sourceLabel)

    await createNode(page, childLabel)

    // Enter edit mode, right-click child, click "move to"
    await enterEditMode(page)

    await page
      .locator('svg tspan')
      .filter({ hasText: childLabel })
      .first()
      .click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'move to' })).toBeVisible()

    await page.getByRole('button', { name: 'move to' }).click()
    await expect(page.getByPlaceholder('Search for a note to move to...')).toBeVisible()

    // Search for the common prefix shared by all test nodes
    await page.getByPlaceholder('Search for a note to move to...').fill('move-')
    await expect(page.locator('ul li button').first()).toBeVisible({ timeout: 5000 })

    const resultCount = await page.locator('ul li button').count()
    expect(resultCount).toBeGreaterThan(0)

    // Every result item should have a "detail" badge span
    const detailBadges = page.locator('ul li button span:has-text("detail")')
    await expect(detailBadges).toHaveCount(resultCount)

    // Regular node should be excluded from results
    const resultTexts = await page.locator('ul li button').allTextContents()
    const regFound = resultTexts.some((text) => text.includes('move-reg'))
    expect(regFound).toBe(false)

    // Dismiss search modal
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder('Search for a note to move to...')).not.toBeVisible()

    // Navigate back to directory for cleanup
    await page.getByRole('button', { name: 'exit' }).click()
    await goToDirectory(page)

    await deleteNode(page, sourceLabel)
    await deleteNode(page, targetLabel)
    await deleteNode(page, regularLabel)
  })

  test('current note is excluded from search results', async ({ page }) => {
    const sourceLabel = `source-${crypto.randomUUID()}`
    const targetLabel = `target-${crypto.randomUUID()}`
    const childLabel = `child-${crypto.randomUUID()}`

    // Create two detail nodes at different positions, then save once
    await enterEditMode(page)
    await createNodeWithoutSave(page, sourceLabel, { isDetail: true })
    await dragNodeTo(page, sourceLabel, 300, 200)
    await createNodeWithoutSave(page, targetLabel, { isDetail: true })
    await dragNodeTo(page, targetLabel, 600, 400)
    await saveGraph(page)

    await page.reload()
    await expect(page.getByTestId('note-graph')).toBeVisible()
    await expect(page.locator('svg tspan').filter({ hasText: sourceLabel })).toBeVisible()

    await navigateToDetail(page, sourceLabel)

    await createNode(page, childLabel)

    // Enter edit mode, right-click child, click "move to"
    await enterEditMode(page)

    await page
      .locator('svg tspan')
      .filter({ hasText: childLabel })
      .first()
      .click({ button: 'right' })
    await expect(page.getByRole('button', { name: 'move to' })).toBeVisible()

    await page.getByRole('button', { name: 'move to' }).click()
    await expect(page.getByPlaceholder('Search for a note to move to...')).toBeVisible()

    // First verify the search infrastructure works by searching for target
    await page.getByPlaceholder('Search for a note to move to...').fill(targetLabel)
    await expect(page.locator('ul li button').first()).toBeVisible({ timeout: 5000 })

    // Now search for the source note's label — it should NOT appear in results
    await page.getByPlaceholder('Search for a note to move to...').clear()
    await page.getByPlaceholder('Search for a note to move to...').fill(sourceLabel)
    // Debounced search (200ms) + API call — must wait for it to settle
    await page.waitForTimeout(500)

    const resultTexts = await page.locator('ul li button').allTextContents()
    const selfFound = resultTexts.some((text) => text.includes(sourceLabel))
    expect(selfFound).toBe(false)

    // Dismiss search modal
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder('Search for a note to move to...')).not.toBeVisible()

    // Navigate back to directory for cleanup
    await page.getByRole('button', { name: 'exit' }).click()
    await goToDirectory(page)

    await deleteNode(page, sourceLabel)
    await deleteNode(page, targetLabel)
  })
})
