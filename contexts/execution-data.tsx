"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done";
export type FocusSession = { id: string; taskId: string; taskTitle: string; startedAt: string; endedAt: string; durationMinutes: number; status?: "completed" | "interrupted" };
export type CompletionReview = { actualDifficulty: number; actualMinutes: number; outcome: "yes" | "partially" | "no"; reflection: string; completedAt: string };
export type QuickTask = { id: string; title: string; completed: boolean; createdAt: string };
export type GoalProgressEntry = { id: string; value: number; note: string; recordedAt: string };

export type TaskRecord = {
  id: string;
  isMain?: boolean;
  parentId?: string | null;
  title: string;
  icon: string;
  listName: string;
  description: string;
  scope: string;
  firstAction: string;
  priority: Priority;
  status: TaskStatus;
  scheduledStart: string;
  scheduledEnd: string;
  deadline: string;
  location: string;
  alarm: boolean;
  notes: string;
  resources: string;
  predictedDifficulty: number;
  actualDifficulty: number | null;
  expectedDuration: number;
  plannedEnd?: string;
  wish: string;
  outcome: string;
  obstacle: string;
  weeklyGoal: string;
  monthlyGoal: string;
  createdAt: string;
  executionStartedAt?: string | null;
  executionPausedAt?: string | null;
  executionElapsedMs?: number;
  completionReview?: CompletionReview | null;
};

export type GoalRecord = { id: string; title: string; type: "weekly" | "monthly" | "longterm"; target: string; progress: number; progressMode?: "numeric" | "milestone"; progressEntries?: GoalProgressEntry[]; updatedAt?: string };

const today = new Date();
const dateAt = (hours: number, minutes: number) => {
  const date = new Date(today);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const SEED_TASKS: TaskRecord[] = [
  {
    id: "task-hashmap", title: "Solve HashMap Problems", icon: "🧠", listName: "Learning",
    description: "Complete the two-pointer and frequency-map exercises from the DSA set.", scope: "Solve 3 problems, write a short takeaway for each, and commit the notes.", firstAction: "Open the problem set and solve Two Sum without looking at the solution.",
    priority: "high", status: "todo", scheduledStart: dateAt(9, 0), scheduledEnd: dateAt(10, 30), deadline: dateAt(18, 0), location: "Study desk", alarm: true,
    notes: "Focus on the invariant before coding.", resources: "https://leetcode.com/problems/two-sum/", predictedDifficulty: 6, actualDifficulty: null, expectedDuration: 90,
    wish: "I want to feel fluent with the core pattern.", outcome: "Three solved problems and one reusable pattern note.", obstacle: "Getting stuck optimizing before the brute-force version works.", weeklyGoal: "Complete 15 DSA problems", monthlyGoal: "Complete Java + DSA preparation", createdAt: today.toISOString(),
  },
  {
    id: "task-dsa", title: "Review DSA Patterns", icon: "💻", listName: "Learning",
    description: "Review the pattern notes and test recall with a timed exercise.", scope: "Review sliding window, two pointers, and hash maps for 60 minutes.", firstAction: "Open the pattern notes and start a 25-minute timer.",
    priority: "medium", status: "todo", scheduledStart: dateAt(14, 0), scheduledEnd: dateAt(15, 0), deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 18).toISOString(), location: "Library", alarm: false,
    notes: "Write down the trigger for each pattern.", resources: "", predictedDifficulty: 7, actualDifficulty: null, expectedDuration: 60,
    wish: "I want to recall the patterns without prompting.", outcome: "A one-page recall sheet and one timed solution.", obstacle: "Passive rereading instead of retrieval.", weeklyGoal: "Complete 15 DSA problems", monthlyGoal: "Complete Java + DSA preparation", createdAt: today.toISOString(),
  },
  {
    id: "task-gym", title: "Morning Gym Session", icon: "🏋️", listName: "Fitness",
    description: "Strength session focused on lower body and mobility.", scope: "Warm up, complete the three programmed lifts, then stretch.", firstAction: "Pack water and leave by 7:00.",
    priority: "medium", status: "in_progress", scheduledStart: dateAt(7, 0), scheduledEnd: dateAt(8, 0), deadline: "", location: "Community gym", alarm: true,
    notes: "Keep the intensity moderate after poor sleep.", resources: "", predictedDifficulty: 5, actualDifficulty: null, expectedDuration: 60,
    wish: "I want to keep the streak without overreaching.", outcome: "Complete the session and record the weights.", obstacle: "Low energy in the first ten minutes.", weeklyGoal: "Train three times", monthlyGoal: "Build a consistent fitness routine", createdAt: today.toISOString(),
  },
];

