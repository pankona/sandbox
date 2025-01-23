import { useState, useEffect } from 'react';
import { Task, TaskFormData, TaskStatus } from '../types/Task';

export const useTodoStore = () => {
    const [tasks, setTasks] = useState<Task[]>([]);

    // LocalStorageからタスクを読み込む
    useEffect(() => {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks).map((task: Task) => ({
                ...task,
                status: task.status || 'backlog',
                parentId: task.parentId || null,
                childIds: task.childIds || [],
                isCollapsed: task.isCollapsed || false,
            }));
            setTasks(parsedTasks);
        }
    }, []);

    // タスクの変更をLocalStorageに保存
    const saveTasks = (newTasks: Task[]) => {
        localStorage.setItem('tasks', JSON.stringify(newTasks));
        setTasks(newTasks);
    };

    // 新しいタスクを追加
    const addTask = (taskData: TaskFormData, parentId: string | null = null) => {
        const newTask: Task = {
            id: Date.now().toString(),
            ...taskData,
            status: 'backlog',
            completedDate: null,
            achievement: '',
            parentId,
            childIds: [],
            isCollapsed: false,
        };

        const newTasks = [newTask, ...tasks];

        if (parentId) {
            const parentIndex = newTasks.findIndex(t => t.id === parentId);
            if (parentIndex !== -1) {
                newTasks[parentIndex] = {
                    ...newTasks[parentIndex],
                    childIds: [...newTasks[parentIndex].childIds, newTask.id],
                };

                // 親タスクが進行中だった場合、子タスクを追加することで親タスク化されるので
                // 状態を「子が進行中」に変更
                if (newTasks[parentIndex].status === 'in_progress') {
                    newTasks[parentIndex] = {
                        ...newTasks[parentIndex],
                        status: 'has_in_progress_child',
                    };
                }
            }
        }

        saveTasks(newTasks);
    };

    // タスクを編集
    const updateTask = (taskId: string, taskData: TaskFormData) => {
        const newTasks = tasks.map(task =>
            task.id === taskId
                ? { ...task, ...taskData }
                : task
        );
        saveTasks(newTasks);
    };

    // タスクの折りたたみ状態を切り替え
    const toggleCollapse = (taskId: string) => {
        const newTasks = tasks.map(task =>
            task.id === taskId
                ? { ...task, isCollapsed: !task.isCollapsed }
                : task
        );
        saveTasks(newTasks);
    };

    // 末端タスク（子を持たないタスク）かどうかを判定
    const isLeafTask = (taskId: string): boolean => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return false;

        // 完了していない子タスクの数をチェック
        const nonCompletedChildCount = task.childIds
            .map(childId => tasks.find(t => t.id === childId))
            .filter(child => child && child.status !== 'completed')
            .length;

        return nonCompletedChildCount === 0;
    };

    // 子孫タスクに進行中のタスクがあるかどうかを判定
    const hasInProgressDescendant = (taskId: string, excludeTaskId: string | null = null): boolean => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return false;

        return task.childIds.some(childId => {
            if (excludeTaskId && childId === excludeTaskId) return false;
            const child = tasks.find(t => t.id === childId);
            if (!child) return false;
            return (
                child.status === 'in_progress' ||
                child.status === 'has_in_progress_child' ||
                hasInProgressDescendant(childId, excludeTaskId)
            );
        });
    };

    // タスクとその子タスクを再帰的に完了状態にする
    const completeTaskAndChildren = (tasks: Task[], taskId: string, achievement: string): Task[] => {
        const now = new Date().toISOString();
        const completeTask = (task: Task): Task => {
            if (task.id === taskId || task.childIds.some(id => tasks.find(t => t.id === id)?.parentId === taskId)) {
                const updatedTask = {
                    ...task,
                    status: 'completed' as TaskStatus,
                    completedDate: now,
                    achievement: achievement || '親タスクの完了により自動完了',
                };

                // 子タスクも再帰的に完了状態にする
                if (task.childIds.length > 0) {
                    task.childIds.forEach(childId => {
                        const childIndex = tasks.findIndex(t => t.id === childId);
                        if (childIndex !== -1) {
                            tasks[childIndex] = completeTask(tasks[childIndex]);
                        }
                    });
                }
                return updatedTask;
            }
            return task;
        };

        return tasks.map(task => completeTask(task));
    };

    // タスクのステータスを変更
    const updateTaskStatus = (taskId: string, newStatus: TaskStatus, achievement: string = '') => {
        let newTasks = [...tasks];
        const taskIndex = newTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;

        const task = newTasks[taskIndex];
        const oldStatus = task.status;

        if (newStatus === 'completed') {
            // タスクとその子タスクを完了状態にする
            newTasks = completeTaskAndChildren(newTasks, taskId, achievement || '完了');
        } else {
            // 通常のステータス変更処理
            newTasks[taskIndex] = {
                ...task,
                status: newStatus,
                completedDate: null,
                achievement: '未完了',
            };

            // 親タスクの状態を更新
            if (task.parentId) {
                let currentParentId: string | null = task.parentId;
                while (currentParentId) {
                    const parentIndex = newTasks.findIndex(t => t.id === currentParentId);
                    if (parentIndex === -1) break;

                    const hasOtherInProgress = hasInProgressDescendant(currentParentId, taskId);
                    const parent = newTasks[parentIndex];

                    if (newStatus === 'in_progress' || hasOtherInProgress) {
                        newTasks[parentIndex] = { ...parent, status: 'has_in_progress_child' };
                    } else if (oldStatus === 'in_progress' && !hasOtherInProgress) {
                        newTasks[parentIndex] = { ...parent, status: 'backlog' };
                    }

                    currentParentId = parent.parentId;
                }
            }
        }

        saveTasks(newTasks);
    };

    // タスクを削除（子タスクも含めて再帰的に削除）
    const deleteTask = (taskId: string) => {
        const deleteTaskAndChildren = (id: string): string[] => {
            const taskToDelete = tasks.find(t => t.id === id);
            if (!taskToDelete) return [];

            // 子タスクを再帰的に削除
            const deletedIds = taskToDelete.childIds.reduce<string[]>(
                (acc, childId) => [...acc, ...deleteTaskAndChildren(childId)],
                []
            );

            return [id, ...deletedIds];
        };

        const idsToDelete = deleteTaskAndChildren(taskId);
        const newTasks = tasks.filter(task => !idsToDelete.includes(task.id))
            .map(task => ({
                ...task,
                childIds: task.childIds.filter(id => !idsToDelete.includes(id))
            }));

        saveTasks(newTasks);
    };

    return {
        tasks,
        addTask,
        updateTask,
        toggleCollapse,
        isLeafTask,
        hasInProgressDescendant,
        updateTaskStatus,
        deleteTask,
    };
};