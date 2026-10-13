"use client";

import { useState, type FormEvent } from "react";
import { Calendar, Plus, Target, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanAddDialog } from "@/components/plan-add-dialog";
import { useExecutionData, type GoalRecord } from "@/contexts/execution-data";

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, updateGoalProgress } = useExecutionData();
  const [dialogType, setDialogType] = useState<"weekly" | "monthly" | "longterm" | null>(null);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const types = ["longterm", "monthly", "weekly"] as const;

  const handleEditGoalSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !goalTitle.trim() || !goalTarget.trim()) return;
    updateGoal(editingGoal.id, { title: goalTitle.trim(), target: goalTarget.trim() });
    setEditingGoal(null);
  };

  return (
    <div className="min-h-screen p-4 pb-24 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Direction into action</p>
            <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
            <p className="mt-1 text-muted-foreground">Create and manage your long-term, monthly, and weekly goals.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDialogType("longterm")}><Plus className="mr-2 h-4 w-4" />Long-term goal</Button>
            <Button onClick={() => setDialogType("monthly")}><Plus className="mr-2 h-4 w-4" />New goal</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {types.map((type) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  {type === "longterm" ? "Long-term" : type[0].toUpperCase() + type.slice(1)} goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goals.filter((goal) => goal.type === type).map((goal) => {
                  const percent = Math.min(100, Math.max(0, goal.progress));
                  return (
                    <div key={goal.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{goal.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md" onClick={() => { setProgressGoalId(goal.id); setProgressValue(String(goal.progress)); }} title="Update progress percentage">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10" onClick={() => deleteGoal(goal.id)} title="Delete goal">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Target: {goal.target}</span>
                        <span className="font-semibold">{goal.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditingGoal(goal); setGoalTitle(goal.title); setGoalTarget(goal.target); }}>
                          Edit definition
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {goals.filter((goal) => goal.type === type).length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">No {type} goals yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Goal hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Long-term direction → monthly goal → weekly goal → specific task.</p>
          </CardContent>
        </Card>
      </div>

      {dialogType && (
        <PlanAddDialog
          kind="goal"
          goalType={dialogType}
          onClose={() => setDialogType(null)}
          onGoal={(goal) => {
            addGoal(goal);
            setDialogType(null);
          }}
        />
      )}

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
            <label className="block text-sm font-medium">Target metric / deadline<input className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} required placeholder="e.g. 100% or Target date" /></label>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={() => setEditingGoal(null)}>Cancel</Button><Button type="submit">Save changes</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}
