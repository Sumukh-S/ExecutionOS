"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  CheckCircle2,
  Play,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  MoveRight,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { useExecutionData } from "@/contexts/execution-data";
import { getTodayDateString } from "@/lib/date-utils";
import type { MasterTask, TaskOccurrence, DailySection } from "@/types/execution-os";

export default function TodayPage() {
  const todayStr = getTodayDateString();
  const {
    masterTasks,
    occurrences,
    fiveMinuteTasks,
    events,
    createMasterTask,
    updateOccurrence,
    completeOccurrence,
    scheduleTaskToDate,
    addFiveMinuteTask,
    toggleFiveMinuteTask,
    deleteFiveMinuteTask,
    deleteOccurrence,
  } = useExecutionData();

  const [creating, setCreating] = useState(false);
  const [fiveMinInput, setFiveMinInput] = useState("");
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [completionOcc, setCompletionOcc] = useState<{ id: string; title: string } | null>(null);
  const [actualDiff, setActualDiff] = useState(5);
  const [completionNotes, setCompletionNotes] = useState("");

  // Map today's occurrences to master tasks
  const todayOccurrences = useMemo(
    () => occurrences.filter((o) => o.scheduledDate === todayStr && o.status !== "done"),
    [occurrences, todayStr]
  );

  const occurrenceTaskMap = useMemo(() => {
    const map = new Map<string, { occurrence: TaskOccurrence; task: MasterTask }>();
    todayOccurrences.forEach((occ) => {
      const task = masterTasks.find((t) => t.id === occ.taskId && !t.deletedAt);
      if (task) {
        map.set(occ.id, { occurrence: occ, task });
      }
    });
    return map;
  }, [todayOccurrences, masterTasks]);

  // Section divisions
  const mainItems = useMemo(
    () => Array.from(occurrenceTaskMap.values()).filter((item) => item.occurrence.dailySection === "main"),
    [occurrenceTaskMap]
  );

  const supportingItems = useMemo(
    () => Array.from(occurrenceTaskMap.values()).filter((item) => item.occurrence.dailySection === "supporting"),
    [occurrenceTaskMap]
  );

  const easyItems = useMemo(
    () => Array.from(occurrenceTaskMap.values()).filter((item) => item.occurrence.dailySection === "easy"),
    [occurrenceTaskMap]
  );

  // Today's 5-minute tasks
  const todayFiveMin = useMemo(
    () => fiveMinuteTasks.filter((f) => f.date === todayStr),
    [fiveMinuteTasks, todayStr]
  );

  // Today's events
  const todayEvents = useMemo(
    () => events.filter((e) => e.date === todayStr),
    [events, todayStr]
  );

  // Unscheduled tasks available to add
  const unscheduledMasterTasks = useMemo(() => {
    const scheduledTaskIds = new Set(todayOccurrences.map((o) => o.taskId));
    return masterTasks.filter((t) => !scheduledTaskIds.has(t.id) && t.status !== "done" && !t.deletedAt);
  }, [masterTasks, todayOccurrences]);

  const handleCreateTask = async (
    payload: Partial<MasterTask>,
    recurrenceRule?: Omit<import("@/types/execution-os").RecurrenceRule, "id" | "userId" | "createdAt" | "updatedAt"> | null
  ) => {
    await createMasterTask({ ...payload, scheduledDate: todayStr }, recurrenceRule);
  };

  const handleAddFiveMin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiveMinInput.trim()) return;
    await addFiveMinuteTask(fiveMinInput.trim(), todayStr);
    setFiveMinInput("");
  };

  const handleMoveSection = async (occurrenceId: string, section: DailySection) => {
    await updateOccurrence(occurrenceId, { dailySection: section });
  };

  const handleConfirmCompletion = async () => {
    if (!completionOcc) return;
    await completeOccurrence(completionOcc.id, actualDiff, completionNotes);
    setCompletionOcc(null);
    setCompletionNotes("");
    setActualDiff(5);
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Calendar className="h-4 w-4" />
              <span>Daily Execution Workspace</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Today — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              What should I work on today? Focused execution with realistic capacity planning.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowAddExisting(true)} className="gap-2">
              Add from Master
            </Button>
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
        </div>

        {/* Today's Events Banner (if any) */}
        {todayEvents.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Clock className="h-4 w-4" />
              <span>Today's Events & Commitments</span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {todayEvents.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border bg-card p-2.5 text-xs">
                  <p className="font-semibold text-foreground">{ev.title}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {ev.startTime} {ev.endTime ? `– ${ev.endTime}` : ""}{" "}
                    {ev.location ? `· ${ev.location}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section A: Main Tasks (Recommended Max 2) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                A. Main Tasks ({mainItems.length}/2 recommended)
              </h2>
              <p className="text-xs text-muted-foreground">
                Your highest-leverage work for today (suggested difficulty ~7/10).
              </p>
            </div>
          </div>

          {mainItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No main tasks designated for today. Choose up to 2 high-leverage tasks.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {mainItems.map(({ occurrence, task }) => (
                <div key={occurrence.id} className="relative">
                  <TaskCard
                    task={task}
                    onComplete={() => setCompletionOcc({ id: occurrence.id, title: task.title })}
                    onStartFocus={() => (window.location.href = `/focus?task=${task.id}&occ=${occurrence.id}`)}
                    onDelete={() => deleteOccurrence(occurrence.id)}
                  />
                  <div className="mt-1.5 flex items-center justify-end gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Move to:</span>
                    <button
                      onClick={() => handleMoveSection(occurrence.id, "supporting")}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      Supporting
                    </button>
                    <button
                      onClick={() => handleMoveSection(occurrence.id, "easy")}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      Easy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section B: Supporting Tasks (~3-4 Tasks) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                B. Supporting Tasks ({supportingItems.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Tasks that support weekly and monthly goals (suggested difficulty ~5/10).
              </p>
            </div>
          </div>

          {supportingItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No supporting tasks scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {supportingItems.map(({ occurrence, task }) => (
                <div key={occurrence.id} className="relative">
                  <TaskCard
                    task={task}
                    onComplete={() => setCompletionOcc({ id: occurrence.id, title: task.title })}
                    onStartFocus={() => (window.location.href = `/focus?task=${task.id}&occ=${occurrence.id}`)}
                    onDelete={() => deleteOccurrence(occurrence.id)}
                  />
                  <div className="mt-1.5 flex items-center justify-end gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Move to:</span>
                    <button
                      onClick={() => handleMoveSection(occurrence.id, "main")}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      Main
                    </button>
                    <button
                      onClick={() => handleMoveSection(occurrence.id, "easy")}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      Easy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section C: Easy Tasks (Straightforward ~3/10) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                C. Easy Tasks ({easyItems.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Straightforward tasks with low friction (suggested difficulty ~3/10).
              </p>
            </div>
          </div>

          {easyItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No easy tasks scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {easyItems.map(({ occurrence, task }) => (
                <div key={occurrence.id} className="relative">
                  <TaskCard
                    task={task}
                    onComplete={() => setCompletionOcc({ id: occurrence.id, title: task.title })}
                    onStartFocus={() => (window.location.href = `/focus?task=${task.id}&occ=${occurrence.id}`)}
                    onDelete={() => deleteOccurrence(occurrence.id)}
                  />
                  <div className="mt-1.5 flex items-center justify-end gap-1.5 text-xs">
                    <span className="text-[11px] text-muted-foreground">Move to:</span>
                    <button
                      onClick={() => handleMoveSection(occurrence.id, "main")}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      Main
                    </button>
                    <button
                      onClick={() => handleMoveSection(occurrence.id, "supporting")}
                      className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      Supporting
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Five-Minute Tasks — Dedicated Lightweight Daily Checklist */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Five-Minute Tasks</h2>
              <p className="text-xs text-muted-foreground">
                Lightweight daily checklist for quick actions (emails, bills, small chores).
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {todayFiveMin.filter((f) => f.completed).length}/{todayFiveMin.length} completed
            </span>
          </div>

          {/* Add 5-Minute Item */}
          <form onSubmit={handleAddFiveMin} className="mt-4 flex gap-2">
            <Input
              value={fiveMinInput}
              onChange={(e) => setFiveMinInput(e.target.value)}
              placeholder="Quick action (e.g., Pay electricity bill, reply to email)..."
              className="text-sm"
            />
            <Button type="submit" size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>

          {/* Checklist Items */}
          <div className="mt-4 space-y-2">
            {todayFiveMin.length === 0 ? (
              <p className="py-2 text-xs italic text-muted-foreground">No five-minute tasks yet for today.</p>
            ) : (
              todayFiveMin.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border/80 bg-background/50 px-3 py-2 text-sm"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleFiveMinuteTask(item.id)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className={item.completed ? "line-through text-muted-foreground" : "text-foreground"}>
                      {item.title}
                    </span>
                  </label>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteFiveMinuteTask(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Create Task Dialog */}
      <TaskFormDialog
        isOpen={creating}
        initialDate={todayStr}
        onClose={() => setCreating(false)}
        onSubmit={handleCreateTask}
      />

      {/* Add from Master Modal */}
      {showAddExisting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Add Task to Today</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select any active task from your master collection to schedule for today.
            </p>

            <div className="mt-4 space-y-2">
              {unscheduledMasterTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  All active tasks are already scheduled for today!
                </p>
              ) : (
                unscheduledMasterTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Priority: {task.priority} · Difficulty: {task.predictedDifficulty}/10
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await scheduleTaskToDate(task.id, todayStr, "supporting");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowAddExisting(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Difficulty Modal */}
      {completionOcc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Complete Task</h2>
            <p className="mt-1 text-sm text-muted-foreground">"{completionOcc.title}"</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  How difficult did this actually feel? ({actualDiff}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={actualDiff}
                  onChange={(e) => setActualDiff(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Reflection / Notes (Optional)
                </label>
                <Input
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Any key takeaway from this task..."
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setCompletionOcc(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmCompletion} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Confirm Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
