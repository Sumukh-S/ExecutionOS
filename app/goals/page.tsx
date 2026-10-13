"use client";

import { useState } from "react";
import { Calendar, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanAddDialog } from "@/components/plan-add-dialog";
import { useExecutionData } from "@/contexts/execution-data";

export default function GoalsPage() {
  const { goals, addGoal, updateGoalProgress } = useExecutionData();
  const [dialogType, setDialogType] = useState<"weekly" | "monthly" | "longterm" | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState("");
  const types = ["longterm", "monthly", "weekly"] as const;

  return <><div className="min-h-screen p-4 pb-24 sm:p-6"><div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Direction into action</p><h1 className="text-3xl font-bold tracking-tight">Goals</h1><p className="mt-1 text-muted-foreground">Create goals here, then connect tasks to them from the task form.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDialogType("longterm")}><Plus className="mr-2 h-4 w-4" />Long-term goal</Button><Button onClick={() => setDialogType("monthly")}><Plus className="mr-2 h-4 w-4" />New goal</Button></div></div>
    <div className="grid gap-4 md:grid-cols-3">{types.map((type) => <Card key={type}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" />{type === "longterm" ? "Long-term" : type[0].toUpperCase() + type.slice(1)} goals</CardTitle></CardHeader><CardContent className="space-y-3">{goals.filter((goal) => goal.type === type).map((goal) => <div key={goal.id} className="rounded-lg border border-border p-3"><div className="flex items-start justify-between gap-2"><p className="font-medium">{goal.title}</p><Button size="sm" variant="ghost" onClick={() => { setEditingGoalId(goal.id); setProgressInput(String(goal.progress)); }}>Edit progress</Button></div><p className="mt-1 text-xs text-muted-foreground">Target: {goal.target} · Progress: {goal.progress}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (goal.progress / (Number.parseFloat(goal.target) || 1)) * 100)}%` }} /></div></div>)}</CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Goal hierarchy</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Long-term direction → monthly goal → weekly goal → specific task.</p></CardContent></Card>
  </div></div>{dialogType && <PlanAddDialog kind="goal" goalType={dialogType} onClose={() => setDialogType(null)} onGoal={(goal) => { addGoal(goal); setDialogType(null); }} />}{editingGoalId && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); const val = Number(progressInput); if (!Number.isNaN(val)) updateGoalProgress(editingGoalId, val); setEditingGoalId(null); }} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Update goal progress</h2><label className="mt-4 block text-sm font-medium">Progress value<input type="number" className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3" value={progressInput} onChange={(e) => setProgressInput(e.target.value)} required /></label><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditingGoalId(null)}>Cancel</Button><Button type="submit">Save</Button></div></form></div>}</>;
}
