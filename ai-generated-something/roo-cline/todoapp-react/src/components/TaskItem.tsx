import React from 'react';
import { Task } from '../types/Task';

interface TaskItemProps {
    task: Task;
    depth?: number;
    onEdit: (taskId: string) => void;
    onToggleCollapse: (taskId: string) => void;
    onAddChild: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onStatusChange: (taskId: string, newStatus: 'backlog' | 'in_progress' | 'completed') => void;
    isLeafTask: (taskId: string) => boolean;
    children?: React.ReactNode;
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task,
    depth = 0,
    onEdit,
    onToggleCollapse,
    onAddChild,
    onDelete,
    onStatusChange,
    isLeafTask,
    children,
}) => {
    const handleDelete = () => {
        if (window.confirm('このタスクを削除してもよろしいですか？\n※子タスクも全て削除されます')) {
            onDelete(task.id);
        }
    };

    const handleComplete = () => {
        const achievement = window.prompt('実績を入力してください（任意）:');
        onStatusChange(task.id, 'completed');
    };

    const renderTaskActions = () => {
        if (task.status === 'backlog') {
            const canStart = isLeafTask(task.id);
            return (
                <>
                    {canStart && (
                        <button
                            id={`start-${task.id}`}
                            onClick={() => onStatusChange(task.id, 'in_progress')}
                            className="icon-button"
                            data-tooltip="開始"
                        >
                            ▶️
                        </button>
                    )}
                    <button
                        onClick={handleComplete}
                        className="icon-button"
                        data-tooltip="完了"
                    >
                        ✅
                    </button>
                </>
            );
        } else if (task.status === 'in_progress') {
            return (
                <>
                    <button
                        onClick={() => onStatusChange(task.id, 'backlog')}
                        className="icon-button"
                        data-tooltip="Backlogに戻す"
                    >
                        ⏪
                    </button>
                    <button
                        onClick={handleComplete}
                        className="icon-button"
                        data-tooltip="完了"
                    >
                        ✅
                    </button>
                </>
            );
        } else if (task.status === 'completed') {
            return (
                <button
                    onClick={() => onStatusChange(task.id, 'in_progress')}
                    className="icon-button"
                    data-tooltip="進行中に戻す"
                >
                    🔄
                </button>
            );
        }
        return null;
    };

    const renderMetaInfo = () => {
        const meta = [];

        if (task.status === 'completed' && task.completedDate) {
            meta.push(
                <p key="completed">✅ {new Date(task.completedDate).toLocaleDateString()}</p>
            );
        }

        if (task.size) {
            meta.push(
                <p key="size">
                    📏{' '}
                    {task.size === 'small'
                        ? '小'
                        : task.size === 'medium'
                            ? '中'
                            : '大'}
                </p>
            );
        }

        if (task.importance) {
            meta.push(
                <p key="importance">
                    🎯{' '}
                    {task.importance === 'low'
                        ? '低'
                        : task.importance === 'medium'
                            ? '中'
                            : '高'}
                </p>
            );
        }

        if (task.dueDate) {
            meta.push(
                <p key="dueDate">📅 {new Date(task.dueDate).toLocaleDateString()}</p>
            );
        }

        return meta;
    };

    const hasChildren = React.Children.count(children) > 0;
    const statusBadge =
        task.status === 'has_in_progress_child' ? (
            <span className="status-badge">👉 子タスク進行中</span>
        ) : null;

    return (
        <div
            className={`task-item ${task.status === 'completed' ? 'completed' : ''}`}
            data-id={task.id}
            data-collapsed={task.isCollapsed}
            style={{ marginLeft: `${depth * 20}px` }}
        >
            <div className="task-content">
                <h3>
                    {hasChildren && (
                        <button
                            id={`toggle-${task.id}`}
                            onClick={() => onToggleCollapse(task.id)}
                            className="icon-button"
                            data-tooltip={task.isCollapsed ? '展開' : '折りたたむ'}
                        >
                            {task.isCollapsed ? '📂' : '📁'}
                        </button>
                    )}
                    <span onClick={() => onEdit(task.id)} style={{ cursor: 'pointer' }}>
                        {task.title} {statusBadge}
                    </span>
                </h3>
                <div className="task-meta">
                    {renderMetaInfo()}
                    <div className="task-actions">
                        {renderTaskActions()}
                        <button
                            id={`add-child-${task.id}`}
                            onClick={() => onAddChild(task.id)}
                            className="icon-button"
                            data-tooltip="子タスク追加"
                        >
                            ➕
                        </button>
                        <button
                            id={`delete-${task.id}`}
                            onClick={handleDelete}
                            className="icon-button"
                            data-tooltip="削除"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
            {!task.isCollapsed && children}
        </div>
    );
};