# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: goal-journey.spec.ts >> navigation reaches every main screen
- Location: tests/e2e/goal-journey.spec.ts:81:5

# Error details

```
Error: page.goto: net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS at http://127.0.0.1:3103/
Call log:
  - navigating to "http://127.0.0.1:3103/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e6]:
  - heading "127.0.0.1 is blocked" [level=1] [ref=e7]
  - paragraph [ref=e9]: The connection is blocked because it was initiated by a public page to connect to devices or servers on your local network.
  - generic [ref=e10]: ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const GOAL_TITLE = "E2E Launch goal";
  4  | const MILESTONE_TITLE = "E2E Milestone one";
  5  | const TASK_TITLE = "E2E Acceptance task";
  6  | 
  7  | /**
  8  |  * Acceptance journey: create a goal -> add a milestone -> link a task with
  9  |  * a due date -> complete the task -> dashboard reflects the progress.
  10 |  * The goal is deleted at the end so the suite stays idempotent.
  11 |  */
  12 | test("goal journey: create goal, milestone, task, complete, dashboard reflects progress", async ({
  13 |   page,
  14 | }) => {
  15 |   // 1. Create a goal
  16 |   await page.goto("/goals");
  17 |   await page.getByRole("button", { name: "New goal" }).click();
  18 |   await page.getByLabel("Title").fill(GOAL_TITLE);
  19 |   await page.getByRole("button", { name: "Create goal" }).click();
  20 |   await expect(
  21 |     page.getByRole("heading", { name: GOAL_TITLE })
  22 |   ).toBeVisible();
  23 | 
  24 |   const card = page
  25 |     .locator("div.rounded-lg")
  26 |     .filter({ has: page.getByRole("heading", { name: GOAL_TITLE }) });
  27 | 
  28 |   // 2. Add a milestone to the goal
  29 |   await card.getByRole("button", { name: "Milestone" }).click();
  30 |   await page.getByLabel("Title").fill(MILESTONE_TITLE);
  31 |   await page.getByRole("button", { name: "Add milestone" }).click();
  32 |   await expect(page.getByText(MILESTONE_TITLE)).toBeVisible();
  33 | 
  34 |   // 3. Add a task linked to the milestone, with a due date
  35 |   await card
  36 |     .getByRole("button", { name: `Add task to milestone "${MILESTONE_TITLE}"` })
  37 |     .click();
  38 |   await page.getByLabel("Title").fill(TASK_TITLE);
  39 |   const tomorrow = new Date();
  40 |   tomorrow.setDate(tomorrow.getDate() + 1);
  41 |   const iso = tomorrow.toISOString().slice(0, 10);
  42 |   await page.getByLabel("Due date").fill(iso);
  43 |   await page.getByRole("button", { name: "Create task" }).click();
  44 |   await expect(page.getByText(TASK_TITLE)).toBeVisible();
  45 | 
  46 |   // Progress starts at 0%
  47 |   await expect(
  48 |     card.getByRole("progressbar", { name: `${GOAL_TITLE} overall progress` })
  49 |   ).toHaveAttribute("aria-valuenow", "0");
  50 | 
  51 |   // 4. Complete the task
  52 |   await card
  53 |     .getByRole("checkbox", { name: `Complete "${TASK_TITLE}"` })
  54 |     .click();
  55 | 
  56 |   // 5. Goal progress reflects completion
  57 |   await expect(
  58 |     card.getByRole("progressbar", { name: `${GOAL_TITLE} overall progress` })
  59 |   ).toHaveAttribute("aria-valuenow", "100", { timeout: 10000 });
  60 |   await expect(card.getByText("100%")).toBeVisible();
  61 | 
  62 |   // 6. Dashboard reflects the goal progress
  63 |   await page.goto("/");
  64 |   await expect(
  65 |     page.getByRole("progressbar", { name: `${GOAL_TITLE} progress` })
  66 |   ).toHaveAttribute("aria-valuenow", "100");
  67 | 
  68 |   // Cleanup: delete the goal (tasks/milestones cascade)
  69 |   await page.goto("/goals");
  70 |   page.on("dialog", (dialog) => dialog.accept());
  71 |   await page
  72 |     .locator("div.rounded-lg")
  73 |     .filter({ has: page.getByRole("heading", { name: GOAL_TITLE }) })
  74 |     .getByRole("button", { name: `Delete goal "${GOAL_TITLE}"` })
  75 |     .click();
  76 |   await expect(
  77 |     page.getByRole("heading", { name: GOAL_TITLE })
  78 |   ).not.toBeVisible({ timeout: 10000 });
  79 | });
  80 | 
  81 | test("navigation reaches every main screen", async ({ page }) => {
  82 |   for (const [path, heading] of [
  83 |     ["/", "Good "],
  84 |     ["/tasks", "Tasks"],
  85 |     ["/goals", "Goals"],
  86 |     ["/calendar", "Calendar"],
  87 |     ["/analytics", "Analytics"],
  88 |   ] as const) {
> 89 |     await page.goto(path);
     |                ^ Error: page.goto: net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS at http://127.0.0.1:3103/
  90 |     await expect(
  91 |       page.getByRole("heading", { name: heading, exact: false }).first()
  92 |     ).toBeVisible();
  93 |   }
  94 | });
  95 | 
```