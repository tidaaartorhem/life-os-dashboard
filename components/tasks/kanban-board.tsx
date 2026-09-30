"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { moveTaskAction } from "@/app/actions/tasks";
import type { TaskDto } from "@/types";
import { cn } from "@/lib/utils";
import { dueInfo, PRIORITY_VARIANT, PRIORITY_LABEL } from "./task-helpers";

export const KANBAN_COLUMNS = [
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In progress" },
  { id: "done", title: "Done" },
] as const;

export type KanbanStatus = (typeof KANBAN_COLUMNS)[number]["id"];

function KanbanCard({
  task,
  onEdit,
}: {
  task: TaskDto;
  onEdit: (task: TaskDto) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const due = dueInfo(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={cn(
        "group rounded-md border border-zinc-200 bg-white p-3 shadow-sm",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`Drag "${task.title}"`}
          className="mt-0.5 cursor-grab touch-none text-zinc-300 hover:text-zinc-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          <span
            className={cn(
              "block truncate text-sm font-medium text-zinc-900",
              task.status === "done" && "text-zinc-400 line-through"
            )}
          >
            {task.title}
          </span>
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
        <Badge variant={PRIORITY_VARIANT[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
        {due.variant && <Badge variant={due.variant}>{due.text}</Badge>}
        {task.tags.map((t) => (
          <span
            key={t.id}
            className="size-2 rounded-full"
            style={{ backgroundColor: t.color }}
            title={t.name}
            aria-label={`Tag: ${t.name}`}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  tasks,
  onEdit,
  onAdd,
}: {
  id: string;
  title: string;
  tasks: TaskDto[];
  onEdit: (task: TaskDto) => void;
  onAdd: (status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      aria-label={`${title} column`}
      className={cn(
        "flex min-h-[200px] flex-col rounded-lg border border-zinc-200 bg-zinc-100/70 p-3 transition-colors",
        isOver && "border-indigo-300 bg-indigo-50/60"
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-zinc-700">
          {title}
          <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
            {tasks.length}
          </span>
        </h3>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Add task to ${title}`}
          onClick={() => onAdd(id)}
          className="size-7"
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-400">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  initialTasks: TaskDto[];
  onEdit: (task: TaskDto) => void;
  onAdd: (status: string) => void;
}

export function KanbanBoard({ initialTasks, onEdit, onAdd }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskDto | null>(null);
  const [, startTransition] = useTransition();

  // Keep the board in sync when the parent's filtered list changes
  // (e.g. search / filter updates, or a fresh server render).
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const grouped = useMemo(() => {
    const map: Record<string, TaskDto[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const t of tasks) map[t.status]?.push(t);
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    // over.id is either a column id or another task's id
    const overTask = tasks.find((t) => t.id === over.id);
    const targetStatus = overTask ? overTask.status : String(over.id);
    if (targetStatus === task.status) return;

    const previous = tasks;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: targetStatus as typeof t.status } : t))
    );
    startTransition(async () => {
      try {
        await moveTaskAction(task.id, targetStatus);
      } catch {
        // Revert optimistic update on failure
        setTasks(previous);
      }
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={grouped[col.id]}
            onEdit={onEdit}
            onAdd={onAdd}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rounded-md border border-indigo-300 bg-white p-3 shadow-lg">
            <span className="block truncate text-sm font-medium text-zinc-900">
              {activeTask.title}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
