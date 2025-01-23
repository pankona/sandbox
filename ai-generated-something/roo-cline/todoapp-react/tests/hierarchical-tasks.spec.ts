import { test, expect, Page } from '@playwright/test';

test.describe('階層構造のタスク操作', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.clear());
        await page.reload();
    });

    async function addChildTask(page: Page, title: string) {
        // 最初のタスクの子タスク追加ボタンを特定
        const firstTask = await page.locator('#backlogTasks .task-item').first();
        const taskId = await firstTask.getAttribute('data-id');
        if (!taskId) throw new Error('Task ID not found');

        await page.locator(`#add-child-${taskId}`).click();

        await page.waitForSelector('dialog[open]');
        await page.fill('#taskTitle', title);

        // フォームを送信
        await page.click('dialog form button[type="submit"]');
        await page.waitForSelector('dialog[open]', { state: 'detached' });

        // DOMの更新を待機
        await page.waitForTimeout(1000);
    }

    async function getTaskId(page: Page, taskTitle: string): Promise<string> {
        await page.waitForSelector(`.task-item:has-text("${taskTitle}")`, { timeout: 10000 });
        const task = await page.locator('.task-item').filter({ hasText: taskTitle }).first();
        const taskId = await task.getAttribute('data-id');
        if (!taskId) throw new Error(`Task ID not found for task: ${taskTitle}`);
        return taskId;
    }

    test('親タスクに子タスクを追加できる', async ({ page }) => {
        await page.goto('/');

        // 親タスクを作成
        await page.fill('#quickTaskTitle', '親タスク');
        await page.press('#quickTaskTitle', 'Enter');
        await page.waitForSelector('.task-item');

        // 子タスクを追加
        await addChildTask(page, '子タスク1');

        // 親タスクと子タスクが表示されていることを確認
        await page.waitForSelector('.task-item >> nth=1');
        const tasks = await page.locator('.task-item h3 span').allTextContents();
        expect(tasks[0].trim()).toBe('親タスク');
        expect(tasks[1].trim()).toBe('子タスク1');
    });

    test('子タスクの状態変更が親タスクに反映される', async ({ page }) => {
        await page.goto('/');

        // 親タスクを作成
        await page.fill('#quickTaskTitle', '親タスク');
        await page.press('#quickTaskTitle', 'Enter');
        await page.waitForSelector('.task-item');

        // 子タスク1を追加
        await addChildTask(page, '子タスク1');

        // 子タスク2を追加
        await addChildTask(page, '子タスク2');

        // 子タスク1を開始
        const childTask1Id = await getTaskId(page, '子タスク1');
        await page.waitForSelector(`#start-${childTask1Id}`, { state: 'visible', timeout: 10000 });
        await page.locator(`#start-${childTask1Id}`).click();

        // 親タスクが「子タスク進行中」状態になっていることを確認
        await page.waitForSelector('.status-badge');
        const parentTaskStatus = await page.locator('#backlogTasks .task-item').first().locator('.status-badge').textContent();
        expect(parentTaskStatus?.trim()).toBe('👉 子タスク進行中');

        // 子タスク1を完了
        await page.locator('#inProgressTasks .task-item')
            .locator('button[data-tooltip="完了"]').click();

        // 子タスク2を開始して完了
        const childTask2Id = await getTaskId(page, '子タスク2');
        await page.waitForSelector(`#start-${childTask2Id}`, { state: 'visible', timeout: 10000 });
        await page.locator(`#start-${childTask2Id}`).click();
        await page.locator('#inProgressTasks .task-item')
            .locator('button[data-tooltip="完了"]').click();

        // すべての子タスクが完了したら親タスクはbacklogに戻ることを確認
        await page.waitForSelector('#backlogTasks .task-item');
        const parentTaskAfterCompletion = await page.locator('#backlogTasks .task-item').first().textContent();
        expect(parentTaskAfterCompletion).toContain('親タスク');
        expect(parentTaskAfterCompletion).not.toContain('子タスク進行中');
    });

    test('タスクの折りたたみ機能が動作する', async ({ page }) => {
        await page.goto('/');

        // 親タスクを作成
        await page.fill('#quickTaskTitle', '親タスク');
        await page.press('#quickTaskTitle', 'Enter');
        await page.waitForSelector('.task-item');

        // 子タスクを2つ追加
        await addChildTask(page, '子タスク1');
        await addChildTask(page, '子タスク2');

        // 子タスク1のIDを取得して要素を特定
        const childTask1Id = await getTaskId(page, '子タスク1');
        const childTask1 = page.locator(`[data-id="${childTask1Id}"]`);

        // 初期状態で子タスクが表示されていることを確認
        expect(await childTask1.isVisible()).toBeTruthy();

        // 親タスクの折りたたみボタンをクリック
        const parentTaskId = await getTaskId(page, '親タスク');
        await page.waitForSelector(`#toggle-${parentTaskId}`, { timeout: 10000 });
        await page.locator(`#toggle-${parentTaskId}`).click();
        await page.waitForTimeout(1000);

        // 子タスクが非表示になっていることを確認
        expect(await childTask1.isVisible()).toBeFalsy();

        // 再度展開
        await page.locator(`#toggle-${parentTaskId}`).click();
        await page.waitForTimeout(1000);

        // 子タスクが再表示されていることを確認
        expect(await childTask1.isVisible()).toBeTruthy();
    });

    test('親タスクを削除すると子タスクも削除される', async ({ page }) => {
        await page.goto('/');

        // 親タスクを作成
        await page.fill('#quickTaskTitle', '親タスク');
        await page.press('#quickTaskTitle', 'Enter');
        await page.waitForSelector('.task-item');

        // 子タスクを追加
        await addChildTask(page, '子タスク1');

        // 削除前に両方のタスクが存在することを確認
        await page.waitForSelector('.task-item >> nth=1');
        const tasks = await page.locator('.task-item h3 span').allTextContents();
        expect(tasks[0].trim()).toBe('親タスク');
        expect(tasks[1].trim()).toBe('子タスク1');

        // 親タスクを削除（確認ダイアログをOKにする）
        page.on('dialog', dialog => dialog.accept());
        const parentTaskId = await getTaskId(page, '親タスク');
        await page.waitForSelector(`#delete-${parentTaskId}`, { timeout: 10000 });
        await page.locator(`#delete-${parentTaskId}`).click();

        // 親タスクと子タスクが両方とも削除されていることを確認
        await page.waitForTimeout(1000);
        const remainingTasks = await page.locator('#backlogTasks').textContent();
        expect(remainingTasks).not.toContain('親タスク');
        expect(remainingTasks).not.toContain('子タスク1');
    });
});