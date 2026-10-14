import type { MasterTask, RecurrenceRule, TaskOccurrence } from "@/types/execution-os";

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysToDate(dateString: string, days: number): string {
  const d = new Date(dateString + "T00:00:00");
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function getTomorrowDateString(): string {
  return addDaysToDate(getTodayDateString(), 1);
}

/**
 * Calculates countdown string to a deadline in human readable format.
 * Returns null if no exact deadline timestamp.
 */
export function getDeadlineCountdown(deadlineIso: string | null): {
  label: string;
  isOverdue: boolean;
  isClose: boolean;
} | null {
  if (!deadlineIso) return null;
  const deadlineTime = new Date(deadlineIso).getTime();
  if (isNaN(deadlineTime)) return null;

  const now = Date.now();
  const diffMs = deadlineTime - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const hours = Math.floor(overdueMs / (1000 * 60 * 60));
    const mins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      label: hours > 0 ? `Deadline passed ${hours}h ${mins}m ago` : `Deadline passed ${mins}m ago`,
      isOverdue: true,
      isClose: false,
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let label = "";
  if (days > 0) {
    label = `${days}d ${hours}h remaining`;
  } else if (hours > 0) {
    label = `${hours}h ${mins}m remaining`;
  } else {
    label = `${mins}m remaining`;
  }

  return {
    label,
    isOverdue: false,
    isClose: diffMs < 24 * 60 * 60 * 1000,
  };
}

/**
 * Determines whether a recurring rule matches a specific date.
 */
export function doesRecurrenceMatchDate(rule: RecurrenceRule, dateString: string): boolean {
  if (!rule.isActive) return false;
  if (dateString < rule.startDate) return false;
  if (rule.endDate && dateString > rule.endDate) return false;

  const targetDate = new Date(dateString + "T00:00:00");
  const startDate = new Date(rule.startDate + "T00:00:00");

  switch (rule.frequency) {
    case "daily":
      return true;

    case "weekly": {
      return targetDate.getDay() === startDate.getDay();
    }

    case "selected_days": {
      const day = targetDate.getDay();
      return Array.isArray(rule.weekdays) && rule.weekdays.includes(day);
    }

    case "monthly": {
      const targetDayOfMonth = targetDate.getDate();
      const ruleDay = rule.monthDay ?? startDate.getDate();
      return targetDayOfMonth === ruleDay;
    }

    case "interval_days": {
      const interval = Math.max(1, rule.intervalDays || 1);
      const diffTime = targetDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % interval === 0;
    }

    default:
      return false;
  }
}
