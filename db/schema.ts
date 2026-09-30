import { relations } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const pk = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable("users", {
  id: pk(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const projects = sqliteTable(
  "projects",
  {
    id: pk(),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("projects_user_idx").on(t.userId)]
);

export const tags = sqliteTable(
  "tags",
  {
    id: pk(),
    name: text("name").notNull(),
    color: text("color").notNull().default("#64748b"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("tags_user_idx").on(t.userId),
    uniqueIndex("tags_user_name_uidx").on(t.userId, t.name),
  ]
);

// status: "todo" | "in_progress" | "done"
// priority: "low" | "medium" | "high" | "urgent"
export const tasks = sqliteTable(
  "tasks",
  {
    id: pk(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    position: real("position").notNull().default(0),
    estimatedMinutes: integer("estimated_minutes"),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),
    milestoneId: text("milestone_id").references(() => milestones.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("tasks_user_status_idx").on(t.userId, t.status),
    index("tasks_user_due_idx").on(t.userId, t.dueDate),
    index("tasks_goal_idx").on(t.goalId),
    index("tasks_milestone_idx").on(t.milestoneId),
  ]
);

export const taskTags = sqliteTable(
  "task_tags",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })]
);

// status: "active" | "paused" | "completed" | "archived"
export const goals = sqliteTable(
  "goals",
  {
    id: pk(),
    title: text("title").notNull(),
    description: text("description"),
    targetDate: integer("target_date", { mode: "timestamp" }),
    status: text("status").notNull().default("active"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("goals_user_status_idx").on(t.userId, t.status)]
);

export const milestones = sqliteTable(
  "milestones",
  {
    id: pk(),
    title: text("title").notNull(),
    targetDate: integer("target_date", { mode: "timestamp" }),
    status: text("status").notNull().default("active"),
    position: real("position").notNull().default(0),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("milestones_goal_idx").on(t.goalId)]
);

export const habits = sqliteTable(
  "habits",
  {
    id: pk(),
    name: text("name").notNull(),
    icon: text("icon"),
    color: text("color").notNull().default("#6366f1"),
    targetPerWeek: integer("target_per_week").notNull().default(7),
    position: real("position").notNull().default(0),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("habits_user_idx").on(t.userId)]
);

export const habitLogs = sqliteTable(
  "habit_logs",
  {
    id: pk(),
    habitId: text("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: integer("date", { mode: "timestamp" }).notNull(),
    completed: integer("completed", { mode: "boolean" }).notNull().default(true),
    note: text("note"),
  },
  (t) => [
    index("habit_logs_habit_date_idx").on(t.habitId, t.date),
    uniqueIndex("habit_logs_habit_date_uidx").on(t.habitId, t.date),
  ]
);

export const calendarEvents = sqliteTable(
  "calendar_events",
  {
    id: pk(),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
    endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
    allDay: integer("all_day", { mode: "boolean" }).notNull().default(false),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("events_user_starts_idx").on(t.userId, t.startsAt)]
);

// kind: "income" | "expense"
export const transactions = sqliteTable(
  "transactions",
  {
    id: pk(),
    label: text("label").notNull(),
    amount: real("amount").notNull(),
    category: text("category").notNull(),
    date: integer("date", { mode: "timestamp" }).notNull(),
    kind: text("kind").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("transactions_user_date_idx").on(t.userId, t.date)]
);

export const focusSessions = sqliteTable(
  "focus_sessions",
  {
    id: pk(),
    label: text("label"),
    minutes: integer("minutes").notNull(),
    date: integer("date", { mode: "timestamp" }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("focus_user_date_idx").on(t.userId, t.date)]
);

export const notes = sqliteTable(
  "notes",
  {
    id: pk(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("notes_user_idx").on(t.userId)]
);

// ---- Relations (for db.query.* with `with`) ----

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  projects: many(projects),
  tags: many(tags),
  goals: many(goals),
  habits: many(habits),
  events: many(calendarEvents),
  transactions: many(transactions),
  focusSessions: many(focusSessions),
  notes: many(notes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  taskTags: many(taskTags),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  goal: one(goals, { fields: [tasks.goalId], references: [goals.id] }),
  milestone: one(milestones, {
    fields: [tasks.milestoneId],
    references: [milestones.id],
  }),
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  milestones: many(milestones),
  tasks: many(tasks),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  goal: one(goals, { fields: [milestones.goalId], references: [goals.id] }),
  tasks: many(tasks),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, { fields: [habits.userId], references: [users.id] }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, { fields: [habitLogs.habitId], references: [habits.id] }),
}));
