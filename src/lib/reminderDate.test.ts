import { expect, it } from "vitest";
import { reminderDate } from "./reminderDate";
it("uses Brasilia day before UTC midnight rollover", () => {
  expect(reminderDate(new Date("2026-09-09T01:00:00Z"))).toEqual({ today: "2026-09-08", tomorrowDay: 9 });
});
it("handles month and leap year transitions", () => {
  expect(reminderDate(new Date("2026-12-31T11:00:00Z")).tomorrowDay).toBe(1);
  expect(reminderDate(new Date("2028-02-28T11:00:00Z")).tomorrowDay).toBe(29);
});
