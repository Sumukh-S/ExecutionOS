"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlarmClock, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Priority, TaskRecord } from "@/contexts/execution-data";

export type TaskFormValues = {
  title: string;
  scope: string;
  firstAction: string;
  outcome: string;
  priority: Priority;
  predictedDifficulty: number;
  scheduledStart: string;
  expectedDuration: number;
  deadline: string;
  location: string;
  alarm: boolean;
  wish: string;
  obstacle: string;
  notes: string;
  resources: string;
  listName: string;
  icon: string;
  isMain?: boolean;
  parentId?: string | null;
  weeklyGoal?: string;
  monthlyGoal?: string;
};

const inputClass = "mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function addMinutes(value: string, minutes: number) {
  if (!value || !minutes) return "";
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export function taskToFormValues(task?: TaskRecord | null, defaults?: Partial<TaskFormValues>): TaskFormValues {
  return {
    title: task?.title ?? defaults?.title ?? "",
    scope: task?.scope ?? defaults?.scope ?? "",
    firstAction: task?.firstAction ?? defaults?.firstAction ?? "",
    outcome: task?.outcome ?? defaults?.outcome ?? "",
    priority: task?.priority ?? defaults?.priority ?? "medium",
    predictedDifficulty: task?.predictedDifficulty ?? defaults?.predictedDifficulty ?? 7,
    scheduledStart: toLocalInput(task?.scheduledStart) || defaults?.scheduledStart || "",
    expectedDuration: task?.expectedDuration ?? defaults?.expectedDuration ?? 30,
    deadline: toLocalInput(task?.deadline) || defaults?.deadline || "",
    location: task?.location ?? defaults?.location ?? "",
    alarm: task?.alarm ?? defaults?.alarm ?? false,
    wish: task?.wish ?? defaults?.wish ?? "",
    obstacle: task?.obstacle ?? defaults?.obstacle ?? "",
    notes: task?.notes ?? defaults?.notes ?? "",
    resources: task?.resources ?? defaults?.resources ?? "",
    listName: task?.listName ?? defaults?.listName ?? "Personal",
    icon: task?.icon ?? defaults?.icon ?? "✅",
    isMain: task?.isMain ?? defaults?.isMain,
    parentId: task?.parentId ?? defaults?.parentId ?? null,
    weeklyGoal: task?.weeklyGoal ?? defaults?.weeklyGoal ?? "",
    monthlyGoal: task?.monthlyGoal ?? defaults?.monthlyGoal ?? "",
  };
}

export function formValuesToTaskPayload(values: TaskFormValues) {
  const scheduledStart = toIso(values.scheduledStart);
  const scheduledEnd = values.scheduledStart && values.expectedDuration ? addMinutes(values.scheduledStart, values.expectedDuration) : "";
  return {
    title: values.title.trim(),
    description: values.scope,
    scope: values.scope,
    firstAction: values.firstAction,
    outcome: values.outcome,
    priority: values.priority,
    predictedDifficulty: Number(values.predictedDifficulty),
    scheduledStart,
    scheduledEnd,
    plannedEnd: scheduledEnd,
    expectedDuration: Number(values.expectedDuration) || 0,
    deadline: toIso(values.deadline),
    location: values.location,
    alarm: values.alarm,
    wish: values.wish,
    obstacle: values.obstacle,
    notes: values.notes,
    resources: values.resources,
    listName: values.listName || "Personal",
    icon: values.icon || "✅",
    isMain: values.isMain,
    parentId: values.parentId ?? null,
    weeklyGoal: values.weeklyGoal ?? "",
    monthlyGoal: values.monthlyGoal ?? "",
  };
}

