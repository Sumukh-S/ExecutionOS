"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTaskQuadrant, useExecutionData } from "@/contexts/execution-data";
import { formatDateTime } from "@/lib/dates";

const quadrants = {
  q1: { title: "Q1: Important + Urgent", action: "Do now", color: "border-red-500/30 bg-red-500/5" },
  q2: { title: "Q2: Important + Not urgent", action: "Schedule", color: "border-emerald-500/30 bg-emerald-500/5" },
  q3: { title: "Q3: Not important + Urgent", action: "Limit or delegate", color: "border-orange-500/30 bg-orange-500/5" },
  q4: { title: "Q4: Not important + Not urgent", action: "Defer or eliminate", color: "border-blue-500/30 bg-blue-500/5" },
};

export default function EisenhowerPage() {
  const { tasks } = useExecutionData();
  const [urgentOnly, setUrgentOnly] = useState(false);
  const grouped = useMemo(() => ({
    q1: tasks.filter((task) => getTaskQuadrant(task) === "q1"), q2: tasks.filter((task) => getTaskQuadrant(task) === "q2"),
    q3: tasks.filter((task) => getTaskQuadrant(task) === "q3"), q4: tasks.filter((task) => getTaskQuadrant(task) === "q4"),
  }), [tasks]);

  return <div className="min-h-screen p-4 pb-24 sm:p-6"><div className="mx-auto max-w-6xl space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Eisenhower Matrix</h1><p className="mt-1 text-sm text-muted-foreground">Priority and deadline changes flow here automatically.</p></div><Button variant={urgentOnly ? "secondary" : "outline"} size="sm" onClick={() => setUrgentOnly((active) => !active)}><Filter className="mr-2 h-4 w-4" />{urgentOnly ? "Urgent only" : "Show urgent"}</Button></div><div className="grid gap-4 md:grid-cols-2">{(Object.keys(quadrants) as (keyof typeof quadrants)[]).map((key) => { const items = grouped[key].filter((task) => !urgentOnly || task.priority === "urgent"); return <Card key={key} className={quadrants[key].color}><CardHeader><CardTitle className="text-lg">{quadrants[key].title}</CardTitle><p className="text-xs uppercase tracking-wide text-muted-foreground">{quadrants[key].action}</p></CardHeader><CardContent className="space-y-2">{items.length ? items.map((task) => <div key={task.id} className="rounded-lg border border-border/60 bg-background/50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{task.icon} {task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.priority} · predicted {task.predictedDifficulty}/10</p></div><Badge variant="outline">{task.status}</Badge></div>{task.deadline && <p className={`mt-2 text-xs ${new Date(task.deadline).getTime() < Date.now() ? "font-semibold text-red-600 dark:text-red-400" : "text-red-600 dark:text-red-400"}`}>Deadline {formatDateTime(task.deadline)}</p>}</div>) : <p className="py-5 text-center text-sm text-muted-foreground">No tasks here.</p>}</CardContent></Card>; })}</div></div></div>;
}