const SEED_GOALS: GoalRecord[] = [
  { id: "weekly-dsa", title: "Complete 15 DSA problems", type: "weekly", target: "15 problems", progress: 8 },
  { id: "weekly-fitness", title: "Train three times", type: "weekly", target: "3 sessions", progress: 1 },
  { id: "monthly-java", title: "Complete Java + DSA preparation", type: "monthly", target: "20 study sessions", progress: 9 },
  { id: "longterm-job", title: "Get a software job", type: "longterm", target: "Portfolio ready", progress: 3 },
];

const SEED_QUICK_TASKS: QuickTask[] = [
  { id: "quick-1", title: "Reply to recruiter email", completed: false, createdAt: today.toISOString() },
  { id: "quick-2", title: "Drink a glass of water & stretch", completed: false, createdAt: today.toISOString() },
  { id: "quick-3", title: "Clear desk clutter", completed: false, createdAt: today.toISOString() },
];

type ExecutionDataContext = {
  tasks: TaskRecord[];
  goals: GoalRecord[];
  sessions: FocusSession[];
  quickTasks: QuickTask[];
  addTask: (task: Omit<TaskRecord, "id" | "createdAt" | "actualDifficulty" | "status"> & { status?: TaskStatus }) => boolean;
  updateTask: (id: string, task: Partial<TaskRecord>) => void;
  recordCompletion: (id: string, review: CompletionReview) => void;
  startExecution: (id: string) => void;
  pauseExecution: (id: string) => void;
  resumeExecution: (id: string) => void;
  archiveTask: (id: string) => void;
  deleteTask: (id: string) => void;
  startTask: (id: string) => void;
  completeTask: (id: string, actualDifficulty: number) => void;
  addFocusSession: (session: Omit<FocusSession, "id"> & { id?: string }) => void;
  addGoal: (goal: Omit<GoalRecord, "id" | "progress"> & { progress?: number }) => void;
  updateGoal: (id: string, patch: Partial<GoalRecord>) => void;
  updateGoalProgress: (id: string, value: number, note?: string) => void;
  restoreData: (data: Partial<Pick<ExecutionDataContext, "tasks" | "goals" | "sessions" | "quickTasks">>, mode: "merge" | "replace") => void;
  addQuickTask: (title: string) => void;
  updateQuickTask: (id: string, title: string) => void;
  toggleQuickTask: (id: string) => void;
  deleteQuickTask: (id: string) => void;
};

const ExecutionDataContext = createContext<ExecutionDataContext | null>(null);
const STORAGE_KEY = "execution-os-data";

type PersistedState = Pick<ExecutionDataContext, "tasks" | "goals" | "sessions" | "quickTasks">;

function normalizeTask(task: TaskRecord): TaskRecord {
  return {
    ...task,
    isMain: task.isMain ?? false,
    parentId: task.parentId ?? null,
    actualDifficulty: task.actualDifficulty ?? task.completionReview?.actualDifficulty ?? null,
    expectedDuration: Number.isFinite(task.expectedDuration) ? task.expectedDuration : 0,
    executionStartedAt: task.executionStartedAt ?? null,
    executionPausedAt: task.executionPausedAt ?? null,
    executionElapsedMs: Number.isFinite(task.executionElapsedMs) ? task.executionElapsedMs! : 0,
    completionReview: task.completionReview ?? null,
  };
}

