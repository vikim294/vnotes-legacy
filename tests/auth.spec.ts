import { test, expect } from '@playwright/test'

test('simple auth test', async ({ page }) => {
    // Handle the prompt dialog with the correct secret
    page.on('dialog', async (dialog) => {
        expect(dialog.type()).toBe('prompt')
        await dialog.accept(process.env.TEST_SECRET!)
    })

    // 1. Go to home page — should redirect to unauthorized
    await page.goto('/')
    await expect(page.getByText('无权限访问')).toBeVisible()

    // 2. Click "输入密钥" button — triggers prompt, then navigates home
    await page.getByRole('button', { name: '输入密钥' }).click()

    // 3. Verify we're back on the home page
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'edit mode' })).toBeVisible()
})
