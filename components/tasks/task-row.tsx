"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleTaskAction, deleteTaskAction } from "@/app/actions/tasks";
import type { TaskWithRelations } from "@/services/tasks";
import { cn } from "@/lib/utils";
import {
  dueInfo,
  PRIORITY_VARIANT,
  STATUS_LABEL,
  STATUS_VARIANT,
} from "./task-helpers";

interface TaskRowProps {
  task: TaskWithRelations;
  onEdit: (task: TaskWithRelations) => void;
  compact?: boolean;
}

export function TaskRow({ task, onEdit, compact = false }: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "done";
  const due = dueInfo(task.dueDate);

  const toggle = () =>
    startTransition(async () => {
      await toggleTaskAction(task.id);
    });

  const remove = () =>
    startTransition(async () => {
      if (window.confirm(`Delete task "${task.title}"?`)) {
        await deleteTaskAction(task.id);
      }
    });

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-zinc-50",
        isPending && "opacity-60"
      )}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={done}
          onChange={toggle}
          label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-zinc-900",
            done && "text-zinc-400 line-through"
          )}
        >
          {task.title}
        </p>
        {!compact && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={STATUS_VARIANT[task.status]}>
              {STATUS_LABEL[task.status]}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[task.priority]}>
              {task.priority}
            </Badge>
            {due.variant && <Badge variant={due.variant}>{due.text}</Badge>}
            {task.project && (
              <span className="text-xs text-zinc-500">{task.project.name}</span>
            )}
            {task.tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 text-xs text-zinc-500"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: t.color }}
                  aria-hidden="true"
                />
                {t.name}
              </span>
            ))}
          </div>
        )}
        {compact && due.variant && (
          <div className="mt-1">
            <Badge variant={due.variant}>{due.text}</Badge>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit "${task.title}"`}
          onClick={() => onEdit(task)}
          className="size-7"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete "${task.title}"`}
          onClick={remove}
          className="size-7 text-zinc-400 hover:text-red-600"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
