"use client";

import { useMemo } from "react";
import { BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, UtilityPage } from "@/components/utility-page";
import { useExecutionData } from "@/contexts/execution-data";

export default function AnalyticsPage() {
  const { tasks, sessions } = useExecutionData();
  const reviewedTasks = useMemo(() => tasks.filter((task) => task.completionReview != null), [tasks]);
  const completedCount = useMemo(() => tasks.filter((task) => task.status === "done").length, [tasks]);
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const totalFocusMinutes = useMemo(() => sessions.reduce((sum, s) => sum + s.durationMinutes, 0), [sessions]);

  const { avgPredicted, avgActual, avgDiff, durationDiffAvg } = useMemo(() => {
    if (!reviewedTasks.length) return { avgPredicted: 0, avgActual: 0, avgDiff: 0, durationDiffAvg: 0 };
    const totalPredicted = reviewedTasks.reduce((sum, t) => sum + t.predictedDifficulty, 0);
    const totalActual = reviewedTasks.reduce((sum, t) => sum + (t.completionReview?.actualDifficulty ?? t.actualDifficulty ?? t.predictedDifficulty), 0);
    const totalDiff = reviewedTasks.reduce((sum, t) => {
      const actual = t.completionReview?.actualDifficulty ?? t.actualDifficulty ?? t.predictedDifficulty;
      return sum + (actual - t.predictedDifficulty);
    }, 0);
    const totalDurationDiff = reviewedTasks.reduce((sum, t) => {
      const actualMins = t.completionReview?.actualMinutes ?? t.expectedDuration;
      return sum + (actualMins - t.expectedDuration);
    }, 0);
    return {
      avgPredicted: (totalPredicted / reviewedTasks.length).toFixed(1),
      avgActual: (totalActual / reviewedTasks.length).toFixed(1),
      avgDiff: (totalDiff / reviewedTasks.length).toFixed(1),
      durationDiffAvg: (totalDurationDiff / reviewedTasks.length).toFixed(1),
    };
  }, [reviewedTasks]);

  const outcomeCounts = useMemo(() => {
    const counts = { yes: 0, partially: 0, no: 0 };
    reviewedTasks.forEach((t) => {
      const out = t.completionReview?.outcome;
      if (out && counts[out] !== undefined) counts[out] += 1;
    });
    return counts;
  }, [reviewedTasks]);

  return (
    <UtilityPage title="Analytics" description="Performance tracking and difficulty estimation trends.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Completion rate" value={`${completionRate}%`} detail={`${completedCount} of ${tasks.length} total tasks`} />
        <MetricCard label="Focus time" value={`${(totalFocusMinutes / 60).toFixed(1)}h`} detail={`${sessions.length} recorded sessions`} />
        <MetricCard label="Avg difficulty diff" value={`${Number(avgDiff) > 0 ? `+${avgDiff}` : avgDiff}`} detail="Actual − Predicted difficulty" />
        <MetricCard label="Time estimation diff" value={`${Number(durationDiffAvg) > 0 ? `+${durationDiffAvg}m` : `${durationDiffAvg}m`}`} detail="Actual − Estimated duration" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Difficulty estimation accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b border-border/60 pb-2 text-sm">
              <span className="text-muted-foreground">Average predicted difficulty</span>
              <span className="font-semibold">{avgPredicted} / 10</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2 text-sm">
              <span className="text-muted-foreground">Average actual difficulty</span>
              <span className="font-semibold">{avgActual} / 10</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2 text-sm">
              <span className="text-muted-foreground">Reviewed completed tasks</span>
              <span className="font-semibold">{reviewedTasks.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Formula: Difficulty difference = Actual difficulty − Predicted difficulty. Positive numbers mean tasks felt harder than expected.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Goal & outcome fidelity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <p className="text-xs text-muted-foreground">Achieved</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{outcomeCounts.yes}</p>
              </div>
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                <p className="text-xs text-muted-foreground">Partially</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{outcomeCounts.partially}</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-xs text-muted-foreground">Not achieved</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{outcomeCounts.no}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-primary" /> Long-term trend insight
              </p>
              <p>
                Estimation differences normalize over time. Review task reflections regularly to identify friction patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Task Reviews ({reviewedTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewedTasks.length > 0 ? (
            <div className="space-y-3">
              {reviewedTasks.slice(-5).reverse().map((task) => (
                <div key={task.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{task.icon} {task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Predicted: {task.predictedDifficulty}/10 · Actual: {task.completionReview?.actualDifficulty}/10 · Diff: {(task.completionReview?.actualDifficulty ?? 0) - task.predictedDifficulty}
                      </p>
                    </div>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs uppercase font-medium">
                      Outcome: {task.completionReview?.outcome}
                    </span>
                  </div>
                  {task.completionReview?.reflection && (
                    <p className="mt-2 text-xs italic text-muted-foreground">
                      “{task.completionReview.reflection}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-sm text-muted-foreground">
              Complete regular tasks with the mandatory review modal to unlock personalized performance analytics.
            </p>
          )}
        </CardContent>
      </Card>
    </UtilityPage>
  );
}
