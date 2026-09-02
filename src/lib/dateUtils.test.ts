import { describe, it, expect } from "vitest";
import { getTomorrowDayOfMonth } from "./dateUtils";

describe("getTomorrowDayOfMonth", () => {
  it("returns the next day within a normal month", () => {
    expect(getTomorrowDayOfMonth(new Date(2026, 8, 2))).toBe(3); // Sep 2 -> Sep 3
  });

  it("rolls over correctly on a 31-day month (the original bug)", () => {
    // The old ">= 30 ? 1 : day + 1" logic wrongly returned 1 for day 30 in a
    // 31-day month (should be 31), and wrongly returned 1 for day 31 too.
    expect(getTomorrowDayOfMonth(new Date(2026, 7, 30))).toBe(31); // Aug 30 -> Aug 31
    expect(getTomorrowDayOfMonth(new Date(2026, 7, 31))).toBe(1); // Aug 31 -> Sep 1
  });

  it("rolls over correctly on a 30-day month", () => {
    expect(getTomorrowDayOfMonth(new Date(2026, 8, 30))).toBe(1); // Sep 30 -> Oct 1
  });

  it("rolls over the year boundary", () => {
    expect(getTomorrowDayOfMonth(new Date(2026, 11, 31))).toBe(1); // Dec 31 -> Jan 1
  });

  it("handles a leap-year February correctly", () => {
    expect(getTomorrowDayOfMonth(new Date(2028, 1, 29))).toBe(1); // Feb 29, 2028 (leap) -> Mar 1
  });
});
