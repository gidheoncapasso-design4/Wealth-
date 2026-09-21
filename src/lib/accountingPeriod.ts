import type { RecurringExpense, Transaction } from "../types";
import { reminderDate } from "./reminderDate";

export const currentPeriod = (reference = new Date()) => reminderDate(reference).today.slice(0, 7);

// A date without a year cannot safely be assigned to a historical month.
export function transactionPeriod(tx: Pick<Transaction, "date" | "period">): string | null {
  if (tx.period && /^\d{4}-(0[1-9]|1[0-2])$/.test(tx.period)) return tx.period;
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(tx.date);
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(tx.date);
  if (!iso && !br) return null;
  const [year, month, day] = iso ? [+iso[1], +iso[2], +iso[3]] : [+br![3], +br![2], +br![1]];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, "0")}` : null;
}

export function isPaidInPeriod(expense: Pick<RecurringExpense, "paidPeriods">, period = currentPeriod()): boolean {
  return expense.paidPeriods?.includes(period) ?? false;
}

export function setPaidInPeriod(expense: RecurringExpense, period: string, paid: boolean): RecurringExpense {
  const periods = (expense.paidPeriods || []).filter((value) => value !== period);
  if (paid) periods.push(period);
  return { ...expense, paidPeriods: periods, paidThisMonth: paid };
}
