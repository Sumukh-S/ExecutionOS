"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarRange, ChevronRight, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExecutionData } from "@/contexts/execution-data";
import { PlanAddDialog } from "@/components/plan-add-dialog";

export default function MonthlyPage() {
  const { tasks, goals, addTask, addGoal, updateGoalProgress } = useExecutionData();
  const [dialog, setDialog] = useState<"task" | "goal" | null>(null);
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const monthlyGoals = goals.filter((goal) => goal.type === "monthly" || goal.type === "longterm");
  const createTask = (data: { title: string; scope: string; start: string; end: string; weeklyGoal: string; monthlyGoal: string }) => {
    addTask({ ...data, description: data.scope, firstAction: "Start the planned task at the scheduled time.", icon: "✅", listName: "Monthly plan", scheduledStart: new Date(data.start).toISOString(), scheduledEnd: new Date(data.end).toISOString(), deadline: "", location: "", alarm: false, notes: "", resources: "", predictedDifficulty: 7, expectedDuration: Math.max(1, Math.round((new Date(data.end).getTime() - new Date(data.start).getTime()) / 60000)), priority: "medium", wish: "", outcome: "", obstacle: "" });
    setDialog(null);
  };

  return <><div className="min-h-screen p-4 pb-24 sm:p-6"><div className="mx-auto max-w-6xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">This month</p><h1 className="text-3xl font-bold tracking-tight">Monthly plan</h1><p className="mt-1 text-muted-foreground">Keep the month connected to the long-term direction.</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => setDialog("goal")} variant="outline" className="gap-2"><Target className="h-4 w-4" />Add monthly goal</Button><Button onClick={() => setDialog("task")} className="gap-2"><Plus className="h-4 w-4" />Add task</Button><Link href="/weekly"><Button variant="outline" className="gap-2">Weekly plan<ChevronRight className="h-4 w-4" /></Button></Link></div></div>
    <div className="grid gap-4 md:grid-cols-2">{monthlyGoals.map((goal) => <Card key={goal.id}><CardHeader><CardTitle className="flex items-center justify-between text-base"><span className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{goal.title}</span><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">{goal.progress} / {goal.target}</span><Button size="sm" variant="outline" onClick={() => { setProgressGoalId(goal.id); setProgressValue(String(goal.progress)); }}>Update</Button></div></CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Type: {goal.type}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (goal.progress / (Number.parseFloat(goal.target) || 1)) * 100)}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{goal.progress} completed units</p></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5 text-primary" />Tasks connected to monthly goals</CardTitle></CardHeader><CardContent className="space-y-3">{tasks.filter((task) => task.monthlyGoal).map((task) => <Link href={`/tasks?task=${task.id}`} key={task.id} className="block rounded-lg border border-border p-3 hover:bg-accent"><p className="font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.monthlyGoal}</p></Link>)}</CardContent></Card>
  </div></div>{dialog === "task" && <PlanAddDialog kind="task" goalType="monthly" onClose={() => setDialog(null)} onTask={createTask} />}{dialog === "goal" && <PlanAddDialog kind="goal" goalType="monthly" onClose={() => setDialog(null)} onGoal={(goal) => { addGoal(goal); setDialog(null); }} />}{progressGoalId && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"><form onSubmit={(e) => { e.preventDefault(); const val = Number(progressValue); if (!Number.isNaN(val)) updateGoalProgress(progressGoalId, val); setProgressGoalId(null); }} className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"><h2 className="text-lg font-semibold">Update progress</h2><label className="mt-4 block text-sm font-medium">New progress value<input type="number" className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3" value={progressValue} onChange={(e) => setProgressValue(e.target.value)} required /></label><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setProgressGoalId(null)}>Cancel</Button><Button type="submit">Save progress</Button></div></form></div>}</>;
}