export function TaskFormDialog({
  title,
  description,
  initialValues,
  todayOnly = false,
  submitLabel = "Save task",
  onSubmit,
  onClose,
}: {
  title: string;
  description: string;
  initialValues: TaskFormValues;
  todayOnly?: boolean;
  submitLabel?: string;
  onSubmit: (values: TaskFormValues) => string | void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const plannedEnd = useMemo(() => addMinutes(values.scheduledStart, Number(values.expectedDuration)), [values.expectedDuration, values.scheduledStart]);
  const setValue = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.title.trim() || !values.scope.trim() || !values.firstAction.trim()) {
      setError("Add a title, scope / description, and first action before saving.");
      return;
    }
    if (todayOnly && [values.scheduledStart, values.deadline].some((value) => value && !value.startsWith(today))) {
      setError("Today only allows today's date. Use Tasks for other dates.");
      return;
    }
    const result = onSubmit(values);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 p-4">
      <form onSubmit={submit} className="mx-auto my-4 max-w-3xl rounded-xl border border-border bg-card p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-xl font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent border border-border/40" onClick={onClose} aria-label="Close task form"><X className="h-5 w-5" /></Button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}

        <section className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">A. Task Definition</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium md:col-span-2">Task title<input className={inputClass} value={values.title} onChange={(event) => setValue("title", event.target.value)} required /></label>
            <label className="text-sm font-medium">Scope / description<textarea className={`${inputClass} h-20 py-2`} value={values.scope} onChange={(event) => setValue("scope", event.target.value)} required /></label>
            <label className="text-sm font-medium">First action<textarea className={`${inputClass} h-20 py-2`} value={values.firstAction} onChange={(event) => setValue("firstAction", event.target.value)} required /></label>
            <label className="text-sm font-medium">Expected outcome<input className={inputClass} value={values.outcome} onChange={(event) => setValue("outcome", event.target.value)} /></label>
            <label className="text-sm font-medium">Priority<select className={inputClass} value={values.priority} onChange={(event) => setValue("priority", event.target.value as Priority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label className="text-sm font-medium">Predicted difficulty<input type="number" min="1" max="10" className={inputClass} value={values.predictedDifficulty} onChange={(event) => setValue("predictedDifficulty", Number(event.target.value))} required /></label>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">B. Scheduling</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">Start date and time<input type="datetime-local" min={todayOnly ? `${today}T00:00` : undefined} max={todayOnly ? `${today}T23:59` : undefined} className={inputClass} value={values.scheduledStart} onChange={(event) => setValue("scheduledStart", event.target.value)} /></label>
            <label className="text-sm font-medium">Estimated duration (minutes)<input type="number" min="0" className={inputClass} value={values.expectedDuration} onChange={(event) => setValue("expectedDuration", Number(event.target.value))} /></label>
            <div className="rounded-lg border border-border bg-background p-3 text-sm"><p className="label">Planned end time</p><p className="mt-1">{plannedEnd ? new Date(plannedEnd).toLocaleString() : "Add start + duration"}</p></div>
            <label className="text-sm font-medium">Fixed deadline<input type="datetime-local" min={todayOnly ? `${today}T00:00` : undefined} max={todayOnly ? `${today}T23:59` : undefined} className={inputClass} value={values.deadline} onChange={(event) => setValue("deadline", event.target.value)} /></label>
            <label className="text-sm font-medium">Location<input className={inputClass} value={values.location} onChange={(event) => setValue("location", event.target.value)} /></label>
            <label className="flex items-center gap-2 self-end rounded-md border border-border p-3 text-sm font-medium"><input type="checkbox" checked={values.alarm} onChange={(event) => setValue("alarm", event.target.checked)} /><AlarmClock className="h-4 w-4 text-primary" />Reminder / alarm</label>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border">
          <button type="button" className="flex w-full items-center justify-between p-4 text-sm font-semibold" onClick={() => setShowDetails((open) => !open)}>C. Additional Details <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} /></button>
          {showDetails && <div className="grid gap-4 border-t border-border p-4 md:grid-cols-2">
            <label className="text-sm font-medium">Why / motivation<textarea className={`${inputClass} h-20 py-2`} value={values.wish} onChange={(event) => setValue("wish", event.target.value)} /></label>
            <label className="text-sm font-medium">Likely obstacles<textarea className={`${inputClass} h-20 py-2`} value={values.obstacle} onChange={(event) => setValue("obstacle", event.target.value)} /></label>
            <label className="text-sm font-medium">Notes<textarea className={`${inputClass} h-20 py-2`} value={values.notes} onChange={(event) => setValue("notes", event.target.value)} /></label>
            <label className="text-sm font-medium">Links / resources<input className={inputClass} value={values.resources} onChange={(event) => setValue("resources", event.target.value)} /></label>
          </div>}
        </section>

        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">{submitLabel}</Button></div>
      </form>
    </div>
  );
}
