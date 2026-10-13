"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ChevronRight, Plus, Target, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExecutionData, type GoalRecord } from "@/contexts/execution-data";
import { PlanAddDialog } from "@/components/plan-add-dialog";

export default function MonthlyPage() {
  const { goals, addTask, addGoal, updateGoal, deleteGoal, updateGoalProgress } = useExecutionData();
  const [dialog, setDialog] = useState<"task" | "goal" | null>(null);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");

  const today = new Date();
  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const yearNumber = today.getFullYear();
  const monthString = `${monthName} ${yearNumber}`;

  const monthlyGoals = goals.filter((goal) => goal.type === "monthly" || goal.type === "longterm");

  const createTask = (data: { title: string; scope: string; start: string; end: string; weeklyGoal: string; monthlyGoal: string }) => {
    addTask({ ...data, description: data.scope, firstAction: "Start the planned task at the scheduled time.", icon: "✅", listName: "Monthly plan", scheduledStart: new Date(data.start).toISOString(), scheduledEnd: new Date(data.end).toISOString(), deadline: "", location: "", alarm: false, notes: "", resources: "", predictedDifficulty: 7, expectedDuration: Math.max(1, Math.round((new Date(data.end).getTime() - new Date(data.start).getTime()) / 60000)), priority: "medium", wish: "", outcome: "", obstacle: "" });
    setDialog(null);
  };

  const handleEditGoalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !goalTitle.trim() || !goalTarget.trim()) return;
    updateGoal(editingGoal.id, { title: goalTitle.trim(), target: goalTarget.trim() });
    setEditingGoal(null);
  };

  return (
    <div className="min-h-screen p-4 pb-24 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{monthString}</p>
            <h1 className="text-3xl font-bold tracking-tight">Monthly plan</h1>
            <p className="mt-1 text-muted-foreground">Keep the month connected to the long-term direction.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDialog("goal")} variant="outline" className="gap-2">
              <Target className="h-4 w-4" />Add monthly goal
            </Button>
            <Button onClick={() => setDialog("task")} className="gap-2">
              <Plus className="h-4 w-4" />Add task
            </Button>
            <Link href="/weekly">
              <Button variant="outline" className="gap-2">Weekly plan<ChevronRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {monthlyGoals.map((goal) => {
            const percent = Math.min(100, Math.max(0, goal.progress));
            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {goal.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">{goal.progress}% ({goal.target})</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => { setProgressGoalId(goal.id); setProgressValue(String(goal.progress)); }} title="Update progress percentage">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => deleteGoal(goal.id)} title="Delete goal">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Type: {goal.type}</span>
                    <span>Progress: {percent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingGoal(goal); setGoalTitle(goal.title); setGoalTarget(goal.target); }}>
                      Edit goal definition
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {monthlyGoals.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">
              No monthly or long-term goals set yet. Click "Add monthly goal" to begin.
            </div>
          )}
        </div>
      </div>

      {dialog === "task" && <PlanAddDialog kind="task" goalType="monthly" onClose={() => setDialog(null)} onTask={createTask} />}
      {dialog === "goal" && <PlanAddDialog kind="goal" goalType="monthly" onClose={() => setDialog(null)} onGoal={(goal) => { addGoal(goal); setDialog(null); }} />}

      {progressGoalId && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
          <form onSubmit={(e) => { e.preventDefault(); const val = Number(progressValue); if (!Number.isNaN(val)) updateGoalProgress(progressGoalId, Math.max(0, Math.min(100, val))); setProgressGoalId(null); }} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Update progress (%)</h2>
            <p className="text-xs text-muted-foreground mt-1">Enter percentage number (0 - 100).</p>
            <label className="mt-4 block text-sm font-medium">Progress percentage<input type="number" min="0" max="100" className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3" value={progressValue} onChange={(e) => setProgressValue(e.target.value)} required /></label>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setProgressGoalId(null)}>Cancel</Button><Button type="submit">Save progress</Button></div>
          </form>
        </div>
      )}

      {editingGoal && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
          <form onSubmit={handleEditGoalSubmit} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-semibold">Edit goal</h2>
            <label className="block text-sm font-medium">Goal title<input className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} required /></label>
            <label className="block text-sm font-medium">Target description / deadline<input className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} required placeholder="e.g. 100% or End of month" /></label>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={() => setEditingGoal(null)}>Cancel</Button><Button type="submit">Save changes</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
