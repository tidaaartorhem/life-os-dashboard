import { db } from "@/lib/db";
import { getDemoUserId } from "@/lib/auth";
import { listGoals } from "@/services/goals";
import { listProjects, listTags } from "@/services/misc";
import { GoalsView } from "@/components/goals/goals-view";

export default async function GoalsPage() {
  const userId = await getDemoUserId();
  const [goals, projects, tags] = await Promise.all([
    listGoals(db, userId),
    listProjects(db, userId),
    listTags(db, userId),
  ]);

  return <GoalsView goals={goals} projects={projects} tags={tags} />;
}
