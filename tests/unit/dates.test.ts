import { describe, expect, it } from "vitest";
import {
  monthGrid,
  weekColumns,
  toISODate,
  dayBounds,
  weekRange,
  isOverdue,
  toDateInputValue,
  lastNDays,
} from "@/lib/dates";

describe("toISODate", () => {
  it("formats a date as yyyy-MM-dd", () => {
    expect(toISODate(new Date(2026, 8, 30, 15, 45))).toBe("2026-09-30");
  });
});

describe("toDateInputValue", () => {
  it("produces a value suitable for <input type=date>", () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("monthGrid", () => {
  it("returns 6 weeks of 7 days starting on Monday", () => {
    const grid = monthGrid(2026, 8); // September 2026
    expect(grid).toHaveLength(6);
    for (const week of grid) {
      expect(week).toHaveLength(7);
      // getDay(): 0=Sunday..6=Saturday; Monday start means first cell is Monday
      expect(week[0].getDay()).toBe(1);
    }
  });

  it("covers the whole month", () => {
    const grid = monthGrid(2026, 8);
    const days = grid.flat();
    const inMonth = days.filter((d) => d.getMonth() === 8);
    expect(inMonth).toHaveLength(30);
  });
});

describe("weekColumns", () => {
  it("returns 7 consecutive days starting Monday", () => {
    const cols = weekColumns(new Date(2026, 8, 30)); // a Wednesday
    expect(cols).toHaveLength(7);
    expect(cols[0].getDay()).toBe(1);
    expect(cols[0].getDate()).toBe(28);
    expect(cols[6].getDate()).toBe(4); // Oct 4
  });
});

describe("dayBounds", () => {
  it("spans a full local day", () => {
    const { start, end } = dayBounds(new Date(2026, 8, 30, 12, 0));
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });
});

describe("weekRange", () => {
  it("starts on Monday and spans 7 days", () => {
    const { start, end } = weekRange(new Date(2026, 8, 30));
    expect(start.getDay()).toBe(1);
    const diffDays =
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(diffDays)).toBe(8);
  });
});

describe("isOverdue", () => {
  it("flags past dates and ignores today/future/null", () => {
    const past = new Date();
    past.setDate(past.getDate() - 2);
    const future = new Date();
    future.setDate(future.getDate() + 2);
    expect(isOverdue(past)).toBe(true);
    expect(isOverdue(new Date())).toBe(false);
    expect(isOverdue(future)).toBe(false);
    expect(isOverdue(null)).toBe(false);
    expect(isOverdue(undefined)).toBe(false);
  });
});

describe("lastNDays", () => {
  it("returns n days ending today", () => {
    const days = lastNDays(7);
    expect(days).toHaveLength(7);
    expect(toISODate(days[6])).toBe(toISODate(new Date()));
  });
});
