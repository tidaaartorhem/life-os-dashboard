"use client";

import { useState } from "react";
import { Plus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskRow } from "./task-row";
import { TaskDialog } from "./task-dialog";
import type { TaskWithRelations } from "@/services/tasks";
import type { Project, Tag, Goal } from "@/db/schema";

interface TaskListProps {
  tasks: TaskWithRelations[];
  projects: Project[];
  tags: Tag[];
  goals: Goal[];
  showAdd?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function TaskList({
  tasks,
  projects,
  tags,
  goals,
  showAdd = false,
  emptyTitle = "No tasks",
  emptyDescription = "Tasks you create will show up here.",
}: TaskListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (task: TaskWithRelations) => {
    setEditing(task);
    setDialogOpen(true);
  };

  return (
    <div>
      {tasks.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            showAdd ? (
              <Button size="sm" onClick={openNew}>
                <Plus className="size-4" aria-hidden="true" />
                New task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskRow task={task} onEdit={openEdit} compact />
            </li>
          ))}
        </ul>
      )}
      {showAdd && tasks.length > 0 && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={openNew}>
            <Plus className="size-4" aria-hidden="true" />
            Add task
          </Button>
        </div>
      )}
      <TaskDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={editing}
        projects={projects}
        tags={tags}
        goals={goals}
      />
    </div>
  );
}
