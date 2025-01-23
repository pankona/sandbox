const { test, expect } = require('@playwright/test');

test.describe('階層構造のタスク操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  async function addChildTask(page, title) {
    // 最初の子タスク追加ボタンを特定
    await page.locator('.task-item').first()
      .locator('button[data-tooltip="子タスク追加"]').click();

    await page.waitForSelector('dialog[open]');
    await page.fill('#childTaskTitle', title);

    // フォームを送信
    await page.click('dialog form button[type="submit"]');
    await page.waitForSelector('dialog[open]', { state: 'detached' });

    // DOMの更新を待機
    await page.waitForTimeout(500);
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
    await page.waitForSelector('.task-item >> text=子タスク1');
    await page.locator('.task-item').filter({ hasText: '子タスク1' })
      .locator('button[data-tooltip="開始"]').first().click();

    // 親タスクが「子タスク進行中」状態になっていることを確認
    await page.waitForSelector('.status-badge');
    const parentTaskStatus = await page.locator('.task-item').first().locator('.status-badge').textContent();
    expect(parentTaskStatus.trim()).toBe('👉 子タスク進行中');

    // 子タスク1を完了
    await page.locator('#inProgressTasks .task-item')
      .locator('button[data-tooltip="完了"]').first().click();

    // 子タスク2を開始して完了
    await page.locator('.task-item').filter({ hasText: '子タスク2' })
      .locator('button[data-tooltip="開始"]').first().click();
    await page.locator('#inProgressTasks .task-item')
      .locator('button[data-tooltip="完了"]').first().click();

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

    // 初期状態で子タスクが表示されていることを確認
    await page.waitForSelector('.task-item >> text=子タスク1');
    const childTask1 = await page.locator('.task-item').filter({ hasText: '子タスク1' });
    expect(await childTask1.isVisible()).toBeTruthy();

    // 折りたたみボタンをクリック
    await page.locator('.task-item').first().locator('button.icon-button[data-tooltip="折りたたむ"]').click();
    await page.waitForTimeout(500);

    // 子タスクが非表示になっていることを確認
    expect(await childTask1.isVisible()).toBeFalsy();

    // 再度展開
    await page.locator('.task-item').first().locator('button.icon-button[data-tooltip="展開"]').click();
    await page.waitForTimeout(500);

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
    await page.locator('.task-item').first()
      .locator('button[data-tooltip="削除"]').first().click();

    // 親タスクと子タスクが両方とも削除されていることを確認
    await page.waitForTimeout(500);
    const remainingTasks = await page.locator('#backlogTasks').textContent();
    expect(remainingTasks).not.toContain('親タスク');
    expect(remainingTasks).not.toContain('子タスク1');
  });
});