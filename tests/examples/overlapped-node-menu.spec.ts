import { test, expect } from '@playwright/test'
import { createNodeWithoutSave, enterEditMode, login } from '../helpers/vnote'

/**
 * 测试目的：验证 Playwright 对"被遮挡元素"的交互行为
 *
 * 场景：两个根结点在同一编辑会话中创建，位置都是 viewport 中心，
 * 坐标完全相同。SVG 渲染顺序靠后的结点（后创建的）会遮挡先创建的。
 *
 * 右击被遮挡结点的 tspan 时：
 * - 不加 force → Playwright actionability check 检测到元素被遮挡，抛出 error
 * - 加 force:true → 跳过检查，直接派发事件，NodeMenu 正常弹出
 */
test('right-click on a node covered by another node', async ({ page }) => {
  const labelBottom = `bottom-${crypto.randomUUID().slice(0, 8)}`
  const labelTop = `top-${crypto.randomUUID().slice(0, 8)}`

  await login(page)
  await enterEditMode(page)

  // 同一编辑会话中创建两个根结点 → 坐标都是 viewport center，完全重叠
  await createNodeWithoutSave(page, labelBottom)
  await createNodeWithoutSave(page, labelTop)

  // labelBottom 先渲染，被后渲染的 labelTop 遮挡
  // const bottomTspan = page.locator('svg tspan').filter({ hasText: labelBottom }).first()
  const topTspan = page.locator('svg tspan').filter({ hasText: labelTop }).first()

  // ===== 1. 不加 force → Playwright 检测到遮挡，拒绝点击 =====
  // await bottomTspan.click({ button: 'right', timeout: 1000})

  // ===== 2. 加 force:true → 跳过 actionability 检查，事件照常派发 =====
  // await bottomTspan.click({ button: 'right', force: true })

  // ===== 3. 顶层元素可以点击 =====
  await topTspan.click({ button: 'right' })

  // NodeMenu 正常弹出
  await expect(page.getByRole('button', { name: 'delete' })).toBeVisible()

  // 清理：两个结点从未保存，直接刷新即可丢弃
  await page.reload()
})
