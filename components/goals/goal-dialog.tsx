"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createGoalAction, updateGoalAction } from "@/app/actions/goals";
import type { GoalDto } from "@/types";
import { toDateInputValue } from "@/lib/dates";

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal?: GoalDto | null;
}

export function GoalDialog({ open, onClose, goal }: GoalDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(goal);

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
      targetDate: str("targetDate") ?? null,
      status: String(form.get("status") ?? "active"),
    };
    startTransition(async () => {
      try {
        if (editing && goal) {
          await updateGoalAction(goal.id, raw);
        } else {
          await createGoalAction(raw);
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
      title={editing ? "Edit goal" : "New goal"}
      description={
        editing
          ? "Update this goal's details."
          : "Define a goal, then break it into milestones and tasks."
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-title">Title</Label>
          <Input
            id="goal-title"
            name="title"
            required
            maxLength={200}
            defaultValue={goal?.title ?? ""}
            placeholder="e.g. Run a 10K race"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="goal-desc">Description</Label>
          <Textarea
            id="goal-desc"
            name="description"
            defaultValue={goal?.description ?? ""}
            placeholder="Why does this matter?"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-target">Target date</Label>
            <Input
              id="goal-target"
              name="targetDate"
              type="date"
              defaultValue={
                goal?.targetDate ? toDateInputValue(goal.targetDate) : ""
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="goal-status">Status</Label>
            <Select
              id="goal-status"
              name="status"
              defaultValue={goal?.status ?? "active"}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
        </div>
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
            {isPending ? "Saving…" : editing ? "Save changes" : "Create goal"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
