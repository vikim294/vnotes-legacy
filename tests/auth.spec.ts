import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test.beforeEach(async ({ page }) => {
    // 打开页面（会自动跳转到 unauthorized）
    await page.goto('/')
    // 等待 unauthorized 页面加载完成
    await expect(page.getByText('无权限访问')).toBeVisible()
  })

  test('输入无效密钥显示错误信息', async ({ page }) => {
    // 使用 page.once 确保 listener 触发一次后自动移除，避免泄漏到后续测试
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt')
      await dialog.accept('123')
    })

    // 点击"输入密钥"按钮触发 prompt
    await page.getByRole('button', { name: '输入密钥' }).click()

    // 等待验证完成，验证错误信息显示
    await expect(page.getByText('密钥无效，请重试')).toBeVisible()
  })

  test('输入正确密钥跳转到首页', async ({ page }) => {
    // 使用 page.once 确保 listener 触发一次后自动移除，避免泄漏到后续测试
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt')
      await dialog.accept(process.env.TEST_SECRET)
    })

    // 点击"输入密钥"按钮触发 prompt
    await page.getByRole('button', { name: '输入密钥' }).click()

    // 等待跳转完成，验证页面 URL 变成首页
    await expect(page).toHaveURL('/')

    // 验证 NoteGraph 组件加载（通过 SVG 元素判断）
    await expect(page.getByTestId('note-graph')).toBeVisible()
  })
})
