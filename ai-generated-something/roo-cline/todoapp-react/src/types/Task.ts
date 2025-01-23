export type TaskStatus = 'backlog' | 'in_progress' | 'completed' | 'has_in_progress_child';
export type TaskSize = 'small' | 'medium' | 'large' | null;
export type TaskImportance = 'low' | 'medium' | 'high' | null;

export interface Task {
    id: string;
    title: string;
    size: TaskSize;
    importance: TaskImportance;
    dueDate: string | null;
    description: string;
    status: TaskStatus;
    completedDate: string | null;
    achievement: string;
    parentId: string | null;
    childIds: string[];
    isCollapsed: boolean;
}

export interface TaskFormData {
    title: string;
    size: TaskSize;
    importance: TaskImportance;
    dueDate: string | null;
    description: string;
}