"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Square, Coffee, CheckCircle2, RotateCcw, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useExecutionData } from "@/contexts/execution-data";
import { useNotificationPermission } from "@/lib/notifications";
import type { MasterTask, FocusSession } from "@/types/execution-os";

const workGrades = [
  { grade: 0, label: "Grade 0 (2–9 min)", defaultMin: 5, desc: "Entry-level action during high resistance, distraction or recovery." },
  { grade: 1, label: "Grade 1 (10–30 min)", defaultMin: 15, desc: "Comfortable starting duration for steady focus." },
  { grade: 2, label: "Grade 2 (30–60 min)", defaultMin: 35, desc: "Deeper immersion for complex analytical work." },
  { grade: 3, label: "Grade 3 (60–90 min)", defaultMin: 60, desc: "Extended focus for high capacity periods." },
  { grade: 4, label: "Grade 4 (90 min+)", defaultMin: 90, desc: "Peak sustained immersion. No pressure to go further." },
];

export default function FocusPage() {
  const { masterTasks, recordFocusSession, focusSessions } = useExecutionData();
  const { scheduleLocalNotification } = useNotificationPermission();

  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  // Timer states
  const [mode, setMode] = useState<"idle" | "focus" | "break">("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  // Review & extension modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [actualDifficulty, setActualDifficulty] = useState(5);
  const [interruptionReason, setInterruptionReason] = useState("");
  const [sessionReflection, setSessionReflection] = useState("");

  const activeTasks = useMemo(() => masterTasks.filter((t) => t.status !== "done" && !t.deletedAt), [masterTasks]);
  const activeTask = useMemo(() => masterTasks.find((t) => t.id === selectedTaskId), [masterTasks, selectedTaskId]);

  // Sync default duration when grade changes
  const handleSelectGrade = (grade: number) => {
    setSelectedGrade(grade);
    const g = workGrades.find((item) => item.grade === grade);
    if (g && mode === "idle") {
      setDurationMinutes(g.defaultMin);
      setSecondsRemaining(g.defaultMin * 60);
    }
  };

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (isRunning && secondsRemaining === 0) {
      setIsRunning(false);
      scheduleLocalNotification(
        mode === "focus" ? "Focus session complete!" : "Break complete! Ready to return?",
        { body: mode === "focus" ? "Record your session review." : "Choose your next focus duration." }
      );
      if (mode === "focus") {
        setShowReviewModal(true);
      } else {
        setMode("idle");
        setSecondsRemaining(durationMinutes * 60);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, mode, scheduleLocalNotification, durationMinutes]);

  const handleStartFocus = () => {
    setMode("focus");
    setIsRunning(true);
    setSessionStartTime(new Date().toISOString());
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleStopEarly = () => {
    setIsRunning(false);
    setShowReviewModal(true);
  };

  const handleStartBreak = (mins = 5) => {
    setShowReviewModal(false);
    setMode("break");
    setSecondsRemaining(mins * 60);
    setIsRunning(true);
  };

  const handleExtend = (extraMins: number) => {
    setShowReviewModal(false);
    setSecondsRemaining(extraMins * 60);
    setIsRunning(true);
  };

  const handleSaveReview = async () => {
    if (!sessionStartTime) return;
    const nowIso = new Date().toISOString();
    const elapsedMinutes = Math.max(1, Math.round((durationMinutes * 60 - secondsRemaining) / 60));

    await recordFocusSession({
      taskId: selectedTaskId || null,
      occurrenceId: null,
      taskTitle: activeTask?.title || "Free Focus",
      workGrade: selectedGrade,
      intendedDuration: durationMinutes,
      actualDuration: elapsedMinutes,
      startedAt: sessionStartTime,
      endedAt: nowIso,
      status: secondsRemaining === 0 ? "completed" : "interrupted",
      actualDifficulty,
      interruptionReason: interruptionReason.trim() || undefined,
      reflection: sessionReflection.trim() || undefined,
    });

    setShowReviewModal(false);
    setMode("idle");
    setSecondsRemaining(durationMinutes * 60);
  };

  // Capacity progression guidance
  const gradeProgression = useMemo(() => {
    const recentAtGrade = focusSessions.filter((f) => f.workGrade === selectedGrade).slice(0, 5);
    const successfulCount = recentAtGrade.filter((f) => f.status === "completed").length;
    const canProgress = recentAtGrade.length >= 5 && successfulCount >= 4 && selectedGrade < 4;
    return {
      canProgress,
      successfulCount,
      totalCount: recentAtGrade.length,
      nextGrade: selectedGrade + 1,
    };
  }, [focusSessions, selectedGrade]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Focus & Working Capacity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gradually build working endurance without burnout using Work Grades 0–4.
          </p>
        </div>

        {/* Capacity Progression Notice */}
        {gradeProgression.canProgress && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Capacity Progression Recommendation</p>
                <p className="text-xs text-muted-foreground">
                  You completed {gradeProgression.successfulCount} of your last {gradeProgression.totalCount} sessions at Grade {selectedGrade}. Would you like to advance to Grade {gradeProgression.nextGrade}?
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => handleSelectGrade(gradeProgression.nextGrade)}>
              Advance to Grade {gradeProgression.nextGrade}
            </Button>
          </div>
        )}

        {/* Timer Card */}
        <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 text-center shadow-lg sm:p-12">
          <Badge variant={mode === "break" ? "secondary" : "default"} className="mb-4 uppercase tracking-wider text-xs px-3 py-1">
            {mode === "break" ? "Break Timer" : `Focus Mode · Grade ${selectedGrade}`}
          </Badge>

          {/* Large Countdown */}
          <div className="font-mono text-6xl font-extrabold tracking-tight text-foreground sm:text-8xl">
            {formatTimer(secondsRemaining)}
          </div>

          {/* Active Task Callout */}
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {activeTask ? (
              <span>Target: <strong className="text-foreground">{activeTask.title}</strong></span>
            ) : (
              <span>No task selected (Autonomous Focus)</span>
            )}
          </p>

          {/* Controls */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {mode === "idle" && (
              <Button size="lg" onClick={handleStartFocus} className="gap-2 px-8 text-base shadow-md">
                <Play className="h-5 w-5" />
                Start Focus Session
              </Button>
            )}

            {mode !== "idle" && isRunning && (
              <Button size="lg" variant="outline" onClick={handlePause} className="gap-2 px-6">
                <Pause className="h-5 w-5" />
                Pause
              </Button>
            )}

            {mode !== "idle" && !isRunning && (
              <Button size="lg" onClick={handleResume} className="gap-2 px-6">
                <Play className="h-5 w-5" />
                Resume
              </Button>
            )}

            {mode !== "idle" && (
              <Button size="lg" variant="destructive" onClick={handleStopEarly} className="gap-2 px-6">
                <Square className="h-4 w-4" />
                End Session
              </Button>
            )}

            {mode === "idle" && (
              <Button size="lg" variant="outline" onClick={() => handleStartBreak(5)} className="gap-2">
                <Coffee className="h-4 w-4" />
                Quick 5m Break
              </Button>
            )}
          </div>
        </div>

        {/* Task Selection & Configuration */}
        {mode === "idle" && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Task Selector */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Choose Focus Task</h2>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-sm"
              >
                <option value="">Autonomous focus (no task linked)</option>
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} (Est. {t.expectedDuration}m)
                  </option>
                ))}
              </select>

              {activeTask?.firstAction && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                  <span className="font-semibold">First Action:</span> {activeTask.firstAction}
                </div>
              )}
            </div>

            {/* Work Grades Selector */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Work Grade</h2>
              <div className="space-y-2">
                {workGrades.map((g) => (
                  <button
                    key={g.grade}
                    type="button"
                    onClick={() => handleSelectGrade(g.grade)}
                    className={`flex w-full items-start justify-between rounded-xl border p-3 text-left transition-colors ${
                      selectedGrade === g.grade
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{g.label}</p>
                      <p className="text-[11px] text-muted-foreground">{g.desc}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary">{g.defaultMin}m</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Focus History */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Recent Focus Sessions ({focusSessions.length})</h2>
          {focusSessions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recorded sessions yet. Start your first session above.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {focusSessions.slice(0, 6).map((f) => (
                <div key={f.id} className="rounded-xl border border-border bg-card p-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="truncate">{f.taskTitle}</span>
                    <Badge variant={f.status === "completed" ? "default" : "outline"} className="text-[10px]">
                      {f.actualDuration}m
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Grade {f.workGrade} · {f.actualDifficulty ? `Diff: ${f.actualDifficulty}/10` : "Unrated"}
                  </p>
                  {f.reflection && <p className="mt-1 italic text-muted-foreground">"{f.reflection}"</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Session Completion & Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Focus Session Review</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Reflect on how this session went to calibrate your personal working capacity.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Actual Difficulty ({actualDifficulty}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={actualDifficulty}
                  onChange={(e) => setActualDifficulty(Number(e.target.value))}
                  className="mt-2 w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Interruption Reason (if stopped early)
                </label>
                <Input
                  placeholder="e.g. Call, fatigue, finished task early..."
                  value={interruptionReason}
                  onChange={(e) => setInterruptionReason(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Session Reflection (Optional)
                </label>
                <Input
                  placeholder="What helped or hindered your focus?"
                  value={sessionReflection}
                  onChange={(e) => setSessionReflection(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>

              {/* Extension Options */}
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Would you like to continue?</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExtend(5)}>
                    +5 Minutes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExtend(10)}>
                    +10 Minutes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStartBreak(5)}>
                    Take 5m Break
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <Button onClick={handleSaveReview} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Record Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
