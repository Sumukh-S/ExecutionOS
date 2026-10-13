"use client";

import { useEffect, useMemo, useState, type FormEvent as ReactFormEvent } from "react";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/task-card";
import { useExecutionData, type TaskRecord } from "@/contexts/execution-data";
import { formatDate } from "@/lib/dates";
import { TaskFormDialog, formValuesToTaskPayload, taskToFormValues, type TaskFormValues } from "@/components/task-form-dialog";
import { CompletionReviewDialog } from "@/components/completion-review-dialog";

const todayKey = () => new Date().toISOString().slice(0, 10);
const isToday = (value?: string | null) => Boolean(value?.slice(0, 10) === todayKey());

export default function TodayPage() {
  const {
    tasks,
    sessions,
    addTask,
    updateTask,
    deleteTask,
    recordCompletion,
    startExecution,
    pauseExecution,
    resumeExecution,
    quickTasks,
    addQuickTask,
    updateQuickTask,
    toggleQuickTask,
    deleteQuickTask,
  } = useExecutionData();
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [showCreateMain, setShowCreateMain] = useState(false);
  const [showCreateSubtask, setShowCreateSubtask] = useState(false);
  const [completionTask, setCompletionTask] = useState<TaskRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [detailTask, setDetailTask] = useState<TaskRecord | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [editingQuickId, setEditingQuickId] = useState<string | null>(null);
  const [mobileQuickOpen, setMobileQuickOpen] = useState(false);

  const todayTasks = useMemo(() => tasks.filter((task) => isToday(task.scheduledStart) || isToday(task.deadline)), [tasks]);
  const mainTasks = useMemo(() => todayTasks.filter((task) => task.isMain), [todayTasks]);
  const otherTasks = useMemo(() => todayTasks.filter((task) => !task.isMain), [todayTasks]);
  const canAddMain = tasks.filter((task) => task.isMain && task.status !== "done").length < 2;

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleCreateMainSubmit = (values: TaskFormValues) => {
    const payload = formValuesToTaskPayload({ ...values, isMain: true, parentId: null });
    const saved = addTask(payload);
    if (!saved) {
      return "Maximum of 2 active main tasks reached. Complete or delete a main task before adding another.";
    }
    setSuccessMessage("Main task added to today.");
  };

  const handleCreateSubtaskSubmit = (values: TaskFormValues) => {
    const payload = formValuesToTaskPayload({ ...values, isMain: false, parentId: null });
    addTask(payload);
    setSuccessMessage("Subtask added to today.");
    return undefined;
  };

  const handleEditSubmit = (values: TaskFormValues) => {
    if (!editingTask) return;
    const payload = formValuesToTaskPayload(values);
    updateTask(editingTask.id, payload);
    setSuccessMessage("Today's task updated.");
  };

  const removeTask = (id: string) => {
    deleteTask(id);
    setSuccessMessage("Task deleted.");
  };

  const handleAddQuick = (event: ReactFormEvent) => {
    event.preventDefault();
    if (!quickTitle.trim()) return;
    if (editingQuickId) {
      updateQuickTask(editingQuickId, quickTitle);
      setEditingQuickId(null);
      setSuccessMessage("5-min task updated.");
    } else {
      addQuickTask(quickTitle);
      setSuccessMessage("5-min task added.");
    }
    setQuickTitle("");
  };

  const quickList = (
    <>
      <form onSubmit={handleAddQuick} className="mt-3 flex gap-2">
        <Input placeholder="Add quick task..." value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} className="h-9 text-xs" />
        <Button size="sm" type="submit" className="h-9 px-3 text-xs">{editingQuickId ? "Save" : "Add"}</Button>
        {editingQuickId && <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => { setEditingQuickId(null); setQuickTitle(""); }}>Cancel</Button>}
      </form>
      <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto">
        {quickTasks.length ? quickTasks.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 rounded-md p-1.5 text-sm hover:bg-accent/40">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
              <input type="checkbox" checked={item.completed} onChange={() => toggleQuickTask(item.id)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              <span className={`truncate text-xs ${item.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{item.title}</span>
            </label>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => { setEditingQuickId(item.id); setQuickTitle(item.title); }} title="Edit" aria-label="Edit quick task">
              <Pencil className="h-5 w-5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-primary-foreground" onClick={() => { deleteQuickTask(item.id); setSuccessMessage("5-min task deleted."); }} title="Delete" aria-label="Delete quick task">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        )) : <p className="py-2 text-center text-xs text-muted-foreground">No quick tasks yet.</p>}
      </div>
    </>
  );

  return (
    <div className="min-h-screen p-4 pb-24 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Today</h1>
            <p className="text-muted-foreground">{formatDate(new Date())} · {todayTasks.length} tasks due or scheduled today</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setShowCreateMain(true)} disabled={!canAddMain} title={canAddMain ? "Add a main task for today" : "Complete or delete a main task before adding another"}>
              <Plus className="h-4 w-4" />Add main task
            </Button>
            <Button className="gap-2" onClick={() => setShowCreateSubtask(true)}>
              <Plus className="h-4 w-4" />Add subtask
            </Button>
          </div>
        </div>
        {successMessage && (
          <output className="fixed right-4 top-4 z-[80] flex max-w-sm items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-card px-4 py-3 text-sm text-emerald-700 shadow-2xl dark:text-emerald-300">
            <span>{successMessage}</span>
            <Button variant="ghost" size="sm" onClick={() => setSuccessMessage("")}>Dismiss</Button>
          </output>
        )}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-6">
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Main tasks</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {mainTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3">
                    <TaskCard {...task} onViewDetails={() => setDetailTask(task)} onEdit={() => setEditingTask(task)} onStart={() => startExecution(task.id)} onPause={() => pauseExecution(task.id)} onComplete={() => setCompletionTask(task)} onDelete={() => removeTask(task.id)} />
                  </div>
                ))}
                {mainTasks.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">No main tasks scheduled for today.</div>}
              </div>
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Other tasks today</h2>
              <div className="grid gap-3">
                {otherTasks.map((task) => (
                  <div key={task.id}>
                    <TaskCard {...task} onViewDetails={() => setDetailTask(task)} onEdit={() => setEditingTask(task)} onStart={() => startExecution(task.id)} onPause={() => pauseExecution(task.id)} onComplete={() => setCompletionTask(task)} onDelete={() => removeTask(task.id)} />
                  </div>
                ))}
                {otherTasks.length === 0 && <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No other tasks are due or scheduled today.</div>}
              </div>
            </section>
          </div>
          <aside className="hidden lg:block">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">⚡ Under 5 min tasks</p>
                  <Badge variant="secondary" className="text-xs">{quickTasks.filter((task) => !task.completed).length}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Quick actions for today.</p>
                {quickList}
              </CardContent>
            </Card>
          </aside>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm lg:hidden">
          <button type="button" onClick={() => setMobileQuickOpen((open) => !open)} className="flex w-full items-center justify-between text-sm font-semibold">
            <span className="flex items-center gap-2">⚡ Under 5 min tasks <Badge variant="secondary" className="text-xs">{quickTasks.filter((task) => !task.completed).length}</Badge></span>
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileQuickOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileQuickOpen && <div className="mt-3 border-t border-border pt-3">{quickList}</div>}
        </div>
      </div>
      {detailTask && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/50 p-4">
          <div className="my-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2"><span className="text-2xl">{detailTask.icon}</span><h2 className="text-lg font-semibold">{detailTask.title}</h2></div>
              <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setDetailTask(null)} aria-label="Close details"><X className="h-6 w-6" strokeWidth={2.5} /></Button>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="label">Scope / how much</dt><dd className="mt-1">{detailTask.scope || "Not defined"}</dd></div>
              <div><dt className="label">First action</dt><dd className="mt-1">{detailTask.firstAction || "Not defined"}</dd></div>
              <div><dt className="label">Priority</dt><dd className="mt-1 capitalize">{detailTask.priority}</dd></div>
              <div><dt className="label">Status</dt><dd className="mt-1 capitalize">{detailTask.status.replace("_", " ")}</dd></div>
            </dl>
          </div>
        </div>
      )}
      {showCreateMain && (
        <TaskFormDialog
          title="Add main task for today"
          description="Main tasks are pinned and locked to today."
          initialValues={taskToFormValues(null, { scheduledStart: `${todayKey()}T09:00`, expectedDuration: 30 })}
          todayOnly
          submitLabel="Add main task"
          onSubmit={(values) => {
            const err = handleCreateMainSubmit(values);
            if (err) return err;
            setShowCreateMain(false);
          }}
          onClose={() => setShowCreateMain(false)}
        />
      )}
      {showCreateSubtask && (
        <TaskFormDialog
          title="Add subtask for today"
          description="Subtasks are locked to today."
          initialValues={taskToFormValues(null, { scheduledStart: `${todayKey()}T09:00`, expectedDuration: 30, isMain: false })}
          todayOnly
          submitLabel="Add subtask"
          onSubmit={(values) => {
            const err = handleCreateSubtaskSubmit(values);
            if (err) return err;
            setShowCreateSubtask(false);
          }}
          onClose={() => setShowCreateSubtask(false)}
        />
      )}
      {editingTask && (
        <TaskFormDialog
          title="Edit today's task"
          description="Dates are locked to today."
          initialValues={taskToFormValues(editingTask)}
          todayOnly
          submitLabel="Save changes"
          onSubmit={(values) => {
            handleEditSubmit(values);
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
      {completionTask && (
        <CompletionReviewDialog
          task={completionTask}
          sessions={sessions}
          onClose={() => setCompletionTask(null)}
          onSubmit={(review) => {
            recordCompletion(completionTask.id, review);
            setCompletionTask(null);
            setSuccessMessage("Task completed and review recorded.");
          }}
        />
      )}
    </div>
  );
}
