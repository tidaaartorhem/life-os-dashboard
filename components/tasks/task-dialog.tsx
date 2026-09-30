"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createTaskAction, updateTaskAction } from "@/app/actions/tasks";
import type { TaskDto } from "@/types";
import type { Project, Tag, Goal } from "@/types";
import { toDateInputValue } from "@/lib/dates";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task?: TaskDto | null;
  projects: Project[];
  tags: Tag[];
  goals: Goal[];
  initialStatus?: string;
}

export function TaskDialog({
  open,
  onClose,
  task,
  projects,
  tags,
  goals,
  initialStatus = "todo",
}: TaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    task?.tags.map((t) => t.id) ?? []
  );

  const editing = Boolean(task);

  const toggleTag = (id: string) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const str = (name: string) => {
      const v = String(form.get(name) ?? "").trim();
      return v === "" ? undefined : v;
    };
    const raw = {
      title: String(form.get("title") ?? ""),
      description: str("description") ?? null,
      status: String(form.get("status") ?? "todo"),
      priority: String(form.get("priority") ?? "medium"),
      dueDate: str("dueDate") ?? null,
      projectId: str("projectId") ?? null,
      goalId: str("goalId") ?? null,
      tagIds: selectedTags,
      estimatedMinutes:
        str("estimatedMinutes") != null ? Number(str("estimatedMinutes")) : null,
    };
    startTransition(async () => {
      try {
        if (editing && task) {
          await updateTaskAction(task.id, raw);
        } else {
          await createTaskAction(raw);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit task" : "New task"}
      description={
        editing ? "Update the details of this task." : "Add a task to your list."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-title">Title</Label>
          <Input
            id="task-title"
            name="title"
            required
            maxLength={200}
            defaultValue={task?.title ?? ""}
            placeholder="What needs doing?"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-desc">Description</Label>
          <Textarea
            id="task-desc"
            name="description"
            defaultValue={task?.description ?? ""}
            placeholder="Optional details…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-status">Status</Label>
            <Select id="task-status" name="status" defaultValue={task?.status ?? initialStatus}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <Select
              id="task-priority"
              name="priority"
              defaultValue={task?.priority ?? "medium"}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              name="dueDate"
              type="date"
              defaultValue={task?.dueDate ? toDateInputValue(task.dueDate) : ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-est">Estimate (min)</Label>
            <Input
              id="task-est"
              name="estimatedMinutes"
              type="number"
              min={0}
              placeholder="30"
              defaultValue={task?.estimatedMinutes ?? ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-project">Project</Label>
            <Select
              id="task-project"
              name="projectId"
              defaultValue={task?.projectId ?? ""}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-goal">Linked goal</Label>
            <Select id="task-goal" name="goalId" defaultValue={task?.goalId ?? ""}>
              <option value="">None</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {tags.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-zinc-700">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const selected = selectedTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      selected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                      aria-hidden="true"
                    />
                    {t.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : editing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
