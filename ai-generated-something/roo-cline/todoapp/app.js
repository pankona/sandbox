class Task {
    constructor(title, size, importance, dueDate, description) {
        this.id = Date.now().toString();
        this.title = title;
        this.size = size;
        this.importance = importance;
        this.dueDate = dueDate;
        this.description = description;
        this.status = 'backlog'; // backlog, in_progress, completed, has_in_progress_child
        this.completedDate = null;
        this.achievement = '';
        this.parentId = null;
        this.childIds = [];
        this.isCollapsed = false; // 折りたたみ状態を追加
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
                status: task.status || 'backlog',
                parentId: task.parentId || null,
                childIds: task.childIds || [],
                isCollapsed: task.isCollapsed || false
            }));
        }
        this.renderTasks();
    }

    toggleCollapse(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.isCollapsed = !task.isCollapsed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addTask(title, size, importance, dueDate, description, parentId = null) {
        const task = new Task(
            title,
            size || null,
            importance || null,
            dueDate || null,
            description || ''
        );
        task.parentId = parentId;
        
        if (parentId) {
            const parentTask = this.tasks.find(t => t.id === parentId);
            if (parentTask) {
                parentTask.childIds.push(task.id);
                // 親タスクが進行中だった場合、子タスクを追加することで親タスク化されるので
                // 状態を「子が進行中」に変更
                if (parentTask.status === 'in_progress') {
                    parentTask.status = 'has_in_progress_child';
                }
            }
        }

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
    }

    addChildTask(parentId) {
        const parentTask = this.tasks.find(t => t.id === parentId);
        if (!parentTask) return;

        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
            <form class="task-form" method="dialog">
                <h3>${parentTask.title}の子タスク追加</h3>
                <div class="form-group">
                    <label for="childTaskTitle">タスク名</label>
                    <input type="text" id="childTaskTitle" required>
                </div>
                <div class="form-group">
                    <label for="childTaskSize">タスクサイズ</label>
                    <select id="childTaskSize">
                        <option value="">未設定</option>
                        <option value="small">小（30分以内）</option>
                        <option value="medium">中（2時間以内）</option>
                        <option value="large">大（半日以上）</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="childTaskImportance">重要度</label>
                    <select id="childTaskImportance">
                        <option value="">未設定</option>
                        <option value="low">低（後回しOK）</option>
                        <option value="medium">中（普通）</option>
                        <option value="high">高（優先）</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="childTaskDueDate">期限</label>
                    <input type="date" id="childTaskDueDate" min="2025-01-21">
                </div>
                <div class="form-group">
                    <label for="childTaskDescription">詳細説明</label>
                    <textarea id="childTaskDescription" rows="3"></textarea>
                </div>
                <div class="dialog-buttons">
                    <button type="submit" class="btn">追加</button>
                    <button type="button" class="btn btn-cancel" onclick="this.closest('dialog').close()">キャンセル</button>
                </div>
            </form>
        `;

        document.body.appendChild(dialog);
        dialog.addEventListener('close', () => {
            if (dialog.returnValue !== 'cancel') {
                const title = document.getElementById('childTaskTitle').value;
                const size = document.getElementById('childTaskSize').value;
                const importance = document.getElementById('childTaskImportance').value;
                const dueDate = document.getElementById('childTaskDueDate').value;
                const description = document.getElementById('childTaskDescription').value;

                this.addTask(title, size, importance, dueDate, description, parentId);
            }
            dialog.remove();
        });

        dialog.showModal();
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
                        <option value="small" ${task.size === 'small' ? 'selected' : ''}>小（30分以内）</option>
                        <option value="medium" ${task.size === 'medium' ? 'selected' : ''}>中（2時間以内）</option>
                        <option value="large" ${task.size === 'large' ? 'selected' : ''}>大（半日以上）</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editTaskImportance">重要度</label>
                    <select id="editTaskImportance">
                        <option value="">未設定</option>
                        <option value="low" ${task.importance === 'low' ? 'selected' : ''}>低（後回しOK）</option>
                        <option value="medium" ${task.importance === 'medium' ? 'selected' : ''}>中（普通）</option>
                        <option value="high" ${task.importance === 'high' ? 'selected' : ''}>高（優先）</option>
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

    isLeafTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        return task && task.childIds.length === 0;
    }

    startTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'backlog') return;

        // 末端タスク（子を持たないタスク）のみ進行中にできる
        if (!this.isLeafTask(taskId)) {
            alert('子タスクを持つタスクは直接進行中にできません。子タスクを進行中にしてください。');
            return;
        }

        task.status = 'in_progress';

        // 親タスクがある場合、その状態を「子が進行中」に変更
        if (task.parentId) {
            let currentParent = this.tasks.find(t => t.id === task.parentId);
            while (currentParent) {
                currentParent.status = 'has_in_progress_child';
                currentParent = this.tasks.find(t => t.id === currentParent.parentId);
            }
        }

        this.saveTasks();
        this.renderTasks();
    }

    revertTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'in_progress') return;

        task.status = 'backlog';

        // 親タスクの状態を更新
        if (task.parentId) {
            let currentParent = this.tasks.find(t => t.id === task.parentId);
            while (currentParent) {
                // 他に進行中の子タスクがあるかチェック
                const hasOtherInProgressChild = this.hasInProgressDescendant(currentParent.id, taskId);
                if (!hasOtherInProgressChild) {
                    currentParent.status = 'backlog';
                }
                currentParent = this.tasks.find(t => t.id === currentParent.parentId);
            }
        }

        this.saveTasks();
        this.renderTasks();
    }

    hasInProgressDescendant(taskId, excludeTaskId = null) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return false;

        return task.childIds.some(childId => {
            if (childId === excludeTaskId) return false;
            const child = this.tasks.find(t => t.id === childId);
            return child.status === 'in_progress' || 
                   child.status === 'has_in_progress_child' ||
                   this.hasInProgressDescendant(childId, excludeTaskId);
        });
    }

    completeTask(taskId, achievement = '') {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'in_progress') return;

        task.status = 'completed';
        task.completedDate = new Date().toISOString();
        task.achievement = achievement;

        // 親タスクの状態を更新
        if (task.parentId) {
            let currentParent = this.tasks.find(t => t.id === task.parentId);
            while (currentParent) {
                // 他に進行中の子タスクがあるかチェック
                const hasOtherInProgressChild = this.hasInProgressDescendant(currentParent.id, taskId);
                if (!hasOtherInProgressChild) {
                    currentParent.status = 'backlog';
                }
                currentParent = this.tasks.find(t => t.id === currentParent.parentId);
            }
        }

        this.saveTasks();
        this.renderTasks();
    }

    reopenTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'completed') return;

        task.status = 'in_progress';
        task.completedDate = null;
        task.achievement = '';

        // 親タスクの状態を更新
        if (task.parentId) {
            let currentParent = this.tasks.find(t => t.id === task.parentId);
            while (currentParent) {
                currentParent.status = 'has_in_progress_child';
                currentParent = this.tasks.find(t => t.id === currentParent.parentId);
            }
        }

        this.saveTasks();
        this.renderTasks();
    }

    deleteTask(taskId) {
        if (!confirm('このタスクを削除してもよろしいですか？\n※子タスクも全て削除されます')) return;

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // 再帰的に子タスクを削除
        const deleteTaskAndChildren = (id) => {
            const taskToDelete = this.tasks.find(t => t.id === id);
            if (!taskToDelete) return;

            // 子タスクを再帰的に削除
            taskToDelete.childIds.forEach(childId => {
                deleteTaskAndChildren(childId);
            });

            // 親タスクの childIds から削除
            if (taskToDelete.parentId) {
                const parentTask = this.tasks.find(t => t.id === taskToDelete.parentId);
                if (parentTask) {
                    parentTask.childIds = parentTask.childIds.filter(id => id !== taskToDelete.id);
                }
            }

            // タスクを削除
            this.tasks = this.tasks.filter(t => t.id !== id);
        };

        deleteTaskAndChildren(taskId);
        this.saveTasks();
        this.renderTasks();
    }

    renderTasks() {
        const backlogTasksEl = document.getElementById('backlogTasks');
        const inProgressTasksEl = document.getElementById('inProgressTasks');
        const completedTasksEl = document.getElementById('completedTasks');

        // ルートタスク（親を持たないタスク）のみを取得
        const rootTasks = this.tasks.filter(task => !task.parentId);

        // Backlogタスクの表示
        const backlogTasks = rootTasks.filter(task => 
            task.status === 'backlog' || task.status === 'has_in_progress_child'
        );
        backlogTasksEl.innerHTML = backlogTasks.map(task => 
            this.createTaskHTML(task, 0)
        ).join('');

        // 進行中のタスクの表示（末端タスクのみ）
        const inProgressTasks = this.tasks.filter(task => task.status === 'in_progress');
        inProgressTasksEl.innerHTML = inProgressTasks.map(task => 
            this.createTaskHTML(task, 0)
        ).join('');

        // 完了タスクの表示
        const completedTasks = rootTasks.filter(task => task.status === 'completed')
            .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
        completedTasksEl.innerHTML = completedTasks.map(task => 
            this.createCompletedTaskHTML(task, 0)
        ).join('');
    }

    createTaskHTML(task, depth = 0) {
        const taskActions = this.createTaskActions(task);
        const childTasks = task.childIds
            .map(childId => this.tasks.find(t => t.id === childId))
            .filter(Boolean);

        const statusBadge = task.status === 'has_in_progress_child'
            ? '<span class="status-badge">👉 子タスク進行中</span>'
            : '';

        // 折りたたみボタンを追加（子タスクがある場合のみ）
        const collapseButton = childTasks.length > 0
            ? `<button onclick="event.stopPropagation(); app.toggleCollapse('${task.id}')" class="icon-button" data-tooltip="${task.isCollapsed ? '展開' : '折りたたむ'}">
                ${task.isCollapsed ? '📂' : '📁'}
               </button>`
            : '';

        const taskHtml = `
            <div class="task-item" data-id="${task.id}" style="margin-left: ${depth * 20}px;">
                <div class="task-content">
                    <h3>
                        ${collapseButton}
                        <span onclick="app.editTask('${task.id}')" style="cursor: pointer;">
                            ${task.title} ${statusBadge}
                        </span>
                    </h3>
                    <div class="task-meta">
                        ${task.size ? `<p>📏 ${task.size === 'small' ? '小' :
                            task.size === 'medium' ? '中' : '大'
                        }</p>` : ''}
                        ${task.importance ? `<p>🎯 ${task.importance === 'low' ? '低' :
                            task.importance === 'medium' ? '中' : '高'
                        }</p>` : ''}
                        ${task.dueDate ? `<p>📅 ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                        <div class="task-actions">
                            ${taskActions}
                            <button onclick="app.addChildTask('${task.id}')" class="icon-button" data-tooltip="子タスク追加">➕</button>
                            <button onclick="app.deleteTask('${task.id}')" class="icon-button" data-tooltip="削除">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
            ${!task.isCollapsed ? childTasks.map(childTask => this.createTaskHTML(childTask, depth + 1)).join('') : ''}
        `;

        return taskHtml;
    }

    createTaskActions(task) {
        if (task.status === 'backlog') {
            // 末端タスクの場合のみ開始ボタンを表示
            return this.isLeafTask(task.id) 
                ? `<button onclick="app.startTask('${task.id}')" class="icon-button" data-tooltip="開始">▶️</button>`
                : '';
        } else if (task.status === 'in_progress') {
            return `
                <button onclick="app.revertTask('${task.id}')" class="icon-button" data-tooltip="Backlogに戻す">⏪</button>
                <button onclick="app.showCompleteDialog('${task.id}')" class="icon-button" data-tooltip="完了">✅</button>
            `;
        }
        return '';
    }

    createCompletedTaskHTML(task, depth = 0) {
        const childTasks = task.childIds
            .map(childId => this.tasks.find(t => t.id === childId))
            .filter(t => t && t.status === 'completed');

        // 折りたたみボタンを追加（完了した子タスクがある場合のみ）
        const collapseButton = childTasks.length > 0
            ? `<button onclick="event.stopPropagation(); app.toggleCollapse('${task.id}')" class="icon-button" data-tooltip="${task.isCollapsed ? '展開' : '折りたたむ'}">
                ${task.isCollapsed ? '📂' : '📁'}
               </button>`
            : '';

        const taskHtml = `
            <div class="task-item completed" style="margin-left: ${depth * 20}px;">
                <div class="task-content">
                    <h3>
                        ${collapseButton}
                        <span onclick="app.editTask('${task.id}')" style="cursor: pointer;">
                            ${task.title}
                        </span>
                    </h3>
                    <div class="task-meta">
                        <p>✅ ${new Date(task.completedDate).toLocaleDateString()}</p>
                        ${task.size ? `<p>📏 ${task.size === 'small' ? '小' :
                            task.size === 'medium' ? '中' : '大'
                        }</p>` : ''}
                        ${task.importance ? `<p>🎯 ${task.importance === 'low' ? '低' :
                            task.importance === 'medium' ? '中' : '高'
                        }</p>` : ''}
                        ${task.dueDate ? `<p>📅 ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                        <div class="task-actions">
                            <button onclick="app.reopenTask('${task.id}')" class="icon-button" data-tooltip="進行中に戻す">🔄</button>
                            <button onclick="app.deleteTask('${task.id}')" class="icon-button" data-tooltip="削除">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
            ${!task.isCollapsed ? childTasks.map(childTask => this.createCompletedTaskHTML(childTask, depth + 1)).join('') : ''}
        `;

        return taskHtml;
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