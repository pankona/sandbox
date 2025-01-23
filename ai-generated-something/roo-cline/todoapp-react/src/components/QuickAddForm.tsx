import React, { useState, FormEvent } from 'react';

interface QuickAddFormProps {
    onAdd: (title: string) => void;
}

export const QuickAddForm: React.FC<QuickAddFormProps> = ({ onAdd }) => {
    const [title, setTitle] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (trimmedTitle) {
            onAdd(trimmedTitle);
            setTitle('');
        }
    };

    return (
        <form id="quickAddForm" onSubmit={handleSubmit}>
            <input
                type="text"
                id="quickTaskTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="新しいタスクを入力..."
                autoComplete="off"
            />
        </form>
    );
};