"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Filter, Trash2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/task-card";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { useExecutionData } from "@/contexts/execution-data";
import { getTodayDateString, getTomorrowDateString } from "@/lib/date-utils";
import type { MasterTask, Priority } from "@/types/execution-os";

export default function TasksPage() {
  const {
    masterTasks,
    createMasterTask,
    updateMasterTask,
    deleteMasterTask,
    scheduleTaskToDate,
  } = useExecutionData();

  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<MasterTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<MasterTask | null>(null);
  const [schedulingTask, setSchedulingTask] = useState<MasterTask | null>(null);
  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [message, setMessage] = useState("");

  const activeTasks = useMemo(
    () => masterTasks.filter((t) => t.status !== "done" && !t.deletedAt),
    [masterTasks]
  );

  const filteredTasks = useMemo(() => {
    return activeTasks.filter((t) => {
      const matchesQuery =
        !query.trim() ||
        `${t.title} ${t.description} ${t.notes} ${t.expectedOutcome}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesPriority =
        priorityFilter === "all" || t.priority === priorityFilter;

      return matchesQuery && matchesPriority;
    });
  }, [activeTasks, query, priorityFilter]);

  const handleCreateTask = async (payload: Partial<MasterTask>) => {
    await createMasterTask(payload);
    setMessage("Task created successfully.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleUpdateTask = async (payload: Partial<MasterTask>) => {
    if (!editingTask) return;
    await updateMasterTask(editingTask.id, payload);
    setEditingTask(null);
    setMessage("Task updated successfully.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    await deleteMasterTask(deletingTask.id);
    setDeletingTask(null);
    setMessage("Task permanently deleted.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleConfirmSchedule = async () => {
    if (!schedulingTask || !scheduleDate) return;
    await scheduleTaskToDate(schedulingTask.id, scheduleDate, "supporting");
    setSchedulingTask(null);
    setMessage(`Scheduled task for ${scheduleDate}.`);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen p-4 pb-24 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Master flat collection of regular tasks. {activeTasks.length} active tasks.
            </p>
          </div>

          <Button onClick={() => setCreating(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        {/* Message Banner */}
        {message && (
          <output className="block rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </output>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks by title, outcome, or notes..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "urgent", "high", "medium", "low"].map((p) => (
              <Badge
                key={p}
                variant={priorityFilter === p ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setPriorityFilter(p)}
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-base font-semibold text-foreground">No tasks found</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {query || priorityFilter !== "all"
                ? "Try adjusting your search query or priority filters."
                : "Your master task collection is empty. Capture your first task to get started."}
            </p>
            <Button onClick={() => setCreating(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => setEditingTask(task)}
                onDelete={() => setDeletingTask(task)}
                onSchedule={() => setSchedulingTask(task)}
                onComplete={() => updateMasterTask(task.id, { status: "done", completedAt: new Date().toISOString() })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <TaskFormDialog
        isOpen={creating}
        onClose={() => setCreating(false)}
        onSubmit={handleCreateTask}
      />

      {/* Edit Task Dialog */}
      <TaskFormDialog
        isOpen={Boolean(editingTask)}
        initialTask={editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
      />

      {/* Explicit Permanent Deletion Confirmation Modal */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Permanently delete task?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to permanently delete <strong className="text-foreground">"{deletingTask.title}"</strong>? This action cannot be recovered.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setDeletingTask(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Task Modal */}
      {schedulingTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Schedule Task</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Assign "{schedulingTask.title}" to a calendar date.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Target Date</label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setScheduleDate(getTodayDateString())}>
                  Today
                </Button>
                <Button size="sm" variant="outline" onClick={() => setScheduleDate(getTomorrowDateString())}>
                  Tomorrow
                </Button>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setSchedulingTask(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSchedule} className="gap-2">
                <CalendarPlus className="h-4 w-4" />
                Confirm Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
