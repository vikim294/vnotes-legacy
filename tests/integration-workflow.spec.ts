import { test, expect } from '@playwright/test'
import { createNode, deleteNode, editNodeLabel, login } from './helpers/vnote'

test('full integration workflow', async ({ page }) => {
  const detailLabel = `int-detail-${crypto.randomUUID()}`
  const childLabel = `int-child-${crypto.randomUUID()}`
  const editedChildLabel = `int-child-edited-${crypto.randomUUID()}`

  // ==================================================================
  // 1. Authenticate and land on home page
  // ==================================================================
  await login(page)

  // ==================================================================
  // 2. Create a detail node on the directory page
  // ==================================================================
  await createNode(page, detailLabel, { isDetail: true })

  // ==================================================================
  // 3. Switch to select mode and double-click to navigate to detail page
  //    Save exits edit mode, but we are still in browse mode (browseMode defaults to true).
  //    Toggle from "select mode" (browse) to "browse mode" (select) so that
  //    double-click on a detail node triggers navigation.
  // ==================================================================
  await page.getByRole('button', { name: 'select mode' }).click()
  // Wait for the button to reflect the new mode before double-clicking
  await expect(page.getByRole('button', { name: 'browse mode' })).toBeVisible()

  // Double-click the detail node to enter its detail view
  await page.locator('svg tspan').filter({ hasText: detailLabel }).first().dblclick()
  await expect(page).toHaveURL(/\/noteDetails\/\d+/)

  // Wait for the detail page's SVG graph to render
  await expect(page.getByTestId('note-graph')).toBeVisible()

  // ==================================================================
  // 4-6. In the detail page: add a node, edit it, then delete it
  // ==================================================================
  await createNode(page, childLabel)
  await editNodeLabel(page, childLabel, editedChildLabel)
  await deleteNode(page, editedChildLabel)

  // ==================================================================
  // 7. Navigate back to the directory page
  // ==================================================================
  await page.getByTitle('Go back').click()
  await expect(page).toHaveURL('/')
  await expect(page.getByTestId('note-graph')).toBeVisible()

  // ==================================================================
  // 8. Delete the detail node created in step 2 from the directory page
  // ==================================================================
  await deleteNode(page, detailLabel)
})
