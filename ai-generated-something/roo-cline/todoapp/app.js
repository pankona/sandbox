class Task {
    constructor(title, size, importance, dueDate, description) {
        this.id = Date.now().toString();
        this.title = title;
        this.size = size;
        this.importance = importance;
        this.dueDate = dueDate;
        this.description = description;
        this.status = 'backlog'; // backlog, in_progress, completed
        this.completedDate = null;
        this.achievement = '';
    }
}

class TodoApp {
    constructor() {
        this.tasks = [];
        this.loadTasks();
        this.setupEventListeners();
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks).map(task => ({
                ...task,
                status: task.status || 'backlog' // 既存タスクのstatusを保証
            }));
        }
        this.renderTasks();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(title, size, importance, dueDate, description) {
        const task = new Task(
            title,
            size || null,
            importance || null,
            dueDate || null,
            description || ''
        );
        task.status = 'backlog';
        this.tasks.unshift(task); // 新しいタスクを配列の先頭に追加
        this.saveTasks();
        this.renderTasks();
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
            <form class="task-form" method="dialog">
                <div class="form-group">
                    <label for="editTaskTitle">タスク名</label>
                    <input type="text" id="editTaskTitle" value="${task.title}" required>
                </div>
                <div class="form-group">
                    <label for="editTaskSize">タスクサイズ</label>
                    <select id="editTaskSize">
                        <option value="">未設定</option>
                        <option value="small" ${task.size === 'small' ? 'selected' : ''}>小さい（一瞬で終わる）</option>
                        <option value="large" ${task.size === 'large' ? 'selected' : ''}>大きい（時間がかかる）</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editTaskImportance">重要度</label>
                    <select id="editTaskImportance">
                        <option value="">未設定</option>
                        <option value="high" ${task.importance === 'high' ? 'selected' : ''}>重要</option>
                        <option value="low" ${task.importance === 'low' ? 'selected' : ''}>サイドクエスト</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editTaskDueDate">期限</label>
                    <input type="date" id="editTaskDueDate" value="${task.dueDate || ''}" min="2025-01-21">
                </div>
                <div class="form-group">
                    <label for="editTaskDescription">詳細説明</label>
                    <textarea id="editTaskDescription" rows="3">${task.description || ''}</textarea>
                </div>
                <div class="dialog-buttons">
                    <button type="submit" class="btn">保存</button>
                    <button type="button" class="btn btn-cancel" onclick="this.closest('dialog').close()">キャンセル</button>
                </div>
            </form>
        `;

        document.body.appendChild(dialog);
        dialog.addEventListener('close', () => {
            if (dialog.returnValue !== 'cancel') {
                task.title = document.getElementById('editTaskTitle').value;
                task.size = document.getElementById('editTaskSize').value || null;
                task.importance = document.getElementById('editTaskImportance').value || null;
                task.dueDate = document.getElementById('editTaskDueDate').value || null;
                task.description = document.getElementById('editTaskDescription').value || '';
                this.saveTasks();
                this.renderTasks();
            }
            dialog.remove();
        });

        dialog.showModal();
    }

    startTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status === 'backlog') {
            task.status = 'in_progress';
            this.saveTasks();
            this.renderTasks();
        }
    }

    revertTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status === 'in_progress') {
            task.status = 'backlog';
            this.saveTasks();
            this.renderTasks();
        }
    }

    completeTask(taskId, achievement = '') {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status === 'in_progress') {
            task.status = 'completed';
            task.completedDate = new Date().toISOString();
            task.achievement = achievement;
            this.saveTasks();
            this.renderTasks();
        }
    }

    reopenTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status === 'completed') {
            task.status = 'in_progress';
            task.completedDate = null;
            task.achievement = '';
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        if (confirm('このタスクを削除してもよろしいですか？')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    renderTasks() {
        const backlogTasksEl = document.getElementById('backlogTasks');
        const inProgressTasksEl = document.getElementById('inProgressTasks');
        const completedTasksEl = document.getElementById('completedTasks');

        // Backlogタスクの表示
        const backlogTasks = this.tasks.filter(task => task.status === 'backlog');
        backlogTasksEl.innerHTML = backlogTasks.map(task => this.createTaskHTML(task)).join('');

        // 進行中のタスクの表示
        const inProgressTasks = this.tasks.filter(task => task.status === 'in_progress');
        inProgressTasksEl.innerHTML = inProgressTasks.map(task => this.createTaskHTML(task)).join('');

        // 完了タスクの表示
        const completedTasks = this.tasks.filter(task => task.status === 'completed')
            .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
        completedTasksEl.innerHTML = completedTasks.map(task => this.createCompletedTaskHTML(task)).join('');
    }

    createTaskHTML(task) {
        const taskActions = this.createTaskActions(task);
        return `
            <div class="task-item" data-id="${task.id}">
                <div class="task-content">
                    <h3 onclick="app.editTask('${task.id}')" style="cursor: pointer;">${task.title}</h3>
                    <div class="task-meta">
                        ${task.size ? `<p>📏 ${task.size === 'small' ? '小' : '大'}</p>` : ''}
                        ${task.importance ? `<p>🎯 ${task.importance === 'high' ? '高' : '低'}</p>` : ''}
                        ${task.dueDate ? `<p>📅 ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                        <div class="task-actions">
                            ${taskActions}
                            <button onclick="app.deleteTask('${task.id}')" class="icon-button" data-tooltip="削除">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createTaskActions(task) {
        if (task.status === 'backlog') {
            return `<button onclick="app.startTask('${task.id}')" class="icon-button" data-tooltip="開始">▶️</button>`;
        } else if (task.status === 'in_progress') {
            return `
                <button onclick="app.revertTask('${task.id}')" class="icon-button" data-tooltip="Backlogに戻す">⏪</button>
                <button onclick="app.showCompleteDialog('${task.id}')" class="icon-button" data-tooltip="完了">✅</button>
            `;
        }
        return '';
    }

    createCompletedTaskHTML(task) {
        return `
            <div class="task-item completed">
                <div class="task-content">
                    <h3 onclick="app.editTask('${task.id}')" style="cursor: pointer;">${task.title}</h3>
                    <div class="task-meta">
                        <p>✅ ${new Date(task.completedDate).toLocaleDateString()}</p>
                        ${task.size ? `<p>📏 ${task.size === 'small' ? '小' : '大'}</p>` : ''}
                        ${task.importance ? `<p>🎯 ${task.importance === 'high' ? '高' : '低'}</p>` : ''}
                        ${task.dueDate ? `<p>📅 ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                        <div class="task-actions">
                            <button onclick="app.reopenTask('${task.id}')" class="icon-button" data-tooltip="進行中に戻す">🔄</button>
                            <button onclick="app.deleteTask('${task.id}')" class="icon-button" data-tooltip="削除">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showCompleteDialog(taskId) {
        const achievement = prompt('実績を入力してください（任意）:');
        this.completeTask(taskId, achievement);
    }

    setupEventListeners() {
        const quickAddForm = document.getElementById('quickAddForm');
        const toggleButton = document.getElementById('toggleCompleted');
        const completedTasksContainer = document.getElementById('completedTasks');

        // クイック追加フォームのイベントリスナー
        quickAddForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const quickTaskTitle = document.getElementById('quickTaskTitle');
            const title = quickTaskTitle.value.trim();

            if (title) {
                this.addTask(title);
                quickTaskTitle.value = '';
            }
        });

        // 完了タスクの表示/非表示切り替え
        toggleButton.addEventListener('click', () => {
            completedTasksContainer.classList.toggle('hidden');
            toggleButton.textContent = completedTasksContainer.classList.contains('hidden') ? '履歴を表示' : '履歴を非表示';
        });
    }
}

// アプリケーションの初期化
const app = new TodoApp();