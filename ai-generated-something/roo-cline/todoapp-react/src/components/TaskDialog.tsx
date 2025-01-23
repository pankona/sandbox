import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, TaskSize, TaskImportance } from '../types/Task';

interface TaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TaskFormData) => void;
    initialData?: Task;
    mode: 'edit' | 'addChild';
    parentTitle?: string;
}

export const TaskDialog: React.FC<TaskDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode,
    parentTitle,
}) => {
    const [formData, setFormData] = useState<TaskFormData>({
        title: '',
        size: null,
        importance: null,
        dueDate: null,
        description: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                size: initialData.size,
                importance: initialData.importance,
                dueDate: initialData.dueDate,
                description: initialData.description,
            });
        } else {
            setFormData({
                title: '',
                size: null,
                importance: null,
                dueDate: null,
                description: '',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <dialog open className="task-dialog">
            <form className="task-form" onSubmit={handleSubmit}>
                <h3>
                    {mode === 'edit'
                        ? 'タスクを編集'
                        : `${parentTitle}の子タスク追加`}
                </h3>

                <div className="form-group">
                    <label htmlFor="taskTitle">タスク名</label>
                    <input
                        type="text"
                        id="taskTitle"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="taskSize">タスクサイズ</label>
                    <select
                        id="taskSize"
                        value={formData.size || ''}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                size: e.target.value as TaskSize || null,
                            })
                        }
                    >
                        <option value="">未設定</option>
                        <option value="small">小（30分以内）</option>
                        <option value="medium">中（2時間以内）</option>
                        <option value="large">大（半日以上）</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="taskImportance">重要度</label>
                    <select
                        id="taskImportance"
                        value={formData.importance || ''}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                importance: e.target.value as TaskImportance || null,
                            })
                        }
                    >
                        <option value="">未設定</option>
                        <option value="low">低（後回しOK）</option>
                        <option value="medium">中（普通）</option>
                        <option value="high">高（優先）</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="taskDueDate">期限</label>
                    <input
                        type="date"
                        id="taskDueDate"
                        value={formData.dueDate || ''}
                        min="2025-01-21"
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                dueDate: e.target.value || null,
                            })
                        }
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="taskDescription">詳細説明</label>
                    <textarea
                        id="taskDescription"
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                    />
                </div>

                <div className="dialog-buttons">
                    <button type="submit" className="btn">
                        {mode === 'edit' ? '保存' : '追加'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-cancel"
                        onClick={onClose}
                    >
                        キャンセル
                    </button>
                </div>
            </form>
        </dialog>
    );
};