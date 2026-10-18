"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Bell, Sparkles, Repeat, X } from "lucide-react";
import type { MasterTask, Priority, RecurrenceRule } from "@/types/execution-os";
import { useExecutionData } from "@/contexts/execution-data";
import { useNotificationPermission } from "@/lib/notifications";
import { getTodayDateString } from "@/lib/date-utils";

type TaskFormValues = {
  title: string;
  expectedOutcome: string;
  firstAction: string;
  priority: Priority;
  predictedDifficulty: number;
  expectedDuration: number;
  scheduledDate: string;
  scheduledTime: string;
  deadline: string;
  hasAlarm: boolean;
  alarmTime: string;
  alarmSetConfirmed: boolean;
  description: string;
  notes: string;
  goalId: string;
  progress: number;
  wish: string;
  outcome: string;
  obstacle: string;
  plan: string;

  // Recurrence
  isRecurring: boolean;
  frequency: "daily" | "weekly" | "selected_days" | "monthly" | "interval_days";
  weekdays: number[];
  monthDay: number | null;
  intervalDays: number;
  recurrenceStartDate: string;
  recurrenceEndDate: string;
};

export function TaskFormDialog({
  isOpen,
  onClose,
  initialTask,
  initialDate,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: MasterTask | null;
  initialDate?: string;
  onSubmit: (
    values: Partial<MasterTask>,
    recurrenceRule?: Omit<RecurrenceRule, "id" | "userId" | "createdAt" | "updatedAt"> | null
  ) => void;
}) {
  const { goals, recurrenceRules } = useExecutionData();
  const { isSupported, isGranted, requestPermission } = useNotificationPermission();
  const [showMentalPrep, setShowMentalPrep] = useState(Boolean(initialTask?.wish || initialTask?.obstacle));
  const [showDetails, setShowDetails] = useState(Boolean(initialTask?.description || initialTask?.notes));
  const [showRepeat, setShowRepeat] = useState(Boolean(initialTask?.recurrenceId));

  const existingRule = initialTask?.recurrenceId
    ? recurrenceRules.find((r) => r.id === initialTask.recurrenceId)
    : null;

  const [form, setForm] = useState<TaskFormValues>({
    title: initialTask?.title || "",
    expectedOutcome: initialTask?.expectedOutcome || "",
    firstAction: initialTask?.firstAction || "",
    priority: initialTask?.priority || "medium",
    predictedDifficulty: initialTask?.predictedDifficulty ?? 5,
    expectedDuration: initialTask?.expectedDuration ?? 30,
    scheduledDate: initialTask?.scheduledDate || initialDate || "",
    scheduledTime: initialTask?.scheduledTime || "",
    deadline: initialTask?.deadline ? initialTask.deadline.slice(0, 16) : "",
    hasAlarm: initialTask?.hasAlarm ?? false,
    alarmTime: initialTask?.alarmTime ? initialTask.alarmTime.slice(0, 16) : "",
    alarmSetConfirmed: initialTask?.alarmSetConfirmed ?? false,
    description: initialTask?.description || "",
    notes: initialTask?.notes || "",
    goalId: initialTask?.goalId || "",
    progress: initialTask?.progress ?? 0,
    wish: initialTask?.wish || "",
    outcome: initialTask?.outcome || "",
    obstacle: initialTask?.obstacle || "",
    plan: initialTask?.plan || "",

    // Recurrence defaults
    isRecurring: Boolean(initialTask?.recurrenceId),
    frequency: existingRule?.frequency || "daily",
    weekdays: existingRule?.weekdays || [1, 2, 3, 4, 5],
    monthDay: existingRule?.monthDay || 1,
    intervalDays: existingRule?.intervalDays || 1,
    recurrenceStartDate: existingRule?.startDate || initialDate || getTodayDateString(),
    recurrenceEndDate: existingRule?.endDate || "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const recurrencePayload = form.isRecurring
      ? {
          frequency: form.frequency,
          weekdays: form.frequency === "selected_days" ? form.weekdays : [],
          monthDay: form.frequency === "monthly" ? Number(form.monthDay) || 1 : null,
          intervalDays: form.frequency === "interval_days" ? Number(form.intervalDays) || 1 : 1,
          startDate: form.recurrenceStartDate || form.scheduledDate || getTodayDateString(),
          endDate: form.recurrenceEndDate || null,
          isActive: true,
        }
      : null;

    onSubmit(
      {
        title: form.title.trim(),
        expectedOutcome: form.expectedOutcome.trim(),
        firstAction: form.firstAction.trim(),
        priority: form.priority,
        predictedDifficulty: Number(form.predictedDifficulty),
        expectedDuration: Number(form.expectedDuration),
        scheduledDate: form.scheduledDate || null,
        scheduledTime: form.scheduledTime || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        hasAlarm: form.hasAlarm,
        alarmTime: form.alarmTime ? new Date(form.alarmTime).toISOString() : null,
        alarmSetConfirmed: form.alarmSetConfirmed,
        description: form.description.trim(),
        notes: form.notes.trim(),
        goalId: form.goalId || null,
        progress: Number(form.progress),
        wish: form.wish.trim(),
        outcome: form.outcome.trim(),
        obstacle: form.obstacle.trim(),
        plan: form.plan.trim(),
      },
      recurrencePayload
    );
    onClose();
  };

  const handleToggleAlarm = async () => {
    if (!form.hasAlarm && isSupported && !isGranted) {
      await requestPermission();
    }
    setForm((prev) => ({ ...prev, hasAlarm: !prev.hasAlarm }));
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {initialTask ? "Edit Task" : "Create Master Task"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {initialTask ? "Update task definition." : "Quickly capture an action. Fill only what is necessary."}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title *</label>
            <Input
              autoFocus
              required
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 font-medium"
            />
          </div>

          {/* First Action & Expected Outcome */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Action</label>
              <Input
                placeholder="Immediate microscopic step..."
                value={form.firstAction}
                onChange={(e) => setForm({ ...form, firstAction: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Outcome</label>
              <Input
                placeholder="Clear finished result..."
                value={form.expectedOutcome}
                onChange={(e) => setForm({ ...form, expectedOutcome: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Priority & Predicted Difficulty (1-10) & Duration */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Difficulty: {form.predictedDifficulty}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.predictedDifficulty}
                onChange={(e) => setForm({ ...form, predictedDifficulty: Number(e.target.value) })}
                className="mt-3 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Est. Duration (min)</label>
              <Input
                type="number"
                min="1"
                max="480"
                value={form.expectedDuration}
                onChange={(e) => setForm({ ...form, expectedDuration: Number(e.target.value) })}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Scheduling & Deadlines */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Date</label>
              <Input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled Time</label>
              <Input
                type="time"
                value={form.scheduledTime}
                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exact Deadline</label>
              <Input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
          </div>

          {/* Alarm / Reminder Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span>Did you set an alarm / reminder?</span>
            </div>
            <Button
              type="button"
              variant={form.hasAlarm ? "default" : "outline"}
              size="sm"
              onClick={handleToggleAlarm}
            >
              {form.hasAlarm ? "Alarm Enabled" : "Enable Alarm"}
            </Button>
          </div>

          {/* Repeat / Recurrence Accordion */}
          <div className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setShowRepeat((v) => !v)}
              className="flex w-full items-center justify-between p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/40"
            >
              <span className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-primary" />
                {form.isRecurring ? `Repeating (${form.frequency})` : "Does Not Repeat"}
              </span>
              {showRepeat ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showRepeat && (
              <div className="space-y-3 border-t border-border p-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Enable Recurrence</label>
                  <Button
                    type="button"
                    variant={form.isRecurring ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm((prev) => ({ ...prev, isRecurring: !prev.isRecurring }))}
                  >
                    {form.isRecurring ? "Repeat Enabled" : "Does Not Repeat"}
                  </Button>
                </div>

                {form.isRecurring && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Recurrence Rule</label>
                      <select
                        value={form.frequency}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            frequency: e.target.value as TaskFormValues["frequency"],
                          })
                        }
                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="daily">Every day</option>
                        <option value="weekly">Every week</option>
                        <option value="selected_days">Selected weekdays</option>
                        <option value="monthly">Every month</option>
                        <option value="interval_days">Every X days</option>
                      </select>
                    </div>

                    {form.frequency === "selected_days" && (
                      <div>
                        <label className="text-xs text-muted-foreground">Select Days of Week</label>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {[
                            { day: 1, label: "Mon" },
                            { day: 2, label: "Tue" },
                            { day: 3, label: "Wed" },
                            { day: 4, label: "Thu" },
                            { day: 5, label: "Fri" },
                            { day: 6, label: "Sat" },
                            { day: 0, label: "Sun" },
                          ].map(({ day, label }) => {
                            const selected = form.weekdays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const next = selected
                                    ? form.weekdays.filter((d) => d !== day)
                                    : [...form.weekdays, day];
                                  setForm({ ...form, weekdays: next });
                                }}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {form.frequency === "interval_days" && (
                      <div>
                        <label className="text-xs text-muted-foreground">Interval in Days</label>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={form.intervalDays}
                          onChange={(e) => setForm({ ...form, intervalDays: Number(e.target.value) || 1 })}
                          className="mt-1 text-sm"
                        />
                      </div>
                    )}

                    {form.frequency === "monthly" && (
                      <div>
                        <label className="text-xs text-muted-foreground">Day of Month (1–31)</label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={form.monthDay || 1}
                          onChange={(e) => setForm({ ...form, monthDay: Number(e.target.value) || 1 })}
                          className="mt-1 text-sm"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                      <div>
                        <label className="text-xs text-muted-foreground">Recurrence Start Date</label>
                        <Input
                          type="date"
                          value={form.recurrenceStartDate}
                          onChange={(e) => setForm({ ...form, recurrenceStartDate: e.target.value })}
                          className="mt-1 text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground">Optional End Date (or blank for indefinite)</label>
                        <Input
                          type="date"
                          value={form.recurrenceEndDate}
                          onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Goal Association */}
          {goals.length > 0 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Associated Goal (Optional)</label>
              <select
                value={form.goalId}
                onChange={(e) => setForm({ ...form, goalId: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No goal linked</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mental Preparation Accordion */}
          <div className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setShowMentalPrep((v) => !v)}
              className="flex w-full items-center justify-between p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/40"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Mental Preparation (WOOP / MCII)
              </span>
              {showMentalPrep ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showMentalPrep && (
              <div className="space-y-3 border-t border-border p-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Wish (What do I want?)</label>
                    <Input
                      placeholder="e.g. Finish DSA chapter comfortably"
                      value={form.wish}
                      onChange={(e) => setForm({ ...form, wish: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Outcome (Best positive result)</label>
                    <Input
                      placeholder="e.g. Confident with binary search"
                      value={form.outcome}
                      onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Obstacle (What will distract me?)</label>
                    <Input
                      placeholder="e.g. Phone scrolling when stuck"
                      value={form.obstacle}
                      onChange={(e) => setForm({ ...form, obstacle: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">If-Then Plan (Counter-action)</label>
                    <Input
                      placeholder="e.g. If stuck, review notes for 2 min"
                      value={form.plan}
                      onChange={(e) => setForm({ ...form, plan: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details & Notes Accordion */}
          <div className="rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex w-full items-center justify-between p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent/40"
            >
              <span>Description & Notes</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDetails && (
              <div className="space-y-3 border-t border-border p-3">
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Details regarding context and materials..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Personal Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any specific instructions, links, or references..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