export function ExecutionDataProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskRecord[]>(SEED_TASKS);
  const [goals, setGoals] = useState<GoalRecord[]>(SEED_GOALS);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [quickTasks, setQuickTasks] = useState<QuickTask[]>(SEED_QUICK_TASKS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistedState>;
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks.map((task) => normalizeTask(task)));
        if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
        if (Array.isArray(parsed.quickTasks)) setQuickTasks(parsed.quickTasks);
        if (Array.isArray(parsed.goals)) setGoals(parsed.goals.map((goal) => ({ ...goal, progressEntries: goal.progressEntries ?? [], progressMode: goal.progressMode ?? "numeric" })));
      }
    } catch {
      // Preserve corrupt data for user recovery; do not destroy it on load.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, sessions, quickTasks, goals }));
  }, [goals, hydrated, quickTasks, sessions, tasks]);

  const value = useMemo<ExecutionDataContext>(() => ({
    tasks,
    goals,
    sessions,
    quickTasks,
    addTask: (task) => {
      if (task.isMain && tasks.filter((item) => item.isMain && item.status !== "done").length >= 2) return false;
      setTasks((current) => {
        if (task.isMain && current.filter((item) => item.isMain && item.status !== "done").length >= 2) return current;
        return [...current, normalizeTask({ ...task, id: `task-${Date.now()}`, createdAt: new Date().toISOString(), actualDifficulty: null, status: task.status ?? "todo" } as TaskRecord)];
      });
      return true;
    },
    updateTask: (id, task) => setTasks((current) => current.map((item) => item.id === id ? normalizeTask({ ...item, ...task, id: item.id, createdAt: item.createdAt }) : item)),
    recordCompletion: (id, review) => setTasks((current) => current.map((item) => item.id === id ? { ...item, status: "done", actualDifficulty: review.actualDifficulty, completionReview: { ...review } } : item)),
    startExecution: (id) => setTasks((current) => current.map((item) => item.id === id && item.status !== "done" ? { ...item, status: "in_progress", executionStartedAt: item.executionStartedAt ?? new Date().toISOString(), executionPausedAt: null } : item)),
    pauseExecution: (id) => setTasks((current) => current.map((item) => {
      if (item.id !== id || item.status !== "in_progress" || !item.executionStartedAt) return item;
      const now = Date.now();
      const elapsed = Math.max(0, now - new Date(item.executionStartedAt).getTime());
      return { ...item, status: "todo", executionElapsedMs: (item.executionElapsedMs ?? 0) + elapsed, executionStartedAt: null, executionPausedAt: new Date(now).toISOString() };
    })),
    resumeExecution: (id) => setTasks((current) => current.map((item) => item.id === id && item.status !== "done" ? { ...item, status: "in_progress", executionStartedAt: new Date().toISOString(), executionPausedAt: null } : item)),
    archiveTask: (id) => setTasks((current) => current.map((item) => item.id === id ? { ...item, status: "done" } : item)),
    deleteTask: (id) => setTasks((current) => current.filter((task) => task.id !== id)),
    startTask: (id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status: "in_progress", executionStartedAt: new Date().toISOString() } : task)),
    completeTask: (id, actualDifficulty) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status: "done", actualDifficulty } : task)),
    addFocusSession: (session) => setSessions((current) => current.some((item) => item.id === session.id) ? current : [...current, { ...session, id: session.id || `session-${Date.now()}` }]),
    addGoal: (goal) => setGoals((current) => [...current, { ...goal, id: `goal-${Date.now()}`, progress: goal.progress ?? 0, progressEntries: goal.progressEntries ?? [] }]),
    updateGoal: (id, patch) => setGoals((current) => current.map((goal) => goal.id === id ? { ...goal, ...patch, id: goal.id } : goal)),
    updateGoalProgress: (id, progress, note = "") => setGoals((current) => current.map((goal) => goal.id === id ? { ...goal, progress, progressEntries: [...(goal.progressEntries ?? []), { id: `progress-${Date.now()}`, value: progress, note, recordedAt: new Date().toISOString() }], updatedAt: new Date().toISOString() } : goal)),
    restoreData: (data, mode) => {
      const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]) => {
        const map = new Map(existing.map((item) => [item.id, item]));
        incoming.forEach((item) => map.set(item.id, item));
        return [...map.values()];
      };
      if (data.tasks) setTasks((current) => mode === "replace" ? data.tasks!.map(normalizeTask) : mergeById(current, data.tasks!.map(normalizeTask)));
      if (data.goals) setGoals((current) => mode === "replace" ? data.goals! : mergeById(current, data.goals!));
      if (data.sessions) setSessions((current) => mode === "replace" ? data.sessions! : mergeById(current, data.sessions!));
      if (data.quickTasks) setQuickTasks((current) => mode === "replace" ? data.quickTasks! : mergeById(current, data.quickTasks!));
    },
    addQuickTask: (title) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setQuickTasks((current) => [...current, { id: `quick-${Date.now()}`, title: trimmed, completed: false, createdAt: new Date().toISOString() }]);
    },
    updateQuickTask: (id, title) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setQuickTasks((current) => current.map((item) => item.id === id ? { ...item, title: trimmed } : item));
    },
    toggleQuickTask: (id) => setQuickTasks((current) => current.map((item) => item.id === id ? { ...item, completed: !item.completed } : item)),
    deleteQuickTask: (id) => setQuickTasks((current) => current.filter((item) => item.id !== id)),
  }), [goals, quickTasks, sessions, tasks]);

  return <ExecutionDataContext.Provider value={value}>{children}</ExecutionDataContext.Provider>;
}

export function getTaskQuadrant(task: TaskRecord) {
  const urgent = task.priority === "urgent" || Boolean(task.deadline && new Date(task.deadline).getTime() - Date.now() < 48 * 60 * 60 * 1000);
  const important = task.priority === "high" || task.priority === "urgent";
  if (urgent) {
    return important ? "q1" : "q3";
  }
  return important ? "q2" : "q4";
}

export function useExecutionData() {
  const context = useContext(ExecutionDataContext);
  if (!context) throw new Error("useExecutionData must be used within ExecutionDataProvider");
  return context;
}
