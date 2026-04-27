import { test, expect } from '@playwright/test'

test('输入无效密钥显示错误信息', async ({ page }) => {
    // 监听 dialog 事件并输入密钥
    page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt')
        await dialog.accept('123')
    })

    // 打开页面（会自动跳转到 unauthorized）
    await page.goto('http://localhost:5173/')

    // 等待页面加载完成
    await expect(page.getByText('无权限访问')).toBeVisible()

    // 点击"输入密钥"按钮触发 prompt
    await page.getByRole('button', { name: '输入密钥' }).click()

    // 等待验证完成，验证错误信息显示
    await expect(page.getByText('密钥无效，请重试')).toBeVisible()
})

test('输入正确密钥跳转到首页', async ({ page }) => {
    // 监听 dialog 事件并输入正确密钥
    page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt')
        await dialog.accept('vikim294')
    })

    // 打开页面（会自动跳转到 unauthorized）
    await page.goto('http://localhost:5173/')

    // 等待页面加载完成
    await expect(page.getByText('无权限访问')).toBeVisible()

    // 点击"输入密钥"按钮触发 prompt
    await page.getByRole('button', { name: '输入密钥' }).click()

    // 等待跳转完成，验证页面 URL 变成首页
    await expect(page).toHaveURL('http://localhost:5173/')

    // 验证 NoteGraph 组件加载（通过 SVG 元素判断）
    await expect(page.locator('svg')).toBeVisible()
})

test('进入编辑模式并创建 detail node', async ({ page }) => {
    // 监听 dialog 事件并输入正确密钥
    page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt')
        await dialog.accept('vikim294')
    })

    // 打开页面
    await page.goto('http://localhost:5173/')

    // 等待验证完成并跳转到首页
    await page.getByRole('button', { name: '输入密钥' }).click()
    await expect(page).toHaveURL('http://localhost:5173/')

    // 等待 SVG 加载完成
    await expect(page.locator('svg')).toBeVisible()

    // 1. 点击 edit mode 按钮
    await page.getByRole('button', { name: 'edit mode' }).click()

    // 2. 点击 add new node 按钮
    await page.getByRole('button', { name: 'add new node' }).click()

    // 3. 等待 modal 弹出，输入 "test detail node"
    await expect(page.getByText('添加新结点')).toBeVisible()
    await page.locator('textarea').fill('test detail node')

    // 4. 勾选 detail node 复选框
    await page.getByLabel('detail node').check()

    // 5. 点击确认按钮，modal 关闭
    await page.getByRole('button', { name: '确认' }).click()

    // 6. 点击 save 按钮保存
    await page.getByRole('button', { name: 'save' }).click()

    // 7. 验证结点被创建 - 在 SVG 的 tspan 中查找文本，增加超时时间以等待网络请求完成
    await expect(page.locator('svg tspan').filter({ hasText: 'test detail node' })).toBeVisible({
        timeout: 15000,
    })

    // 8. 删除流程：再次点击 edit mode 进入编辑模式
    await page.getByRole('button', { name: 'edit mode' }).click()

    // 9. 右击要删除的结点（包含 "test detail node" 文本的结点）
    const nodeToDelete = page.locator('svg tspan').filter({ hasText: 'test detail node' })
    await nodeToDelete.click({ button: 'right' })

    // 10. 等待 NodeMenu 弹出，点击 delete 按钮
    await page.getByRole('button', { name: 'delete' }).click()

    // 11. 等待确认删除 modal 弹出，点击确认
    await expect(page.getByText('确认要删除该结点吗？')).toBeVisible()
    await page.getByRole('button', { name: '确认' }).click()

    // 12. 点击 save 按钮保存删除操作
    await page.getByRole('button', { name: 'save' }).click()

    // 13. 验证结点已被删除 - 检查该文本不再存在于 SVG 中
    await expect(page.locator('svg tspan').filter({ hasText: 'test detail node' })).not.toBeVisible(
        {
            timeout: 15000,
        }
    )
})
