import { test } from '@playwright/test'
import { createNode, deleteNode, editNodeLabel, login } from './helpers/vnote'

test.describe('node CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
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
