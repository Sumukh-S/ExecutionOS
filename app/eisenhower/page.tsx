"use client";

import { useMemo, useState } from "react";
import { Filter, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useExecutionData } from "@/contexts/execution-data";
import type { MasterTask } from "@/types/execution-os";

function getTaskQuadrant(task: MasterTask): "q1" | "q2" | "q3" | "q4" {
  const isUrgent =
    task.priority === "urgent" ||
    task.priority === "high" ||
    (task.deadline ? new Date(task.deadline).getTime() - Date.now() < 48 * 3600 * 1000 : false);
  const isImportant =
    task.predictedDifficulty >= 6 || task.priority === "high" || task.priority === "urgent";

  if (isUrgent && isImportant) return "q1";
  if (!isUrgent && isImportant) return "q2";
  if (isUrgent && !isImportant) return "q3";
  return "q4";
}

const quadrants = {
  q1: { title: "Q1 · Urgent & Important", action: "Execute Immediately", color: "border-red-500/30 bg-red-500/5" },
  q2: { title: "Q2 · Important, Not Urgent", action: "Schedule Deep Work", color: "border-primary/30 bg-primary/5" },
  q3: { title: "Q3 · Urgent, Not Important", action: "Delegate or Fast Track", color: "border-amber-500/30 bg-amber-500/5" },
  q4: { title: "Q4 · Neither", action: "Eliminate or Deprioritize", color: "border-border bg-card" },
};

export default function EisenhowerPage() {
  const { masterTasks } = useExecutionData();
  const [urgentOnly, setUrgentOnly] = useState(false);

  const activeTasks = useMemo(() => masterTasks.filter((t) => t.status !== "done" && !t.deletedAt), [masterTasks]);

  const grouped = useMemo(() => {
    return {
      q1: activeTasks.filter((t) => getTaskQuadrant(t) === "q1"),
      q2: activeTasks.filter((t) => getTaskQuadrant(t) === "q2"),
      q3: activeTasks.filter((t) => getTaskQuadrant(t) === "q3"),
      q4: activeTasks.filter((t) => getTaskQuadrant(t) === "q4"),
    };
  }, [activeTasks]);

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Eisenhower Matrix</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dynamic urgency and importance classification derived automatically from your master tasks.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => setUrgentOnly((v) => !v)} className="gap-2">
            <Filter className="h-4 w-4" />
            {urgentOnly ? "Show All Tasks" : "Filter Urgent Only"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(Object.keys(quadrants) as (keyof typeof quadrants)[]).map((key) => {
            const items = grouped[key].filter((t) => !urgentOnly || t.priority === "urgent");
            const q = quadrants[key];
            return (
              <Card key={key} className={q.color}>
                <CardHeader>
                  <CardTitle className="text-base font-bold text-foreground">{q.title}</CardTitle>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{q.action}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-xs italic text-muted-foreground">No tasks in this quadrant.</p>
                  ) : (
                    items.map((task) => (
                      <div key={task.id} className="rounded-xl border border-border/80 bg-background/80 p-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{task.title}</p>
                            <p className="mt-0.5 text-muted-foreground">
                              {task.priority} · Difficulty {task.predictedDifficulty}/10 · {task.expectedDuration}m
                            </p>
                          </div>
                          <Link href={`/tasks`} className="text-primary hover:underline">
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
