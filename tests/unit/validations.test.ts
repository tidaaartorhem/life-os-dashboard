import { describe, expect, it } from "vitest";
import {
  taskSchema,
  goalSchema,
  milestoneSchema,
  habitSchema,
  eventSchema,
  transactionSchema,
  noteSchema,
  projectSchema,
  tagSchema,
} from "@/lib/validations";

describe("taskSchema", () => {
  it("accepts a minimal task", () => {
    const parsed = taskSchema.parse({ title: "Buy milk" });
    expect(parsed.title).toBe("Buy milk");
    expect(parsed.status).toBe("todo");
    expect(parsed.priority).toBe("medium");
    expect(parsed.tagIds).toEqual([]);
  });

  it("rejects an empty title", () => {
    expect(() => taskSchema.parse({ title: "   " })).toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() =>
      taskSchema.parse({ title: "x", status: "in-progress" })
    ).toThrow();
  });

  it("coerces date strings to Date", () => {
    const parsed = taskSchema.parse({ title: "x", dueDate: "2026-10-05" });
    expect(parsed.dueDate).toBeInstanceOf(Date);
  });
});

describe("goalSchema", () => {
  it("accepts a minimal goal and defaults to active", () => {
    const parsed = goalSchema.parse({ title: "Run 10K" });
    expect(parsed.status).toBe("active");
  });

  it("rejects an empty title", () => {
    expect(() => goalSchema.parse({ title: "" })).toThrow();
  });
});

describe("milestoneSchema", () => {
  it("requires a goalId", () => {
    expect(() => milestoneSchema.parse({ title: "M1" })).toThrow();
    expect(
      milestoneSchema.parse({ title: "M1", goalId: "goal-1" }).goalId
    ).toBe("goal-1");
  });
});

describe("habitSchema", () => {
  it("applies defaults", () => {
    const parsed = habitSchema.parse({ name: "Read" });
    expect(parsed.color).toBe("#6366f1");
    expect(parsed.targetPerWeek).toBe(7);
  });

  it("rejects invalid colors", () => {
    expect(() => habitSchema.parse({ name: "x", color: "red" })).toThrow();
  });
});

describe("eventSchema", () => {
  it("accepts a timed event", () => {
    const parsed = eventSchema.parse({
      title: "Dentist",
      startsAt: "2026-10-01T09:00",
      endsAt: "2026-10-01T10:00",
    });
    expect(parsed.startsAt).toBeInstanceOf(Date);
    expect(parsed.allDay).toBe(false);
  });
});

describe("transactionSchema", () => {
  it("requires a positive amount", () => {
    expect(() =>
      transactionSchema.parse({
        label: "Coffee",
        amount: -5,
        category: "Food",
        date: "2026-09-30",
        kind: "expense",
      })
    ).toThrow();
    const parsed = transactionSchema.parse({
      label: "Coffee",
      amount: 5,
      category: "Food",
      date: "2026-09-30",
      kind: "expense",
    });
    expect(parsed.amount).toBe(5);
  });
});

describe("noteSchema", () => {
  it("requires a title", () => {
    expect(() => noteSchema.parse({ title: "", body: "x" })).toThrow();
  });
});

describe("projectSchema / tagSchema", () => {
  it("applies default colors", () => {
    expect(projectSchema.parse({ name: "Work" }).color).toBe("#6366f1");
    expect(tagSchema.parse({ name: "deep" }).color).toBe("#64748b");
  });
});
