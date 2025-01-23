import React from 'react';
import { Task } from '../types/Task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    onEdit: (taskId: string) => void;
    onToggleCollapse: (taskId: string) => void;
    onAddChild: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onStatusChange: (taskId: string, newStatus: 'backlog' | 'in_progress' | 'completed') => void;
    isLeafTask: (taskId: string) => boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
    tasks,
    onEdit,
    onToggleCollapse,
    onAddChild,
    onDelete,
    onStatusChange,
    isLeafTask,
}) => {
    // ルートタスク（親を持たないタスク）のみを取得
    const rootTasks = tasks.filter(task => !task.parentId);

    // 指定されたタスクの子タスクを再帰的に表示するコンポーネント
    const renderTaskWithChildren = (task: Task, depth: number = 0) => {
        const childTasks = task.childIds
            .map(childId => tasks.find(t => t.id === childId))
            .filter((t): t is Task => t !== undefined);

        const nonCompletedChildren = childTasks.filter(t => t.status !== 'completed');
        const completedChildren = childTasks.filter(t => t.status === 'completed');

        const children = task.status === 'completed'
            ? completedChildren
            : nonCompletedChildren;

        return (
            <TaskItem
                key={task.id}
                task={task}
                depth={depth}
                onEdit={onEdit}
                onToggleCollapse={onToggleCollapse}
                onAddChild={onAddChild}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                isLeafTask={isLeafTask}
            >
                {children.map(child => renderTaskWithChildren(child, depth + 1))}
            </TaskItem>
        );
    };

    // Backlogタスク（未着手または子タスク進行中）
    const backlogTasks = rootTasks.filter(
        task => task.status === 'backlog' || task.status === 'has_in_progress_child'
    );

    // 進行中のタスク（末端タスクのみ）
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');

    // 完了タスク（ルートタスクのみ）
    const completedTasks = rootTasks
        .filter(task => task.status === 'completed')
        .sort((a, b) => {
            if (!a.completedDate || !b.completedDate) return 0;
            return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
        });

    const [showCompleted, setShowCompleted] = React.useState(false);

    return (
        <div className="task-lists">
            <section>
                <h2>Backlog</h2>
                <div id="backlogTasks">
                    {backlogTasks.map(task => renderTaskWithChildren(task))}
                </div>
            </section>

            <section>
                <h2>進行中</h2>
                <div id="inProgressTasks">
                    {inProgressTasks.map(task => renderTaskWithChildren(task))}
                </div>
            </section>

            <section>
                <h2>
                    完了
                    <button
                        id="toggleCompleted"
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="btn"
                    >
                        {showCompleted ? '履歴を非表示' : '履歴を表示'}
                    </button>
                </h2>
                <div id="completedTasks" className={showCompleted ? '' : 'hidden'}>
                    {completedTasks.map(task => renderTaskWithChildren(task))}
                </div>
            </section>
        </div>
    );
};