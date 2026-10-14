"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { repository } from "@/lib/db/repository";
import { syncEngine } from "@/lib/sync/engine";
import { useAuth } from "@/contexts/auth";

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

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const getSeedTasks = (): TaskRecord[] => [
  {
    id: generateUUID(), title: "Solve HashMap Problems", icon: "🧠", listName: "Learning",
    description: "Complete the two-pointer and frequency-map exercises from the DSA set.", scope: "Solve 3 problems, write a short takeaway for each, and commit the notes.", firstAction: "Open the problem set and solve Two Sum without looking at the solution.",
    priority: "high", status: "todo", scheduledStart: dateAt(9, 0), scheduledEnd: dateAt(10, 30), deadline: dateAt(18, 0), location: "Study desk", alarm: true,
    notes: "Focus on the invariant before coding.", resources: "https://leetcode.com/problems/two-sum/", predictedDifficulty: 6, actualDifficulty: null, expectedDuration: 90,
    wish: "I want to feel fluent with the core pattern.", outcome: "Three solved problems and one reusable pattern note.", obstacle: "Getting stuck optimizing before the brute-force version works.", weeklyGoal: "Complete 15 DSA problems", monthlyGoal: "Complete Java + DSA preparation", createdAt: today.toISOString(),
  },
  {
    id: generateUUID(), title: "Review DSA Patterns", icon: "💻", listName: "Learning",
    description: "Review the pattern notes and test recall with a timed exercise.", scope: "Review sliding window, two pointers, and hash maps for 60 minutes.", firstAction: "Open the pattern notes and start a 25-minute timer.",
    priority: "medium", status: "todo", scheduledStart: dateAt(14, 0), scheduledEnd: dateAt(15, 0), deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 18).toISOString(), location: "Library", alarm: false,
    notes: "Write down the trigger for each pattern.", resources: "", predictedDifficulty: 7, actualDifficulty: null, expectedDuration: 60,
    wish: "I want to recall the patterns without prompting.", outcome: "A one-page recall sheet and one timed solution.", obstacle: "Passive rereading instead of retrieval.", weeklyGoal: "Complete 15 DSA problems", monthlyGoal: "Complete Java + DSA preparation", createdAt: today.toISOString(),
  },
  {
    id: generateUUID(), title: "Morning Gym Session", icon: "🏋️", listName: "Fitness",
    description: "Strength session focused on lower body and mobility.", scope: "Warm up, complete the three programmed lifts, then stretch.", firstAction: "Pack water and leave by 7:00.",
    priority: "medium", status: "in_progress", scheduledStart: dateAt(7, 0), scheduledEnd: dateAt(8, 0), deadline: "", location: "Community gym", alarm: true,
    notes: "Keep the intensity moderate after poor sleep.", resources: "", predictedDifficulty: 5, actualDifficulty: null, expectedDuration: 60,
    wish: "I want to keep the streak without overreaching.", outcome: "Complete the session and record the weights.", obstacle: "Low energy in the first ten minutes.", weeklyGoal: "Train three times", monthlyGoal: "Build a consistent fitness routine", createdAt: today.toISOString(),
  },
];

const getSeedGoals = (): GoalRecord[] => [
  { id: generateUUID(), title: "Complete 15 DSA problems", type: "weekly", target: "15 problems", progress: 8 },
  { id: generateUUID(), title: "Train three times", type: "weekly", target: "3 sessions", progress: 1 },
  { id: generateUUID(), title: "Complete Java + DSA preparation", type: "monthly", target: "20 study sessions", progress: 9 },
  { id: generateUUID(), title: "Get a software job", type: "longterm", target: "Portfolio ready", progress: 3 },
];

