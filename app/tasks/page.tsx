"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, ListPlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";
import { useExecutionData, type TaskRecord } from "@/contexts/execution-data";
import { formatWeekday } from "@/lib/dates";
import { TaskFormDialog, formValuesToTaskPayload, taskToFormValues, type TaskFormValues } from "@/components/task-form-dialog";
import { CompletionReviewDialog } from "@/components/completion-review-dialog";

export default function TasksPage() {
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
  } = useExecutionData();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create-main" | "create-subtask" | null>(null);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [completionTask, setCompletionTask] = useState<TaskRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [detailTask, setDetailTask] = useState<TaskRecord | null>(null);
  const [subtaskInput, setSubtaskInput] = useState<Record<string, string>>({});

  const mainTasks = useMemo(() => tasks.filter((task) => task.isMain && task.status !== "done"), [tasks]);
  const subtasks = useMemo(() => tasks.filter((task) => !task.isMain), [tasks]);
  const subtasksOf = (parentId: string) => subtasks.filter((task) => task.parentId === parentId);
  const standaloneSubtasks = useMemo(() => subtasks.filter((task) => !task.parentId), [subtasks]);
  const canAddMain = mainTasks.length < 2;

  const addSubtask = (event: FormEvent<HTMLFormElement>, parentId: string) => {
    event.preventDefault();
    const value = (subtaskInput[parentId] ?? "").trim();
    if (!value) return;
    addTask({
      title: value,
      isMain: false,
      parentId,
      description: value,
      scope: value,
      firstAction: value,
      icon: "↳",
      listName: "Subtask",
      priority: "medium",
      scheduledStart: "",
      scheduledEnd: "",
      deadline: "",
      location: "",
      alarm: false,
      notes: "",
      resources: "",
      predictedDifficulty: 7,
      expectedDuration: 15,
      wish: "",
      outcome: "",
      obstacle: "",
      weeklyGoal: "",
      monthlyGoal: "",
    });
    setSubtaskInput((current) => ({ ...current, [parentId]: "" }));
    setSuccessMessage("Subtask added.");
  };

  useEffect(() => {
    const taskId = new URLSearchParams(window.location.search).get("task");
    const linkedTask = taskId ? tasks.find((task) => task.id === taskId) : undefined;
    if (linkedTask) setQuery(linkedTask.title);
  }, [tasks]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesQuery = `${task.title} ${task.description} ${task.notes}`.toLowerCase().includes(query.toLowerCase());
    const day = formatWeekday(task.scheduledStart);
    const matchesFilter = activeFilter === "All" || (activeFilter === "Deadlines" && Boolean(task.deadline)) || (activeFilter === "This Week" && Boolean(task.scheduledStart)) || day === activeFilter || task.scheduledStart.includes(new Date().toISOString().slice(0, 10));
    return matchesQuery && matchesFilter;
  }), [activeFilter, query, tasks]);

  const handleCreateSubmit = (values: TaskFormValues) => {
    const isMain = dialogMode === "create-main";
    const payload = formValuesToTaskPayload({ ...values, isMain, parentId: null });
    const saved = addTask(payload);
    if (!saved) {
      return "Maximum of 2 active main tasks reached. Complete or delete a main task before adding another.";
    }
    setSuccessMessage(isMain ? "Main task saved." : "Subtask saved.");
  };

  const handleEditSubmit = (values: TaskFormValues) => {
    if (!editingTask) return;
    const payload = formValuesToTaskPayload({ ...values, isMain: editingTask.isMain, parentId: editingTask.parentId });
    updateTask(editingTask.id, payload);
    setSuccessMessage("Task updated.");
  };

  const removeTask = (id: string) => { deleteTask(id); setSuccessMessage("Task deleted."); };

  return <div className="min-h-screen p-4 pb-24 sm:p-6"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Tasks</h1><p className="text-muted-foreground">{mainTasks.length} main · {subtasks.length} subtasks · {tasks.filter((task) => task.status === "done").length} done</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="gap-2" onClick={() => setDialogMode("create-main")} disabled={!canAddMain} title={canAddMain ? "Add a main task" : "Complete or delete a main task before adding another"}><Plus className="h-4 w-4" />Add main task</Button><Button className="gap-2" onClick={() => setDialogMode("create-subtask")}><ListPlus className="h-4 w-4" />Add subtask</Button></div></div>
    {successMessage && <output className="fixed right-4 top-4 z-[80] flex max-w-sm items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-card px-4 py-3 text-sm text-emerald-700 shadow-2xl dark:text-emerald-300"><span>{successMessage}</span><Button variant="ghost" size="sm" onClick={() => setSuccessMessage("")}>Dismiss</Button></output>}
    <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search title, notes, or resources" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" /></div><Button variant="outline" size="icon" onClick={() => setShowFilters((visible) => !visible)} aria-label="Toggle task filters" title="Toggle task filters"><Filter className="h-4 w-4" /></Button></div>
    {showFilters && <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm"><span className="text-muted-foreground">{filteredTasks.length} of {tasks.length} tasks</span>{query && <Button variant="ghost" size="sm" onClick={() => setQuery("")}>Clear search</Button>}</div>}
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Task filters">{["All", "Today", "Tomorrow", "This Week", "Deadlines"].map((filter) => <Badge key={filter} role="tab" aria-selected={filter === activeFilter} variant={filter === activeFilter ? "default" : "outline"} className="min-h-9 cursor-pointer whitespace-nowrap" onClick={() => setActiveFilter(filter)}>{filter}</Badge>)}</div>
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Main tasks ({mainTasks.length}/2)</h2></div>
      <div className="grid gap-3 md:grid-cols-2">
        {mainTasks.map((task) => <div key={task.id} className="space-y-2 rounded-xl border-2 border-primary/40 bg-primary/5 p-3">
          <TaskCard {...task} onViewDetails={() => setDetailTask(task)} onEdit={() => setEditingTask(task)} onStart={() => startExecution(task.id)} onPause={() => pauseExecution(task.id)} onComplete={() => setCompletionTask(task)} onDelete={() => removeTask(task.id)} />
        </div>)}
        {canAddMain && <button type="button" onClick={() => setDialogMode("create-main")} className="grid min-h-[8rem] place-items-center rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"><span className="flex items-center gap-2"><Plus className="h-4 w-4" />Add main task ({mainTasks.length}/2)</span></button>}
      </div>
      {!canAddMain && <p className="text-xs text-muted-foreground">Maximum of 2 main tasks reached.</p>}
    </section>
    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Subtasks ({subtasks.length})</h2></div>
      <div className="grid gap-3 md:grid-cols-2">
        {standaloneSubtasks.filter((task) => `${task.title} ${task.description} ${task.notes}`.toLowerCase().includes(query.toLowerCase())).map((task) => <div key={task.id}><TaskCard {...task} onViewDetails={() => setDetailTask(task)} onEdit={() => setEditingTask(task)} onStart={() => startExecution(task.id)} onPause={() => pauseExecution(task.id)} onComplete={() => setCompletionTask(task)} onDelete={() => removeTask(task.id)} /></div>)}
        {standaloneSubtasks.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground md:col-span-2">No subtasks yet. Use “Add subtask” above.</div>}
      </div>
      {mainTasks.some((task) => subtasksOf(task.id).length > 0) && <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subtasks grouped under main tasks</h3>
        {mainTasks.map((task) => subtasksOf(task.id).length > 0 && <div key={task.id} className="rounded-xl border border-border/60 bg-card p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{task.icon} {task.title}</p>
          <div className="space-y-2">
            {subtasksOf(task.id).map((sub) => <div key={sub.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs"><label className="flex flex-1 items-center gap-2 cursor-pointer"><input type="checkbox" checked={sub.status === "done"} onChange={() => setCompletionTask(sub)} className="h-4 w-4 rounded border-border text-primary" /><span className={sub.status === "done" ? "line-through text-muted-foreground" : ""}>{sub.title}</span></label><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingTask(sub)} aria-label="Edit subtask"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTask(sub.id)} aria-label="Delete subtask"><Trash2 className="h-5 w-5 text-destructive" /></Button></div>)}
            <form onSubmit={(event) => addSubtask(event, task.id)} className="flex gap-2"><Input placeholder="Add subtask..." value={subtaskInput[task.id] ?? ""} onChange={(event) => setSubtaskInput((current) => ({ ...current, [task.id]: event.target.value }))} className="h-9 text-xs" /><Button size="sm" type="submit" className="h-9 gap-1 text-xs"><Plus className="h-3.5 w-3.5" />Subtask</Button></form>
          </div>
        </div>)}
      </div>}
    </section>
  </div>
  {dialogMode && (
    <TaskFormDialog
      title={dialogMode === "create-main" ? "Create main task" : "Create subtask"}
      description="Define task definition, scheduling, and optional details."
      initialValues={taskToFormValues()}
      submitLabel={dialogMode === "create-main" ? "Save main task" : "Save subtask"}
      onSubmit={(values) => {
        const err = handleCreateSubmit(values);
        if (err) return err;
        setDialogMode(null);
      }}
      onClose={() => setDialogMode(null)}
    />
  )}
  {editingTask && (
    <TaskFormDialog
      title="Edit task"
      description="Update task definition and scheduling."
      initialValues={taskToFormValues(editingTask)}
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
  </div>;
}
