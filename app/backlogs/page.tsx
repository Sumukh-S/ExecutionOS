"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CalendarClock, Calendar, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";
import { useExecutionData } from "@/contexts/execution-data";
import { getTodayDateString, getDeadlineCountdown } from "@/lib/date-utils";
import type { MasterTask } from "@/types/execution-os";

export default function BacklogsPage() {
  const todayStr = getTodayDateString();
  const { masterTasks, updateMasterTask, scheduleTaskToDate } = useExecutionData();
  const [reschedulingTask, setReschedulingTask] = useState<MasterTask | null>(null);
  const [targetDate, setTargetDate] = useState(todayStr);

  const activeTasks = useMemo(
    () => masterTasks.filter((t) => t.status !== "done" && !t.deletedAt),
    [masterTasks]
  );

  // Group 1: Overdue (Deadline has passed)
  const overdueTasks = useMemo(() => {
    const now = Date.now();
    return activeTasks.filter((t) => {
      if (!t.deadline) return false;
      return new Date(t.deadline).getTime() < now;
    });
  }, [activeTasks]);

  // Group 2: Carried Forward (Scheduled date has passed, and not already in overdue)
  const carriedForwardTasks = useMemo(() => {
    const overdueIds = new Set(overdueTasks.map((t) => t.id));
    return activeTasks.filter((t) => {
      if (overdueIds.has(t.id)) return false;
      return Boolean(t.scheduledDate && t.scheduledDate < todayStr);
    });
  }, [activeTasks, overdueTasks, todayStr]);

  const handleReschedule = async () => {
    if (!reschedulingTask || !targetDate) return;
    await updateMasterTask(reschedulingTask.id, { scheduledDate: targetDate });
    await scheduleTaskToDate(reschedulingTask.id, targetDate, "supporting");
    setReschedulingTask(null);
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-500">
            <CalendarClock className="h-4 w-4" />
            <span>Recovery Workspace</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Backlogs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A compassionate space to recover uncompleted and overdue tasks without penalty or guilt.
          </p>
        </div>

        {/* Overdue Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-foreground">1. Overdue ({overdueTasks.length})</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Tasks whose explicit deadline timestamp has passed.
          </p>

          {overdueTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No overdue tasks. All deadlines are in good order.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overdueTasks.map((task) => (
                <div key={task.id} className="relative">
                  <TaskCard
                    task={task}
                    onComplete={() => updateMasterTask(task.id, { status: "done", completedAt: new Date().toISOString() })}
                    onSchedule={() => setReschedulingTask(task)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Carried Forward Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">2. Carried Forward ({carriedForwardTasks.length})</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Tasks scheduled for a previous date that remained incomplete.
          </p>

          {carriedForwardTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No carried-forward tasks.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {carriedForwardTasks.map((task) => (
                <div key={task.id} className="relative">
                  <TaskCard
                    task={task}
                    onComplete={() => updateMasterTask(task.id, { status: "done", completedAt: new Date().toISOString() })}
                    onSchedule={() => setReschedulingTask(task)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Reschedule Modal */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Reschedule Task</h2>
            <p className="mt-1 text-sm text-muted-foreground">"{reschedulingTask.title}"</p>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Select New Date</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setReschedulingTask(null)}>
                Cancel
              </Button>
              <Button onClick={handleReschedule}>
                Save Reschedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
