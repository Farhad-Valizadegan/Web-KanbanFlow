import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

interface DraggableTaskProps {
    taskId: number;
    columnId: number;
    children: ReactNode;
    disabled?: boolean;
}

function DraggableTask({
    taskId,
    columnId,
    children,
    disabled = false,
}: DraggableTaskProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `task-${taskId}`,
        disabled,
        data: {
            type: 'task',
            taskId,
            columnId,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
        >
            <div className="relative">
                <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    disabled={disabled}
                    aria-label="Drag task"
                    title="Drag task"
                    className="absolute right-2 top-2 z-10 cursor-grab border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Drag
                </button>

                {children}
            </div>
        </div>
    );
}

export default DraggableTask;