"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import {
  Pencil,
  Trash2,
  Plus,
  Flag,
  ListChecks,
  CalendarDays,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTaskAction } from "@/app/actions/tasks";
import { deleteGoalAction, deleteMilestoneAction } from "@/app/actions/goals";
import type { GoalDto, MilestoneDto, TaskDto } from "@/types";
import { cn } from "@/lib/utils";
import { dueInfo } from "@/components/tasks/task-helpers";

const GOAL_STATUS_VARIANT: Record<string, "primary" | "default" | "success" | "warning"> = {
  active: "primary",
  paused: "warning",
  completed: "success",
  archived: "default",
};

export interface GoalCardActions {
  onEditGoal: (goal: GoalDto) => void;
  onAddMilestone: (goal: GoalDto) => void;
  onEditMilestone: (goal: GoalDto, milestone: MilestoneDto) => void;
  onAddTask: (goal: GoalDto, milestone?: MilestoneDto) => void;
}

function GoalTaskRow({ task }: { task: TaskDto }) {
  const [isPending, startTransition] = useTransition();
  const done = task.status === "done";
  const due = dueInfo(task.dueDate);

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-zinc-50",
        isPending && "opacity-60"
      )}
    >
      <Checkbox
        checked={done}
        onChange={() =>
          startTransition(async () => {
            await toggleTaskAction(task.id);
          })
        }
        label={done ? `Reopen "${task.title}"` : `Complete "${task.title}"`}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm text-zinc-800",
          done && "text-zinc-400 line-through"
        )}
      >
        {task.title}
      </span>
      {due.variant && !done && <Badge variant={due.variant}>{due.text}</Badge>}
    </div>
  );
}

function MilestoneSection({
  goal,
  milestone,
  actions,
}: {
  goal: GoalDto;
  milestone: MilestoneDto;
  actions: GoalCardActions;
}) {
  const [isPending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      if (window.confirm(`Delete milestone "${milestone.title}"?`)) {
        await deleteMilestoneAction(milestone.id);
      }
    });

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Flag className="size-3.5 shrink-0 text-indigo-600" aria-hidden="true" />
          <span className="truncate text-sm font-medium text-zinc-900">
            {milestone.title}
          </span>
          {milestone.targetDate && (
            <span className="hidden shrink-0 text-xs text-zinc-500 sm:inline">
              {format(milestone.targetDate, "MMM d")}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Add task to milestone "${milestone.title}"`}
            onClick={() => actions.onAddTask(goal, milestone)}
          >
            <Plus className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`Edit milestone "${milestone.title}"`}
            onClick={() => actions.onEditMilestone(goal, milestone)}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-zinc-400 hover:text-red-600"
            aria-label={`Delete milestone "${milestone.title}"`}
            onClick={remove}
            disabled={isPending}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Progress
          value={milestone.progress}
          label={`${milestone.title} progress`}
          className="flex-1"
        />
        <span className="text-xs font-medium text-zinc-500">
          {milestone.doneTasks}/{milestone.totalTasks}
        </span>
      </div>
      {milestone.tasks.length > 0 && (
        <div className="mt-1">
          {milestone.tasks.map((t) => (
            <GoalTaskRow key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GoalCard({
  goal,
  actions,
}: {
  goal: GoalDto;
  actions: GoalCardActions;
}) {
  const [isPending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      if (
        window.confirm(
          `Delete goal "${goal.title}" and all its milestones? Tasks linked to it will be unlinked.`
        )
      ) {
        await deleteGoalAction(goal.id);
      }
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                {goal.title}
              </h2>
              <Badge variant={GOAL_STATUS_VARIANT[goal.status] ?? "default"}>
                {goal.status}
              </Badge>
            </div>
            {goal.description && (
              <p className="mt-1 text-sm text-zinc-500">{goal.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              {goal.targetDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Target {format(goal.targetDate, "MMM d, yyyy")}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <ListChecks className="size-3.5" aria-hidden="true" />
                {goal.doneTasks} of {goal.totalTasks} tasks done
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit goal "${goal.title}"`}
              onClick={() => actions.onEditGoal(goal)}
              className="size-8"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete goal "${goal.title}"`}
              onClick={remove}
              disabled={isPending}
              className="size-8 text-zinc-400 hover:text-red-600"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={goal.progress}
            label={`${goal.title} overall progress`}
            className="flex-1"
          />
          <span className="text-sm font-semibold text-zinc-900">
            {goal.progress}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {goal.milestones.map((m) => (
          <MilestoneSection
            key={m.id}
            goal={goal}
            milestone={m}
            actions={actions}
          />
        ))}
        {goal.tasks.length > 0 && (
          <div className="rounded-md border border-zinc-200 p-3">
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Linked tasks
            </p>
            {goal.tasks.map((t) => (
              <GoalTaskRow key={t.id} task={t} />
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.onAddMilestone(goal)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Milestone
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.onAddTask(goal)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Task
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
