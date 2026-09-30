import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { listTasks } from "@/services/tasks";
import { listProjects, listTags } from "@/services/misc";
import { listGoals } from "@/services/goals";
import { TasksView } from "@/components/tasks/tasks-view";

export default async function TasksPage() {
  const userId = await getDemoUserId();
  const [tasks, projects, tags, goals] = await Promise.all([
    listTasks(db, userId),
    listProjects(db, userId),
    listTags(db, userId),
    listGoals(db, userId),
  ]);

  return (
    <TasksView tasks={tasks} projects={projects} tags={tags} goals={goals} />
  );
}
