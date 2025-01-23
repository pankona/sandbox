import React, { useState } from 'react';
import { TaskList } from './components/TaskList';
import { QuickAddForm } from './components/QuickAddForm';
import { TaskDialog } from './components/TaskDialog';
import { useTodoStore } from './hooks/useTodoStore';
import { Task, TaskFormData } from './types/Task';
import './App.css';

export const App: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    toggleCollapse,
    isLeafTask,
    updateTaskStatus,
    deleteTask,
  } = useTodoStore();

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'edit' | 'addChild';
    targetTask?: Task;
    parentTitle?: string;
  }>({
    isOpen: false,
    mode: 'edit',
  });

  const handleQuickAdd = (title: string) => {
    addTask({
      title,
      size: null,
      importance: null,
      dueDate: null,
      description: '',
    });
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setDialogState({
        isOpen: true,
        mode: 'edit',
        targetTask: task,
      });
    }
  };

  const handleAddChild = (taskId: string) => {
    const parentTask = tasks.find(t => t.id === taskId);
    if (parentTask) {
      setDialogState({
        isOpen: true,
        mode: 'addChild',
        targetTask: parentTask,
        parentTitle: parentTask.title,
      });
    }
  };

  const handleDialogSubmit = (formData: TaskFormData) => {
    if (dialogState.mode === 'edit' && dialogState.targetTask) {
      updateTask(dialogState.targetTask.id, formData);
    } else if (dialogState.mode === 'addChild' && dialogState.targetTask) {
      addTask(formData, dialogState.targetTask.id);
    }
    setDialogState({ isOpen: false, mode: 'edit' });
  };

  const handleDialogClose = () => {
    setDialogState({ isOpen: false, mode: 'edit' });
  };

  return (
    <div className="app">
      <header>
        <h1>TodoApp</h1>
        <QuickAddForm onAdd={handleQuickAdd} />
      </header>

      <main>
        <TaskList
          tasks={tasks}
          onEdit={handleEdit}
          onToggleCollapse={toggleCollapse}
          onAddChild={handleAddChild}
          onDelete={deleteTask}
          onStatusChange={updateTaskStatus}
          isLeafTask={isLeafTask}
        />
      </main>

      <TaskDialog
        isOpen={dialogState.isOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        initialData={dialogState.targetTask}
        mode={dialogState.mode}
        parentTitle={dialogState.parentTitle}
      />
    </div>
  );
};
