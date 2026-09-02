// Correctly rolls over month/year boundaries (e.g. Aug 31 -> Sep 1, Dec 31 -> Jan 1).
// Replaces the old ">=30 ? 1 : day+1" hack that broke on 31-day months, used both by
// the client (TransactionsView "due tomorrow" banner) and the server (cron reminders),
// so the two never drift apart again.
export function getTomorrowDayOfMonth(referenceDate: Date = new Date()): number {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getDate();
}
