"use client";

import { useMemo } from "react";
import { BarChart3, Clock, Gauge, Target, Compass, Sparkles, Activity } from "lucide-react";
import { useExecutionData } from "@/contexts/execution-data";

export default function AnalyticsPage() {
  const { masterTasks, occurrences, focusSessions, fiveMinuteTasks } = useExecutionData();

  // Execution calibration
  const executionMetrics = useMemo(() => {
    const totalCompletedTasks = masterTasks.filter((t) => t.status === "done").length;
    const totalOccurrences = occurrences.length;
    const completedOccurrences = occurrences.filter((o) => o.status === "done").length;
    const completionRate = totalOccurrences > 0 ? Math.round((completedOccurrences / totalOccurrences) * 100) : 0;

    const fiveMinTotal = fiveMinuteTasks.length;
    const fiveMinDone = fiveMinuteTasks.filter((f) => f.completed).length;

    return {
      totalCompletedTasks,
      totalOccurrences,
      completedOccurrences,
      completionRate,
      fiveMinTotal,
      fiveMinDone,
    };
  }, [masterTasks, occurrences, fiveMinuteTasks]);

  // Difficulty calibration (predicted vs actual)
  const difficultyCalibration = useMemo(() => {
    const completedOccsWithDifficulty = occurrences.filter(
      (o) => o.status === "done" && o.actualDifficulty !== null
    );

    if (completedOccsWithDifficulty.length === 0) {
      return { count: 0, avgPredicted: 0, avgActual: 0, diff: 0 };
    }

    let sumPredicted = 0;
    let sumActual = 0;

    completedOccsWithDifficulty.forEach((occ) => {
      const task = masterTasks.find((t) => t.id === occ.taskId);
      sumPredicted += task?.predictedDifficulty ?? 5;
      sumActual += occ.actualDifficulty ?? 5;
    });

    const count = completedOccsWithDifficulty.length;
    const avgPredicted = Math.round((sumPredicted / count) * 10) / 10;
    const avgActual = Math.round((sumActual / count) * 10) / 10;
    const diff = Math.round((avgActual - avgPredicted) * 10) / 10;

    return { count, avgPredicted, avgActual, diff };
  }, [occurrences, masterTasks]);

  // Duration calibration (expected vs actual)
  const durationCalibration = useMemo(() => {
    const totalFocusMinutes = focusSessions.reduce((acc, f) => acc + f.actualDuration, 0);
    const completedSessions = focusSessions.filter((f) => f.status === "completed").length;
    const interruptedSessions = focusSessions.filter((f) => f.status === "interrupted").length;

    return {
      totalFocusMinutes,
      totalFocusHours: Math.round((totalFocusMinutes / 60) * 10) / 10,
      completedSessions,
      interruptedSessions,
    };
  }, [focusSessions]);

  // Supported Evidence-Based Insights
  const empiricalInsights = useMemo(() => {
    const insights: string[] = [];

    if (difficultyCalibration.count >= 3) {
      if (difficultyCalibration.diff < -0.5) {
        insights.push(
          `Observed (${difficultyCalibration.count} tasks): Your actual difficulty is on average ${Math.abs(difficultyCalibration.diff)} points lower than predicted. Tasks feel easier once started.`
        );
      } else if (difficultyCalibration.diff > 0.5) {
        insights.push(
          `Observed (${difficultyCalibration.count} tasks): Your actual difficulty is ${difficultyCalibration.diff} points higher than predicted. Consider breaking down scope into smaller units.`
        );
      }
    }

    if (focusSessions.length >= 3) {
      const gradeZeroSessions = focusSessions.filter((f) => f.workGrade === 0).length;
      if (gradeZeroSessions > 0) {
        insights.push(
          `Observed (${gradeZeroSessions} sessions): Starting with Grade 0 (2–9m) successfully bypassed initial resistance without burnout.`
        );
      }
    }

    return insights;
  }, [difficultyCalibration, focusSessions]);

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Personal Behavioural Intelligence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear empirical observations about how you actually execute, without assumptions or generic scores.
          </p>
        </div>

        {/* Section A: Execution Metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Completed</span>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{executionMetrics.totalCompletedTasks}</p>
            <p className="mt-1 text-xs text-muted-foreground">Master tasks done</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Daily Completion</span>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{executionMetrics.completionRate}%</p>
            <p className="mt-1 text-xs text-muted-foreground">Planned vs executed</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Total Focus Time</span>
            <p className="mt-2 text-3xl font-extrabold text-foreground">{durationCalibration.totalFocusHours}h</p>
            <p className="mt-1 text-xs text-muted-foreground">{focusSessions.length} total sessions</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <span className="text-xs font-semibold uppercase text-muted-foreground">5-Minute Items</span>
            <p className="mt-2 text-3xl font-extrabold text-foreground">
              {executionMetrics.fiveMinDone}/{executionMetrics.fiveMinTotal}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Quick checklists done</p>
          </div>
        </div>

        {/* Section B: Difficulty Calibration */}
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Difficulty Calibration</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Comparing your anticipated difficulty (1–10) with your actual experienced difficulty.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
            <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-center">
              <span className="text-xs text-muted-foreground">Avg Predicted Difficulty</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{difficultyCalibration.avgPredicted} / 10</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-center">
              <span className="text-xs text-muted-foreground">Avg Experienced Difficulty</span>
              <p className="mt-1 text-2xl font-bold text-foreground">{difficultyCalibration.avgActual} / 10</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-center">
              <span className="text-xs text-muted-foreground">Calibration Delta</span>
              <p
                className={`mt-1 text-2xl font-bold ${
                  difficultyCalibration.diff < 0 ? "text-emerald-500" : "text-amber-500"
                }`}
              >
                {difficultyCalibration.diff > 0 ? `+${difficultyCalibration.diff}` : difficultyCalibration.diff}
              </p>
            </div>
          </div>
        </section>

        {/* Section C: Evidence-Based Behavioral Insights */}
        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Empirical Behavioural Insights</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Only generated when supported by sufficient recorded observations.
          </p>

          <div className="space-y-3 pt-2">
            {empiricalInsights.length === 0 ? (
              <p className="text-xs italic text-muted-foreground">
                Insufficient data to generate calibrated insights. Complete at least 3 tasks with difficulty ratings.
              </p>
            ) : (
              empiricalInsights.map((ins, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-sm">
                  {ins}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
