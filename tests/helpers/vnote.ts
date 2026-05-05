import { expect, type Page } from '@playwright/test'

/**
 * Create a node on the directory page.
 * Enters edit mode, opens the add-node modal, fills the label, optionally
 * checks "detail node", confirms, saves, and verifies the node appears.
 */
export async function createNode(
  page: Page,
  label: string,
  { isDetail = false }: { isDetail?: boolean } = {}
) {
  await page.getByRole('button', { name: 'edit mode' }).click()
  await expect(page.getByRole('button', { name: 'add new node' })).toBeVisible()

  await page.getByRole('button', { name: 'add new node' }).click()
  await expect(page.getByText('添加新结点')).toBeVisible()
  await page.locator('textarea').fill(label)
  if (isDetail) {
    await page.getByLabel('detail node').check()
  }
  await page.getByRole('button', { name: '确认' }).click()
  await page.getByRole('button', { name: 'save' }).click()
  // Save exits edit mode — "edit mode" button confirms save completed
  await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

  // 刷新页面以确保节点已正确保存并显示在 SVG 图中
  await page.reload()
  await expect(page.getByTestId('note-graph')).toBeVisible()
  await expect(page.locator('svg tspan').filter({ hasText: label })).toBeVisible()
}

/**
 * Delete a node on the directory page by its label.
 * Enters edit mode, right-clicks the node, confirms deletion, saves, and
 * verifies the node is gone.
 */
export async function deleteNode(page: Page, label: string) {
  await page.getByRole('button', { name: 'edit mode' }).click()
  await expect(page.getByRole('button', { name: 'add new node' })).toBeVisible()

  await page.locator('svg tspan').filter({ hasText: label }).first().click({ button: 'right' })
  // Right-click opens the NodeMenu — wait for the delete button to appear
  await expect(page.getByRole('button', { name: 'delete' })).toBeVisible()

  await page.getByRole('button', { name: 'delete' }).click()
  await expect(page.getByText('确认要删除该结点吗？')).toBeVisible()
  await page.getByRole('button', { name: '确认' }).click()
  await page.getByRole('button', { name: 'save' }).click()
  await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('note-graph')).toBeVisible()
  await expect(page.locator('svg tspan').filter({ hasText: label })).not.toBeVisible()
}

/**
 * Edit a node's label on the directory page.
 * Enters edit mode, right-clicks the node, opens the edit modal, replaces
 * the label, saves, and verifies both old and new labels.
 */
export async function editNodeLabel(page: Page, oldLabel: string, newLabel: string) {
  await page.getByRole('button', { name: 'edit mode' }).click()
  await expect(page.getByRole('button', { name: 'add new node' })).toBeVisible()

  await page.locator('svg tspan').filter({ hasText: oldLabel }).first().click({ button: 'right' })
  await expect(page.getByRole('button', { name: 'edit text' })).toBeVisible()

  await page.getByRole('button', { name: 'edit text' }).click()
  await expect(page.getByText('编辑结点')).toBeVisible()

  const textarea = page.locator('textarea')
  await textarea.clear()
  await textarea.fill(newLabel)

  await page.getByRole('button', { name: '确认' }).click()
  await page.getByRole('button', { name: 'save' }).click()

  await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('note-graph')).toBeVisible()

  await expect(page.locator('svg tspan').filter({ hasText: newLabel })).toBeVisible()
  await expect(page.locator('svg tspan').filter({ hasText: oldLabel })).not.toBeVisible()
}
