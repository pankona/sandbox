import { test, expect } from '@playwright/test';

test.describe('基本的なタスク操作', () => {
    test.beforeEach(async ({ page }) => {
        // テスト前にローカルストレージをクリア
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    test('クイック追加でタスクを作成できる', async ({ page }) => {
        await page.goto('/');

        // タスクを追加
        await page.fill('#quickTaskTitle', 'テストタスク1');
        await page.press('#quickTaskTitle', 'Enter');

        // タスクが表示されていることを確認
        const taskTitle = await page.locator('.task-item h3 span').textContent();
        expect(taskTitle?.trim()).toContain('テストタスク1');
    });

    test('タスクを編集できる', async ({ page }) => {
        await page.goto('/');

        // タスクを追加
        await page.fill('#quickTaskTitle', 'テストタスク2');
        await page.press('#quickTaskTitle', 'Enter');

        // 編集ダイアログを開く
        await page.locator('.task-item h3 span').click();
        await page.waitForSelector('dialog[open]');

        // タスク情報を編集
        await page.fill('#taskTitle', '編集後のタスク');
        await page.selectOption('#taskSize', 'small');
        await page.selectOption('#taskImportance', 'high');

        // フォームを送信
        await page.click('dialog form button[type="submit"]');
        await page.waitForSelector('dialog[open]', { state: 'detached' });

        // 編集後の内容を確認（少し待機して更新を確認）
        await page.waitForTimeout(500);
        const taskTitle = await page.locator('.task-item h3 span').textContent();
        expect(taskTitle?.trim()).toBe('編集後のタスク');

        const taskMeta = await page.locator('.task-meta').textContent();
        expect(taskMeta).toContain('小');
        expect(taskMeta).toContain('高');
    });

    test('タスクのステータスを変更できる', async ({ page }) => {
        await page.goto('/');

        // タスクを追加
        await page.fill('#quickTaskTitle', 'ステータス変更テスト');
        await page.press('#quickTaskTitle', 'Enter');

        // タスクを開始
        await page.locator('button[data-tooltip="開始"]').first().click();

        // 進行中リストに移動していることを確認
        await page.waitForSelector('#inProgressTasks .task-item');
        const inProgressTask = await page.locator('#inProgressTasks .task-item h3 span').textContent();
        expect(inProgressTask?.trim()).toBe('ステータス変更テスト');

        // タスクを完了
        await page.locator('button[data-tooltip="完了"]').first().click();

        // 完了リストに移動していることを確認
        const taskId = await page.locator('#completedTasks .task-item').first().getAttribute('data-id');
        expect(taskId).toBeTruthy();
        const completedTask = await page.locator(`[data-id="${taskId}"] h3 span`).textContent();
        expect(completedTask?.trim()).toBe('ステータス変更テスト');
    });

    test('タスクを削除できる', async ({ page }) => {
        await page.goto('/');

        // タスクを追加
        await page.fill('#quickTaskTitle', '削除するタスク');
        await page.press('#quickTaskTitle', 'Enter');

        // 削除前にタスクが存在することを確認
        await page.waitForSelector('.task-item');
        let taskExists = await page.locator('.task-item').isVisible();
        expect(taskExists).toBeTruthy();

        // 削除ボタンをクリック（確認ダイアログをOKにする）
        page.on('dialog', dialog => dialog.accept());
        await page.locator('button[data-tooltip="削除"]').first().click();

        // タスクが削除されたことを確認
        await page.waitForTimeout(500);
        taskExists = await page.locator('.task-item').isVisible();
        expect(taskExists).toBeFalsy();
    });
});