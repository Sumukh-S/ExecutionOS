"use client";

import { useMemo, useState } from "react";
import { Plus, Target, CalendarDays, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExecutionData } from "@/contexts/execution-data";

export default function WeeklyPage() {
  const { goals, occurrences, masterTasks } = useExecutionData();

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <CalendarDays className="h-4 w-4" />
            <span>Weekly Alignment</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Weekly Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review active weekly goals and scheduled master tasks across the current week.
          </p>
        </div>

        {/* Goals Progress */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Active Weekly Goals</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeGoals.length === 0 ? (
              <p className="py-4 text-xs italic text-muted-foreground">No active goals found.</p>
            ) : (
              activeGoals.map((g) => (
                <div key={g.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{g.title}</h3>
                    <span className="text-xs font-semibold text-primary">{g.currentProgress}%</span>
                  </div>
                  {g.desiredOutcome && <p className="mt-1 text-xs text-muted-foreground">{g.desiredOutcome}</p>}
                  <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${g.currentProgress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
