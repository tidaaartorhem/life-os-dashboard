"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard, type GoalCardActions } from "./goal-card";
import { GoalDialog } from "./goal-dialog";
import { MilestoneDialog } from "./milestone-dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { GoalDto, MilestoneDto, Project, Tag } from "@/types";

interface GoalsViewProps {
  goals: GoalDto[];
  projects: Project[];
  tags: Tag[];
}

export function GoalsView({ goals, projects, tags }: GoalsViewProps) {
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalDto | null>(null);

  const [milestoneDialog, setMilestoneDialog] = useState<{
    goal: GoalDto;
    milestone: MilestoneDto | null;
  } | null>(null);

  const [taskDialog, setTaskDialog] = useState<{
    goal: GoalDto;
    milestone?: MilestoneDto;
  } | null>(null);

  const actions: GoalCardActions = {
    onEditGoal: (goal) => {
      setEditingGoal(goal);
      setGoalDialogOpen(true);
    },
    onAddMilestone: (goal) => setMilestoneDialog({ goal, milestone: null }),
    onEditMilestone: (goal, milestone) =>
      setMilestoneDialog({ goal, milestone }),
    onAddTask: (goal, milestone) => setTaskDialog({ goal, milestone }),
  };

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Big outcomes, broken into milestones and tasks."
        actions={
          <Button
            onClick={() => {
              setEditingGoal(null);
              setGoalDialogOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            New goal
          </Button>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target />}
          title="No goals yet"
          description="Set a goal, add milestones, and link tasks to track progress automatically."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditingGoal(null);
                setGoalDialogOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Create your first goal
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} actions={actions} />
          ))}
        </div>
      )}

      <GoalDialog
        key={editingGoal?.id ?? "new-goal"}
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        goal={editingGoal}
      />

      {milestoneDialog && (
        <MilestoneDialog
          key={milestoneDialog.milestone?.id ?? `new-${milestoneDialog.goal.id}`}
          open
          onClose={() => setMilestoneDialog(null)}
          goalId={milestoneDialog.goal.id}
          goalTitle={milestoneDialog.goal.title}
          milestone={milestoneDialog.milestone}
        />
      )}

      {taskDialog && (
        <TaskDialog
          key={`goal-task-${taskDialog.goal.id}-${taskDialog.milestone?.id ?? "direct"}`}
          open
          onClose={() => setTaskDialog(null)}
          projects={projects}
          tags={tags}
          goals={goals}
          defaultGoalId={taskDialog.goal.id}
          defaultMilestoneId={taskDialog.milestone?.id}
        />
      )}
    </div>
  );
}