const getSeedQuickTasks = (): QuickTask[] => [
  { id: generateUUID(), title: "Reply to recruiter email", completed: false, createdAt: today.toISOString() },
  { id: generateUUID(), title: "Drink a glass of water & stretch", completed: false, createdAt: today.toISOString() },
  { id: generateUUID(), title: "Clear desk clutter", completed: false, createdAt: today.toISOString() },
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
  deleteGoal: (id: string) => void;
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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRecord[]>(() => getSeedTasks());
  const [goals, setGoals] = useState<GoalRecord[]>(() => getSeedGoals());
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [quickTasks, setQuickTasks] = useState<QuickTask[]>(() => getSeedQuickTasks());
  const [hydrated, setHydrated] = useState(false);

  // Initialize from IndexedDB Repository with fallback migration from localStorage
  useEffect(() => {
    async function initData() {
      try {
        if (typeof window !== "undefined") {
          // Check if Dexie has tasks already
          const localTasks = await repository.getAllTasks(user?.id);
          const localGoals = await repository.getAllGoals(user?.id);
          const localQuick = await repository.getAllQuickTasks(user?.id);
          const localSessions = await repository.getAllFocusSessions(user?.id);

          if (localTasks.length > 0 || localGoals.length > 0) {
            setTasks(localTasks.map(normalizeTask));
            setGoals(localGoals);
            setQuickTasks(localQuick);
            setSessions(localSessions);
          } else {
            // First time: migrate from localStorage safely if present
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored) as Partial<PersistedState>;
              const migTasks = Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : getSeedTasks();
              const migGoals = Array.isArray(parsed.goals) ? parsed.goals : getSeedGoals();
              const migQuick = Array.isArray(parsed.quickTasks) ? parsed.quickTasks : getSeedQuickTasks();
              const migSessions = Array.isArray(parsed.sessions) ? parsed.sessions : [];

              // Create pre-migration recovery backup in localStorage
              window.localStorage.setItem("execution-os-backup-pre-migration", stored);

              setTasks(migTasks);
              setGoals(migGoals);
              setQuickTasks(migQuick);
              setSessions(migSessions);

              // Persist into IndexedDB
              for (const t of migTasks) await repository.saveTask(t, true, user?.id);
              for (const g of migGoals) await repository.saveGoal(g, true, user?.id);
              for (const q of migQuick) await repository.saveQuickTask(q, true, user?.id);
              for (const s of migSessions) await repository.saveFocusSession(s, user?.id);
            } else {
              // Seed into IndexedDB
              const initialTasks = getSeedTasks();
              const initialGoals = getSeedGoals();
              const initialQuick = getSeedQuickTasks();
              setTasks(initialTasks);
              setGoals(initialGoals);
              setQuickTasks(initialQuick);
              for (const t of initialTasks) await repository.saveTask(t, true, user?.id);
              for (const g of initialGoals) await repository.saveGoal(g, true, user?.id);
              for (const q of initialQuick) await repository.saveQuickTask(q, true, user?.id);
            }
          }
        }
      } catch (err) {
        console.error("IndexedDB initialization error:", err);
      } finally {
        setHydrated(true);
        // Automatically trigger sync if user is signed in
        if (user) {
          syncEngine.triggerSync(user.id).catch(() => undefined);
        }
      }
    }

    initData();
  }, [user]);

  // Keep backup in localStorage for extra resiliency
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, sessions, quickTasks, goals }));
    } catch {
      // ignore quota exceeded if any
    }
  }, [goals, hydrated, quickTasks, sessions, tasks]);

  const value = useMemo<ExecutionDataContext>(() => ({
    tasks,
    goals,
    sessions,
    quickTasks,
    addTask: (task) => {
      if (task.isMain && tasks.filter((item) => item.isMain && item.status !== "done").length >= 2) return false;
      const newTask = normalizeTask({
        ...task,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        actualDifficulty: null,
        status: task.status ?? "todo",
      } as TaskRecord);

      setTasks((current) => {
        if (task.isMain && current.filter((item) => item.isMain && item.status !== "done").length >= 2) return current;
        return [...current, newTask];
      });

      // Write to IndexedDB repository + outbox atomically
      repository.saveTask(newTask, true, user?.id).then(() => {
        if (user) syncEngine.triggerSync(user.id);
      }).catch(console.error);

      return true;
    },
    updateTask: (id, patch) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((item) => {
          if (item.id === id) {
            updatedRecord = normalizeTask({ ...item, ...patch, id: item.id, createdAt: item.createdAt });
            return updatedRecord;
          }
          return item;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    recordCompletion: (id, review) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((item) => {
          if (item.id === id) {
            updatedRecord = {
              ...item,
              status: "done",
              actualDifficulty: review.actualDifficulty,
              completionReview: { ...review },
            };
            return updatedRecord;
          }
          return item;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    startExecution: (id) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((item) => {
          if (item.id === id && item.status !== "done") {
            updatedRecord = {
              ...item,
              status: "in_progress",
              executionStartedAt: item.executionStartedAt ?? new Date().toISOString(),
              executionPausedAt: null,
            };
            return updatedRecord;
          }
          return item;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    pauseExecution: (id) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((item) => {
          if (item.id !== id || item.status !== "in_progress" || !item.executionStartedAt) return item;
          const now = Date.now();
          const elapsed = Math.max(0, now - new Date(item.executionStartedAt).getTime());
          updatedRecord = {
            ...item,
            status: "todo",
            executionElapsedMs: (item.executionElapsedMs ?? 0) + elapsed,
            executionStartedAt: null,
            executionPausedAt: new Date(now).toISOString(),
          };
          return updatedRecord;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    resumeExecution: (id) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((item) => {
          if (item.id === id && item.status !== "done") {
            updatedRecord = {
              ...item,
              status: "in_progress",
              executionStartedAt: new Date().toISOString(),
              executionPausedAt: null,
            };
            return updatedRecord;
          }
          return item;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    archiveTask: (id) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((item) => {
          if (item.id === id) {
            updatedRecord = { ...item, status: "done" };
            return updatedRecord;
          }
          return item;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    deleteTask: (id) => {
      setTasks((current) => current.filter((task) => task.id !== id));
      repository.deleteTask(id, user?.id).then(() => {
        if (user) syncEngine.triggerSync(user.id);
      }).catch(console.error);
    },
    startTask: (id) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((task) => {
          if (task.id === id) {
            updatedRecord = { ...task, status: "in_progress", executionStartedAt: new Date().toISOString() };
            return updatedRecord;
          }
          return task;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    completeTask: (id, actualDifficulty) => {
      let updatedRecord: TaskRecord | null = null;
      setTasks((current) =>
        current.map((task) => {
          if (task.id === id) {
            updatedRecord = { ...task, status: "done", actualDifficulty };
            return updatedRecord;
          }
          return task;
        })
      );
      if (updatedRecord) {
        repository.saveTask(updatedRecord, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    addFocusSession: (session) => {
      const fullSession: FocusSession = {
        ...session,
        id: session.id || `session-${Date.now()}`,
      };
      setSessions((current) => (current.some((item) => item.id === fullSession.id) ? current : [...current, fullSession]));
      repository.saveFocusSession(fullSession, user?.id).then(() => {
        if (user) syncEngine.triggerSync(user.id);
      }).catch(console.error);
    },
    addGoal: (goal) => {
      const newGoal: GoalRecord = {
        ...goal,
        id: `goal-${Date.now()}`,
        progress: goal.progress ?? 0,
        progressEntries: goal.progressEntries ?? [],
      };
      setGoals((current) => [...current, newGoal]);
      repository.saveGoal(newGoal, true, user?.id).then(() => {
        if (user) syncEngine.triggerSync(user.id);
      }).catch(console.error);
    },
    updateGoal: (id, patch) => {
      let updatedGoal: GoalRecord | null = null;
      setGoals((current) =>
        current.map((goal) => {
          if (goal.id === id) {
            updatedGoal = { ...goal, ...patch, id: goal.id };
            return updatedGoal;
          }
          return goal;
        })
      );
      if (updatedGoal) {
        repository.saveGoal(updatedGoal, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    deleteGoal: (id) => {
      setGoals((current) => current.filter((goal) => goal.id !== id));
      repository.deleteGoal(id, user?.id).then(() => {
        if (user) syncEngine.triggerSync(user.id);
      }).catch(console.error);
    },
    updateGoalProgress: (id, progress, note = "") => {
      let updatedGoal: GoalRecord | null = null;
      setGoals((current) =>
        current.map((goal) => {
          if (goal.id === id) {
            updatedGoal = {
              ...goal,
              progress,
              progressEntries: [
                ...(goal.progressEntries ?? []),
                { id: `progress-${Date.now()}`, value: progress, note, recordedAt: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            };
            return updatedGoal;
          }
          return goal;
        })
      );
      if (updatedGoal) {
        repository.saveGoal(updatedGoal, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    restoreData: (data, mode) => {
      const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]) => {
        const map = new Map(existing.map((item) => [item.id, item]));
        incoming.forEach((item) => map.set(item.id, item));
        return [...map.values()];
      };
      if (data.tasks) {
        const targetTasks = mode === "replace" ? data.tasks.map(normalizeTask) : mergeById(tasks, data.tasks.map(normalizeTask));
        setTasks(targetTasks);
        targetTasks.forEach((t) => repository.saveTask(t, false, user?.id));
      }
      if (data.goals) {
        const targetGoals = mode === "replace" ? data.goals : mergeById(goals, data.goals);
        setGoals(targetGoals);
        targetGoals.forEach((g) => repository.saveGoal(g, false, user?.id));
      }
      if (data.sessions) {
        const targetSessions = mode === "replace" ? data.sessions : mergeById(sessions, data.sessions);
        setSessions(targetSessions);
        targetSessions.forEach((s) => repository.saveFocusSession(s, user?.id));
      }
      if (data.quickTasks) {
        const targetQuick = mode === "replace" ? data.quickTasks : mergeById(quickTasks, data.quickTasks);
        setQuickTasks(targetQuick);
        targetQuick.forEach((q) => repository.saveQuickTask(q, false, user?.id));
      }
    },
    addQuickTask: (title) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newQuick: QuickTask = {
        id: `quick-${Date.now()}`,
        title: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setQuickTasks((current) => [...current, newQuick]);
      repository.saveQuickTask(newQuick, true, user?.id).then(() => {
        if (user) syncEngine.triggerSync(user.id);
      }).catch(console.error);
    },
    updateQuickTask: (id, title) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      let updated: QuickTask | null = null;
      setQuickTasks((current) =>
        current.map((item) => {
          if (item.id === id) {
            updated = { ...item, title: trimmed };
            return updated;
          }
          return item;
        })
      );
      if (updated) {
        repository.saveQuickTask(updated, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    toggleQuickTask: (id) => {
      let updated: QuickTask | null = null;
      setQuickTasks((current) =>
        current.map((item) => {
          if (item.id === id) {
            updated = { ...item, completed: !item.completed };
            return updated;
          }
          return item;
        })
      );
      if (updated) {
        repository.saveQuickTask(updated, false, user?.id).then(() => {
          if (user) syncEngine.triggerSync(user.id);
        }).catch(console.error);
      }
    },
    deleteQuickTask: (id) => {
      setQuickTasks((current) => current.filter((item) => item.id !== id));
      repository.deleteQuickTask(id, user?.id).then(() => {
        if (user) syncEngine.triggerSync(user.id);
      }).catch(console.error);
    },
  }), [goals, quickTasks, sessions, tasks, user]);

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
