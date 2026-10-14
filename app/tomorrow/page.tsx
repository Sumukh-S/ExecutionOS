"use client";

import { useMemo, useState } from "react";
import { Plus, Calendar, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { useExecutionData } from "@/contexts/execution-data";
import { getTomorrowDateString } from "@/lib/date-utils";
import type { MasterTask, TaskOccurrence, DailySection } from "@/types/execution-os";

export default function TomorrowPage() {
  const tomorrowStr = getTomorrowDateString();
  const {
    masterTasks,
    occurrences,
    fiveMinuteTasks,
    events,
    createMasterTask,
    updateOccurrence,
    scheduleTaskToDate,
    addFiveMinuteTask,
    toggleFiveMinuteTask,
    deleteFiveMinuteTask,
    deleteOccurrence,
  } = useExecutionData();

  const [creating, setCreating] = useState(false);
  const [fiveMinInput, setFiveMinInput] = useState("");
  const [showAddExisting, setShowAddExisting] = useState(false);

  // Map tomorrow's occurrences to master tasks
  const tomorrowOccurrences = useMemo(
    () => occurrences.filter((o) => o.scheduledDate === tomorrowStr && o.status !== "done"),
    [occurrences, tomorrowStr]
  );

  const occurrenceTaskMap = useMemo(() => {
    const map = new Map<string, { occurrence: TaskOccurrence; task: MasterTask }>();
    tomorrowOccurrences.forEach((occ) => {
      const task = masterTasks.find((t) => t.id === occ.taskId && !t.deletedAt);
      if (task) {
        map.set(occ.id, { occurrence: occ, task });
      }
    });
    return map;
  }, [tomorrowOccurrences, masterTasks]);

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

  // Tomorrow's 5-minute tasks
  const tomorrowFiveMin = useMemo(
    () => fiveMinuteTasks.filter((f) => f.date === tomorrowStr),
    [fiveMinuteTasks, tomorrowStr]
  );

  // Tomorrow's events
  const tomorrowEvents = useMemo(
    () => events.filter((e) => e.date === tomorrowStr),
    [events, tomorrowStr]
  );

  // Unscheduled tasks available to add
  const unscheduledMasterTasks = useMemo(() => {
    const scheduledTaskIds = new Set(tomorrowOccurrences.map((o) => o.taskId));
    return masterTasks.filter((t) => !scheduledTaskIds.has(t.id) && t.status !== "done" && !t.deletedAt);
  }, [masterTasks, tomorrowOccurrences]);

  // Workload estimation
  const totalEstimatedMinutes = useMemo(() => {
    return Array.from(occurrenceTaskMap.values()).reduce(
      (acc, item) => acc + (item.task.expectedDuration || 30),
      0
    );
  }, [occurrenceTaskMap]);

  const handleCreateTask = async (payload: Partial<MasterTask>) => {
    await createMasterTask({ ...payload, scheduledDate: tomorrowStr });
  };

  const handleAddFiveMin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiveMinInput.trim()) return;
    await addFiveMinuteTask(fiveMinInput.trim(), tomorrowStr);
    setFiveMinInput("");
  };

  const handleMoveSection = async (occurrenceId: string, section: DailySection) => {
    await updateOccurrence(occurrenceId, { dailySection: section });
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
              <Calendar className="h-4 w-4" />
              <span>Preparation & Continuity</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Tomorrow — {new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Prepare tomorrow before sleeping to wake up with clarity and intention.
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

        {/* Capacity / Workload Overview */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Estimated Workload</p>
              <p className="text-xs text-muted-foreground">
                {tomorrowOccurrences.length} planned tasks · ~{Math.round(totalEstimatedMinutes / 60)}h {totalEstimatedMinutes % 60}m focus time
              </p>
            </div>
          </div>
        </div>

        {/* Tomorrow's Events */}
        {tomorrowEvents.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tomorrow's Events</p>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {tomorrowEvents.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border bg-background p-2.5 text-xs">
                  <p className="font-semibold text-foreground">{ev.title}</p>
                  <p className="mt-0.5 text-muted-foreground">{ev.startTime} {ev.endTime ? `– ${ev.endTime}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section A: Main Tasks */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">A. Main Tasks ({mainItems.length}/2)</h2>
            <p className="text-xs text-muted-foreground">Tomorrow's most critical commitments.</p>
          </div>

          {mainItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No main tasks chosen for tomorrow.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {mainItems.map(({ occurrence, task }) => (
                <div key={occurrence.id} className="relative">
                  <TaskCard task={task} onDelete={() => deleteOccurrence(occurrence.id)} />
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

        {/* Section B: Supporting Tasks */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">B. Supporting Tasks ({supportingItems.length})</h2>
          </div>

          {supportingItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No supporting tasks scheduled for tomorrow.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {supportingItems.map(({ occurrence, task }) => (
                <div key={occurrence.id} className="relative">
                  <TaskCard task={task} onDelete={() => deleteOccurrence(occurrence.id)} />
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

        {/* Section C: Easy Tasks */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">C. Easy Tasks ({easyItems.length})</h2>
          </div>

          {easyItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No easy tasks scheduled for tomorrow.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {easyItems.map(({ occurrence, task }) => (
                <div key={occurrence.id} className="relative">
                  <TaskCard task={task} onDelete={() => deleteOccurrence(occurrence.id)} />
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

        {/* Five-Minute Tasks for Tomorrow */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Five-Minute Tasks for Tomorrow</h2>
              <p className="text-xs text-muted-foreground">Quick actions prepared for tomorrow.</p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {tomorrowFiveMin.length} items
            </span>
          </div>

          <form onSubmit={handleAddFiveMin} className="mt-4 flex gap-2">
            <Input
              value={fiveMinInput}
              onChange={(e) => setFiveMinInput(e.target.value)}
              placeholder="Add quick task for tomorrow..."
              className="text-sm"
            />
            <Button type="submit" size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            {tomorrowFiveMin.length === 0 ? (
              <p className="py-2 text-xs italic text-muted-foreground">No five-minute tasks set for tomorrow yet.</p>
            ) : (
              tomorrowFiveMin.map((item) => (
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

      <TaskFormDialog
        isOpen={creating}
        initialDate={tomorrowStr}
        onClose={() => setCreating(false)}
        onSubmit={handleCreateTask}
      />

      {showAddExisting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Add Task to Tomorrow</h2>
            <div className="mt-4 space-y-2">
              {unscheduledMasterTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No unscheduled tasks found.</p>
              ) : (
                unscheduledMasterTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Difficulty: {task.predictedDifficulty}/10</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await scheduleTaskToDate(task.id, tomorrowStr, "supporting");
                      }}
                    >
                      Add
                    </Button>
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
    </div>
  );
}
