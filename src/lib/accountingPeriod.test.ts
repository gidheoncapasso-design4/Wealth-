import { describe, expect, it } from "vitest";
import { currentPeriod, isPaidInPeriod, setPaidInPeriod, transactionPeriod } from "./accountingPeriod";
import { reminderDate } from "./reminderDate";
import type { RecurringExpense } from "../types";

const expense: RecurringExpense = { id: "bill", title: "Seguro", category: "Outros", amount: 100, dueDate: 1, paidThisMonth: false };

describe("accounting periods", () => {
  it("distinguishes the same month in different years", () => {
    expect(transactionPeriod({ date: "15/09/2025" })).toBe("2025-09");
    expect(transactionPeriod({ date: "2026-09-15" })).toBe("2026-09");
    expect(transactionPeriod({ date: "Recorrente Mensal", period: "2026-09" })).toBe("2026-09");
  });
  it("does not invent dates for legacy, invalid or undated entries", () => {
    for (const date of ["15/Set", "Hoje, 15 de set.", "Recorrente Mensal", "31/02/2026", "2026-13-01", ""]) {
      expect(transactionPeriod({ date })).toBeNull();
    }
  });
  it("uses Brasilia month at the UTC year boundary", () => {
    expect(currentPeriod(new Date("2027-01-01T01:00:00Z"))).toBe("2026-12");
  });
  it("keeps payment history and resets pending status in the next month", () => {
    const paid = setPaidInPeriod(expense, "2026-12", true);
    expect(isPaidInPeriod(paid, "2026-12")).toBe(true);
    expect(isPaidInPeriod(paid, "2027-01")).toBe(false);
    const january = setPaidInPeriod(paid, "2027-01", true);
    expect(setPaidInPeriod(january, "2027-01", false).paidPeriods).toEqual(["2026-12"]);
    expect(setPaidInPeriod(january, "2027-01", true).paidPeriods).toEqual(["2026-12", "2027-01"]);
    expect(expense.paidPeriods).toBeUndefined();
  });
  it("checks next month's payment for a bill due tomorrow", () => {
    const next = reminderDate(new Date("2026-12-31T15:00:00Z"));
    expect(next.tomorrowPeriod).toBe("2027-01");
    const paid = setPaidInPeriod(expense, "2026-12", true);
    expect(isPaidInPeriod(paid, next.tomorrowPeriod)).toBe(false);
  });
  it("does not assign a month to legacy paid flags", () => {
    const legacy = { ...expense, paidThisMonth: true };
    expect(isPaidInPeriod(legacy, "2026-09")).toBe(false);
  });
});
