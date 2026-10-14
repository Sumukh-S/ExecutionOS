"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Sun,
  Timer,
  Target,
  Sparkles,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Play,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExecutionData } from "@/contexts/execution-data";
import { getTodayDateString } from "@/lib/date-utils";

export default function DashboardPage() {
  const todayStr = getTodayDateString();
  const { masterTasks, occurrences, events, goals, focusSessions, preferences } = useExecutionData();

  // Today's completion
  const todayOccurrences = useMemo(
    () => occurrences.filter((o) => o.scheduledDate === todayStr),
    [occurrences, todayStr]
  );

  const todayCompleted = useMemo(
    () => todayOccurrences.filter((o) => o.status === "done").length,
    [todayOccurrences]
  );

  // Active Main Task for today
  const mainToday = useMemo(() => {
    const mainOcc = todayOccurrences.find((o) => o.dailySection === "main" && o.status !== "done");
    if (!mainOcc) return null;
    return masterTasks.find((t) => t.id === mainOcc.taskId);
  }, [todayOccurrences, masterTasks]);

  // Upcoming Deadlines (within 48 hours)
  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    const horizon = now + 48 * 60 * 60 * 1000;
    return masterTasks
      .filter((t) => {
        if (!t.deadline || t.status === "done" || t.deletedAt) return false;
        const dTime = new Date(t.deadline).getTime();
        return dTime > now && dTime < horizon;
      })
      .slice(0, 3);
  }, [masterTasks]);

  // Meaningful active goal
  const primaryGoal = useMemo(() => goals.find((g) => g.status === "active"), [goals]);

  // Last unfinished task
  const lastUnfinishedTask = useMemo(
    () => masterTasks.find((t) => t.status === "in_progress" || (t.status === "todo" && t.scheduledDate === todayStr)),
    [masterTasks, todayStr]
  );

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A concise overview of today's state, current capacity, and immediate priorities.
          </p>
        </div>

        {/* Top 3 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Execution</span>
              <Sun className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground">
              {todayCompleted}/{todayOccurrences.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Tasks completed today</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Current Work Grade</span>
              <Timer className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground">
              Grade {preferences?.currentWorkGrade ?? 1}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Sustainable focus capacity</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Focus Total</span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-extrabold text-foreground">
              {Math.round(focusSessions.reduce((acc, f) => acc + f.actualDuration, 0) / 60)}h
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{focusSessions.length} total sessions recorded</p>
          </div>
        </div>

        {/* Quick Action: Resume Focus */}
        {lastUnfinishedTask && (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                <Play className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Resume Focus Task</p>
                <p className="text-sm font-bold text-foreground">{lastUnfinishedTask.title}</p>
              </div>
            </div>

            <Button asChild size="sm" className="gap-2">
              <Link href={`/focus?task=${lastUnfinishedTask.id}`}>
                Start Focus Timer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* 2-Column Section: Deadlines & Meaningful Goal */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Upcoming Deadlines */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Upcoming Deadlines (Next 48 Hours)
            </h2>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs italic text-muted-foreground py-2">No imminent deadlines within 48 hours.</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-border/80 p-3 text-xs">
                    <span className="font-semibold text-foreground truncate">{t.title}</span>
                    <span className="text-[11px] text-red-500 font-medium">
                      {new Date(t.deadline!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Primary Goal */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Active Focus Goal
            </h2>
            {primaryGoal ? (
              <div>
                <h3 className="text-base font-bold text-foreground">{primaryGoal.title}</h3>
                {primaryGoal.desiredOutcome && (
                  <p className="mt-1 text-xs text-muted-foreground">{primaryGoal.desiredOutcome}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-semibold text-foreground">{primaryGoal.currentProgress}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${primaryGoal.currentProgress}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground py-2">No active goal defined.</p>
            )}
          </div>
        </div>

        {/* Navigation jump shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-xs">
          <Link href="/today" className="font-semibold text-primary hover:underline flex items-center gap-1">
            <Sun className="h-3.5 w-3.5" /> Jump to Today's Workspace
          </Link>
          <Link href="/tomorrow" className="font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
            Prepare Tomorrow
          </Link>
          <Link href="/journal" className="font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
            Review Journal
          </Link>
        </div>
      </div>
    </div>
  );
}
