import { test, expect } from '@playwright/test'
import { createNode, deleteNode, editNodeLabel } from './helpers/vnote'

test.describe('node CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Each test gets its own page, so page.on does not leak across tests
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt')
      await dialog.accept(process.env.TEST_SECRET!)
    })

    await page.goto('/')
    await page.getByRole('button', { name: '输入密钥' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()

    await expect(page.getByTestId('note-graph')).toBeVisible()
  })

  test.describe('directory node CRUD', () => {
    test('add directory node', async ({ page }) => {
      const label = `dir-node-${crypto.randomUUID()}`
      await createNode(page, label)
      await deleteNode(page, label)
    })

    test('edit directory node label', async ({ page }) => {
      const originalLabel = `dir-edit-orig-${crypto.randomUUID()}`
      const newLabel = `dir-edit-new-${crypto.randomUUID()}`

      await createNode(page, originalLabel)
      await editNodeLabel(page, originalLabel, newLabel)
      await deleteNode(page, newLabel)
    })

    // add test 的 cleanup 已覆盖删除流程，无需单独 delete test
  })

  test.describe('detail node CRUD', () => {
    test('add detail node', async ({ page }) => {
      const label = `detail-node-${crypto.randomUUID()}`
      await createNode(page, label, { isDetail: true })
      await deleteNode(page, label)
    })

    test('edit detail node label', async ({ page }) => {
      const originalLabel = `detail-edit-orig-${crypto.randomUUID()}`
      const newLabel = `detail-edit-new-${crypto.randomUUID()}`

      await createNode(page, originalLabel, { isDetail: true })
      await editNodeLabel(page, originalLabel, newLabel)
      await deleteNode(page, newLabel)
    })

    // add test 的 cleanup 已覆盖删除流程，无需单独 delete test
  })
})
