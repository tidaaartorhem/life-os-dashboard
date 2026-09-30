"use client";

import { useMemo, useState } from "react";
import { Plus, LayoutGrid, List as ListIcon, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TaskRow } from "./task-row";
import { TaskDialog } from "./task-dialog";
import { KanbanBoard } from "./kanban-board";
import type { TaskDto } from "@/types";
import type { Project, Tag, Goal } from "@/types";

interface TasksViewProps {
  tasks: TaskDto[];
  projects: Project[];
  tags: Tag[];
  goals: Goal[];
}

export function TasksView({ tasks, projects, tags, goals }: TasksViewProps) {
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDto | null>(null);
  const [initialStatus, setInitialStatus] = useState("todo");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !(t.description ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, projectFilter]);

  const openNew = (status = "todo") => {
    setEditing(null);
    setInitialStatus(status);
    setDialogOpen(true);
  };

  const openEdit = (task: TaskDto) => {
    setEditing(task);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Plan, prioritize, and drag work across the board."
        actions={
          <>
            <Tabs
              tabs={[
                {
                  id: "board",
                  label: "Board",
                  icon: <LayoutGrid className="size-4" aria-hidden="true" />,
                },
                {
                  id: "list",
                  label: "List",
                  icon: <ListIcon className="size-4" aria-hidden="true" />,
                },
              ]}
              value={view}
              onChange={setView}
            />
            <Button onClick={() => openNew()}>
              <Plus className="size-4" aria-hidden="true" />
              New task
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="pl-9"
          />
        </div>
        <label className="sr-only" htmlFor="filter-status">
          Filter by status
        </label>
        <Select
          id="filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </Select>
        <label className="sr-only" htmlFor="filter-priority">
          Filter by priority
        </label>
        <Select
          id="filter-priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <label className="sr-only" htmlFor="filter-project">
          Filter by project
        </label>
        <Select
          id="filter-project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-auto"
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {view === "board" ? (
        <KanbanBoard
          initialTasks={filtered}
          onEdit={openEdit}
          onAdd={openNew}
        />
      ) : (
        <Card>
          <CardContent className="py-2">
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                No tasks match these filters.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {filtered.map((task) => (
                  <li key={task.id}>
                    <TaskRow task={task} onEdit={openEdit} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <TaskDialog
        key={editing?.id ?? `new-${initialStatus}`}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={editing}
        projects={projects}
        tags={tags}
        goals={goals}
        initialStatus={initialStatus}
      />
    </div>
  );
}
