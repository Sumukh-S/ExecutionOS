const UTC = "UTC";

export function formatTime(value: string) {
  return value ? new Intl.DateTimeFormat("en-US", { timeZone: UTC, hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "Not scheduled";
}

export function formatDateTime(value: string) {
  return value ? new Intl.DateTimeFormat("en-US", { timeZone: UTC, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "No deadline";
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { timeZone: UTC, weekday: "long", month: "long", day: "numeric" }).format(value);
}

export function formatWeekday(value: string) {
  return value ? new Intl.DateTimeFormat("en-US", { timeZone: UTC, weekday: "long" }).format(new Date(value)) : "";
}

export function formatSessionDate(value: string) {
  return value ? new Intl.DateTimeFormat("en-US", { timeZone: UTC, month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "";
}
