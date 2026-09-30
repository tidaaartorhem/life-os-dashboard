import { test, expect } from "@playwright/test";

const GOAL_TITLE = "E2E Launch goal";
const MILESTONE_TITLE = "E2E Milestone one";
const TASK_TITLE = "E2E Acceptance task";

/**
 * Acceptance journey: create a goal -> add a milestone -> link a task with
 * a due date -> complete the task -> dashboard reflects the progress.
 * The goal is deleted at the end so the suite stays idempotent.
 */
test("goal journey: create goal, milestone, task, complete, dashboard reflects progress", async ({
  page,
}) => {
  // 1. Create a goal
  await page.goto("/goals");
  await page.getByRole("button", { name: "New goal" }).click();
  await page.getByLabel("Title").fill(GOAL_TITLE);
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(
    page.getByRole("heading", { name: GOAL_TITLE })
  ).toBeVisible();

  const card = page
    .locator("div.rounded-lg")
    .filter({ has: page.getByRole("heading", { name: GOAL_TITLE }) });

  // 2. Add a milestone to the goal
  await card.getByRole("button", { name: "Milestone" }).click();
  await page.getByLabel("Title").fill(MILESTONE_TITLE);
  await page.getByRole("button", { name: "Add milestone" }).click();
  await expect(page.getByText(MILESTONE_TITLE)).toBeVisible();

  // 3. Add a task linked to the milestone, with a due date
  await card
    .getByRole("button", { name: `Add task to milestone "${MILESTONE_TITLE}"` })
    .click();
  await page.getByLabel("Title").fill(TASK_TITLE);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const iso = tomorrow.toISOString().slice(0, 10);
  await page.getByLabel("Due date").fill(iso);
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(TASK_TITLE)).toBeVisible();

  // Progress starts at 0%
  await expect(
    card.getByRole("progressbar", { name: `${GOAL_TITLE} overall progress` })
  ).toHaveAttribute("aria-valuenow", "0");

  // 4. Complete the task
  await card
    .getByRole("checkbox", { name: `Complete "${TASK_TITLE}"` })
    .click();

  // 5. Goal progress reflects completion
  await expect(
    card.getByRole("progressbar", { name: `${GOAL_TITLE} overall progress` })
  ).toHaveAttribute("aria-valuenow", "100", { timeout: 10000 });
  await expect(card.getByText("100%")).toBeVisible();

  // 6. Dashboard reflects the goal progress
  await page.goto("/");
  await expect(
    page.getByRole("progressbar", { name: `${GOAL_TITLE} progress` })
  ).toHaveAttribute("aria-valuenow", "100");

  // Cleanup: delete the goal (tasks/milestones cascade)
  await page.goto("/goals");
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .locator("div.rounded-lg")
    .filter({ has: page.getByRole("heading", { name: GOAL_TITLE }) })
    .getByRole("button", { name: `Delete goal "${GOAL_TITLE}"` })
    .click();
  await expect(
    page.getByRole("heading", { name: GOAL_TITLE })
  ).not.toBeVisible({ timeout: 10000 });
});

test("navigation reaches every main screen", async ({ page }) => {
  for (const [path, heading] of [
    ["/", "Good "],
    ["/tasks", "Tasks"],
    ["/goals", "Goals"],
    ["/calendar", "Calendar"],
    ["/analytics", "Analytics"],
  ] as const) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: heading, exact: false }).first()
    ).toBeVisible();
  }
});
