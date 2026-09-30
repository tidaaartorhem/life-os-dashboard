"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMilestoneAction,
  updateMilestoneAction,
} from "@/app/actions/goals";
import type { MilestoneDto } from "@/types";
import { toDateInputValue } from "@/lib/dates";

interface MilestoneDialogProps {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  milestone?: MilestoneDto | null;
}

export function MilestoneDialog({
  open,
  onClose,
  goalId,
  goalTitle,
  milestone,
}: MilestoneDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(milestone);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const targetDate = String(form.get("targetDate") ?? "").trim();
    const raw = {
      title: String(form.get("title") ?? ""),
      targetDate: targetDate === "" ? null : targetDate,
    };
    startTransition(async () => {
      try {
        if (editing && milestone) {
          await updateMilestoneAction(milestone.id, raw);
        } else {
          await createMilestoneAction(goalId, raw);
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
      title={editing ? "Edit milestone" : "New milestone"}
      description={`For goal: ${goalTitle}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ms-title">Title</Label>
          <Input
            id="ms-title"
            name="title"
            required
            maxLength={200}
            defaultValue={milestone?.title ?? ""}
            placeholder="e.g. Run 5K without stopping"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ms-target">Target date</Label>
          <Input
            id="ms-target"
            name="targetDate"
            type="date"
            defaultValue={
              milestone?.targetDate ? toDateInputValue(milestone.targetDate) : ""
            }
          />
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
            {isPending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Add milestone"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
