"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Coffee, History, Pause, Play, RotateCcw, Settings2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTaskQuadrant, useExecutionData } from "@/contexts/execution-data";
import { formatSessionDate, formatTime as formatClockTime } from "@/lib/dates";

const WORK_PRESETS = [15, 25, 30, 45, 50, 60];
const BREAK_PRESETS = [5, 10, 15, 20];
type TimerStatus = "idle" | "running" | "paused";
type TimerMode = "work" | "break";

function formatSecondsDisplay(totalSecs: number) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isToday(value: string) {
  return Boolean(value && new Date(value).toDateString() === new Date().toDateString());
}

export default function FocusPage() {
  const { tasks, sessions, addFocusSession, quickTasks } = useExecutionData();

  const dailyTasks = useMemo(() => {
    return tasks.filter((t) => isToday(t.scheduledStart) && t.status !== "done");
  }, [tasks]);

  const eisenhowerBreakTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "done" && ["q2", "q3", "q4"].includes(getTaskQuadrant(t)));
  }, [tasks]);

  const activeQuickTasks = useMemo(() => {
    return quickTasks.filter((q) => !q.completed);
  }, [quickTasks]);

  const [mode, setMode] = useState<TimerMode>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedBreakOption, setSelectedBreakOption] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [error, setError] = useState("");
  const [customWorkInput, setCustomWorkInput] = useState("25");
  const [customBreakInput, setCustomBreakInput] = useState("5");

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  const selectedBreakTaskTitle = useMemo(() => {
    if (!selectedBreakOption) return "";
    if (selectedBreakOption.startsWith("quick:")) {
      const qId = selectedBreakOption.replace("quick:", "");
      const q = quickTasks.find((item) => item.id === qId);
      return q ? `⚡ ${q.title}` : "";
    }
    if (selectedBreakOption.startsWith("task:")) {
      const tId = selectedBreakOption.replace("task:", "");
      const t = tasks.find((item) => item.id === tId);
      return t ? `📋 ${t.title}` : "";
    }
    return "";
  }, [selectedBreakOption, quickTasks, tasks]);

  const totalSeconds = (mode === "work" ? durationMinutes : breakMinutes) * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => setRemainingSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "running" || remainingSeconds !== 0) return;
    const endedAt = new Date().toISOString();

    if (mode === "work" && selectedTask && startedAt) {
      addFocusSession({
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        startedAt,
        endedAt,
        durationMinutes,
      });
    }

    setStatus("idle");
    setStartedAt("");

    try {
      void new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => undefined);
    } catch {
      // ignore
    }
  }, [addFocusSession, durationMinutes, mode, remainingSeconds, selectedTask, startedAt, status]);

  const handleModeSwitch = (nextMode: TimerMode) => {
    if (status !== "idle") return;
    setMode(nextMode);
    setRemainingSeconds((nextMode === "work" ? durationMinutes : breakMinutes) * 60);
    setError("");
  };

  const handleStart = () => {
    if (mode === "work" && !selectedTaskId) {
      setError("Please choose the daily task you are going to do before starting.");
      return;
    }
    if (mode === "break" && !selectedBreakOption) {
      setError("Please choose a break task from under 5 min tasks or Eisenhower Q2/Q3/Q4.");
      return;
    }

    setError("");
    setStartedAt(mode === "work" ? new Date().toISOString() : "");
    setStatus("running");
  };

  const handlePause = () => setStatus("paused");

  const handleReset = () => {
    setStatus("idle");
    setStartedAt("");
    setRemainingSeconds((mode === "work" ? durationMinutes : breakMinutes) * 60);
    setError("");
  };

  const handleApplyCustomWork = (minutesVal: number) => {
    const val = Math.max(1, Math.min(180, minutesVal || 1));
    setDurationMinutes(val);
    setCustomWorkInput(String(val));
    if (status === "idle" && mode === "work") {
      setRemainingSeconds(val * 60);
    }
  };

  const handleApplyCustomBreak = (minutesVal: number) => {
    const val = Math.max(1, Math.min(60, minutesVal || 1));
    setBreakMinutes(val);
    setCustomBreakInput(String(val));
    if (status === "idle" && mode === "break") {
      setRemainingSeconds(val * 60);
    }
  };

  const statusDotClass = useMemo(() => {
    if (status === "running") return "bg-emerald-500 animate-pulse";
    if (status === "paused") return "bg-yellow-500";
    return "bg-muted-foreground/50";
  }, [status]);

  const statusLabel = useMemo(() => {
    if (status === "running") return "Running";
    if (status === "paused") return "Paused";
    return "Ready";
  }, [status]);

  const recentSessions = useMemo(() => {
    return [...sessions].reverse();
  }, [sessions]);

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="min-h-screen p-4 pb-24 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-4 w-4" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Focus & Pomodoro</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Deep work bounded by time. Select your daily task to begin.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleModeSwitch("work")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                mode === "work"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Focus Work
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("break")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                mode === "break"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Coffee className="h-3.5 w-3.5" />
              Break
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <Card className="relative overflow-hidden border-border/70 bg-gradient-to-b from-card to-card/60 shadow-lg">
              <CardContent className="p-6 sm:p-10 flex flex-col items-center">
                <div className="relative flex items-center justify-center my-4">
                  <svg className="h-64 w-64 sm:h-72 sm:w-72 -rotate-90 transform" viewBox="0 0 280 280">
                    <circle
                      cx="140"
                      cy="140"
                      r={radius}
                      className="stroke-muted/40"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="140"
                      cy="140"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="7"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className={`transition-all duration-500 ease-linear ${
                        mode === "work" ? "text-primary" : "text-emerald-500"
                      }`}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase tracking-[0.25em] font-semibold text-muted-foreground mb-1">
                      {mode === "work" ? "Focus Session" : "Rest & Reset"}
                    </span>
                    <div className="font-mono text-5xl sm:text-6xl font-light tracking-tight text-foreground select-none">
                      {formatSecondsDisplay(remainingSeconds)}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`inline-block h-2 w-2 rounded-full ${statusDotClass}`} />
                      <span className="text-xs text-muted-foreground font-medium">{statusLabel}</span>
                    </div>

                    {mode === "work" && selectedTask && (
                      <div className="mt-3 max-w-[180px] sm:max-w-[200px] truncate rounded-full bg-accent/60 px-3 py-1 text-[11px] text-accent-foreground font-medium">
                        🎯 {selectedTask.title}
                      </div>
                    )}
                    {mode === "break" && selectedBreakTaskTitle && (
                      <div className="mt-3 max-w-[180px] sm:max-w-[200px] truncate rounded-full bg-accent/60 px-3 py-1 text-[11px] text-accent-foreground font-medium">
                        {selectedBreakTaskTitle}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3 w-full max-w-xs">
                  {status === "running" ? (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="flex-1 gap-2 rounded-xl shadow-md"
                      onClick={handlePause}
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="flex-1 gap-2 rounded-xl shadow-md shadow-primary/20"
                      onClick={handleStart}
                    >
                      <Play className="h-4 w-4" />
                      {status === "paused" ? "Resume" : "Start Focus"}
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl px-4"
                    onClick={handleReset}
                    title="Reset timer"
                    aria-label="Reset timer"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-5 w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-center text-xs sm:text-sm font-medium text-red-700 dark:text-red-300 animate-in fade-in"
                  >
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {mode === "work" ? "Required: Select your daily task" : "Select a break task"}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {mode === "work"
                    ? "Before the timer starts, specify what work you will complete from your daily tasks."
                    : "Select a light action from under 5 min tasks or Eisenhower Q2/Q3/Q4 to refresh your mind."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === "work" ? (
                  <div>
                    <label htmlFor="daily-task-select" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Daily Tasks Available ({dailyTasks.length})
                    </label>
                    <select
                      id="daily-task-select"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      value={selectedTaskId}
                      disabled={status === "running"}
                      onChange={(e) => {
                        setSelectedTaskId(e.target.value);
                        setError("");
                      }}
                    >
                      <option value="">-- Choose what you are going to do --</option>
                      {dailyTasks.length > 0 ? (
                        dailyTasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.icon} {t.title} ({t.expectedDuration}m · {t.priority} priority)
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No active daily tasks found. Add tasks in Today/Tasks first!
                        </option>
                      )}
                    </select>

                    {selectedTask && (
                      <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-3.5 text-xs sm:text-sm space-y-1">
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{selectedTask.icon}</span> {selectedTask.title}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Scope:</span> {selectedTask.scope}
                        </p>
                        {selectedTask.firstAction && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">First action:</span>{" "}
                            {selectedTask.firstAction}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="break-task-select" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Choose Break Task
                    </label>
                    <select
                      id="break-task-select"
                      className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                      value={selectedBreakOption}
                      disabled={status === "running"}
                      onChange={(e) => {
                        setSelectedBreakOption(e.target.value);
                        setError("");
                      }}
                    >
                      <option value="">-- Choose a break task --</option>
                      {activeQuickTasks.length > 0 && (
                        <optgroup label="⚡ Under 5 Min Tasks">
                          {activeQuickTasks.map((q) => (
                            <option key={q.id} value={`quick:${q.id}`}>
                              {q.title}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {eisenhowerBreakTasks.length > 0 && (
                        <optgroup label="📋 Eisenhower Matrix (Q2, Q3, Q4)">
                          {eisenhowerBreakTasks.map((t) => (
                            <option key={t.id} value={`task:${t.id}`}>
                              {t.title} · {getTaskQuadrant(t).toUpperCase()} ({t.expectedDuration} min)
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {selectedBreakTaskTitle && (
                      <div className="mt-3 rounded-xl border border-border/70 bg-muted/40 p-3 text-xs sm:text-sm text-foreground">
                        Selected for break: <span className="font-semibold">{selectedBreakTaskTitle}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" />
                    Customise Timer
                  </span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {mode === "work" ? `${durationMinutes}m focus` : `${breakMinutes}m break`}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Pick a preset or enter exact minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Work Presets
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {WORK_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        size="sm"
                        variant={durationMinutes === preset ? "default" : "outline"}
                        className="h-8 text-xs font-medium rounded-lg"
                        disabled={status !== "idle"}
                        onClick={() => handleApplyCustomWork(preset)}
                      >
                        {preset}m
                      </Button>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <label htmlFor="custom-work-minutes" className="text-xs text-muted-foreground whitespace-nowrap">Custom work:</label>
                    <input
                      id="custom-work-minutes"
                      type="number"
                      min={1}
                      max={180}
                      value={customWorkInput}
                      disabled={status !== "idle"}
                      onChange={(e) => {
                        setCustomWorkInput(e.target.value);
                        handleApplyCustomWork(Number(e.target.value));
                      }}
                      className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-xs font-medium text-center focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Break Presets
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BREAK_PRESETS.map((preset) => (
                      <Button
                        key={preset}
                        size="sm"
                        variant={breakMinutes === preset ? "secondary" : "outline"}
                        className="h-8 text-xs font-medium rounded-lg"
                        disabled={status !== "idle"}
                        onClick={() => handleApplyCustomBreak(preset)}
                      >
                        {preset}m
                      </Button>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <label htmlFor="custom-break-minutes" className="text-xs text-muted-foreground whitespace-nowrap">Custom break:</label>
                    <input
                      id="custom-break-minutes"
                      type="number"
                      min={1}
                      max={60}
                      value={customBreakInput}
                      disabled={status !== "idle"}
                      onChange={(e) => {
                        setCustomBreakInput(e.target.value);
                        handleApplyCustomBreak(Number(e.target.value));
                      }}
                      className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-xs font-medium text-center focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Previous Sessions
                  </span>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {sessions.length} logged
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Auto-recorded work sessions with date & timestamps. Breaks are not recorded.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-border/70 bg-card/60 p-3 text-xs space-y-1 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-foreground truncate">{s.taskTitle}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                            {s.durationMinutes} min
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-0.5">
                          <span>{formatSessionDate(s.startedAt)}</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock3 className="h-3 w-3" />
                            {formatClockTime(s.startedAt)} – {formatClockTime(s.endedAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No completed focus sessions yet. Finish a timer to log your first session!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
