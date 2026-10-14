"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
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
  loading: boolean;
  error: string | null;
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
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [quickTasks, setQuickTasks] = useState<QuickTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      if (!user) {
        if (isMounted) {
          setTasks([]);
          setGoals([]);
          setSessions([]);
          setQuickTasks([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      const supabase = createClient();

      try {
        const { data: remoteTasks, error: taskErr } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null);
        if (taskErr) throw taskErr;

        const { data: remoteGoals, error: goalErr } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null);
        if (goalErr) throw goalErr;

        const { data: remoteQuick, error: quickErr } = await supabase
          .from("quick_tasks")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null);
        if (quickErr) throw quickErr;

        const { data: remoteSessions, error: sessionErr } = await supabase
          .from("focus_sessions")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null);
        if (sessionErr) throw sessionErr;

        if (!isMounted) return;

        if ((!remoteTasks || remoteTasks.length === 0) && (!remoteGoals || remoteGoals.length === 0)) {
          const initialTasks = getSeedTasks();
          const initialGoals = getSeedGoals();
          const initialQuick = getSeedQuickTasks();

          await supabase.from("tasks").upsert(initialTasks.map((t) => ({ ...mapTaskToSupabase(t, user.id) })));
          await supabase.from("goals").upsert(initialGoals.map((g) => ({ ...mapGoalToSupabase(g, user.id) })));
          await supabase.from("quick_tasks").upsert(initialQuick.map((q) => ({ ...mapQuickToSupabase(q, user.id) })));

          setTasks(initialTasks);
          setGoals(initialGoals);
          setQuickTasks(initialQuick);
          setSessions([]);
        } else {
          setTasks((remoteTasks || []).map((row) => normalizeTask(mapSupabaseToTask(row))));
          setGoals((remoteGoals || []).map((row) => mapSupabaseToGoal(row)));
          setQuickTasks((remoteQuick || []).map((row) => mapSupabaseToQuick(row)));
          setSessions((remoteSessions || []).map((row) => mapSupabaseToSession(row)));
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  function mapTaskToSupabase(task: TaskRecord, userId: string) {
    return {
      id: task.id,
      user_id: userId,
      is_main: task.isMain ?? false,
      parent_id: task.parentId ?? null,
      title: task.title,
      icon: task.icon || "✅",
      list_name: task.listName || "Personal",
      description: task.description || "",
      scope: task.scope || "",
      first_action: task.firstAction || "",
      outcome: task.outcome || "",
      priority: task.priority || "medium",
      predicted_difficulty: task.predictedDifficulty || 7,
      status: task.status || "todo",
      scheduled_start: task.scheduledStart || null,
      scheduled_end: task.scheduledEnd || null,
      planned_end: task.plannedEnd || null,
      expected_duration: task.expectedDuration || 30,
      deadline: task.deadline || null,
      location: task.location || "",
      alarm: task.alarm ?? false,
      wish: task.wish || "",
      obstacle: task.obstacle || "",
      notes: task.notes || "",
      resources: task.resources || "",
      weekly_goal: task.weeklyGoal || "",
      monthly_goal: task.monthlyGoal || "",
      execution_started_at: task.executionStartedAt || null,
      execution_paused_at: task.executionPausedAt || null,
      execution_elapsed_ms: task.executionElapsedMs || 0,
      actual_difficulty: task.actualDifficulty || task.completionReview?.actualDifficulty || null,
      actual_minutes: task.completionReview?.actualMinutes || null,
      outcome_achieved: task.completionReview?.outcome || null,
      reflection: task.completionReview?.reflection || null,
      completed_at: task.completionReview?.completedAt || null,
      updated_at: new Date().toISOString(),
    };
  }

  function mapSupabaseToTask(row: Record<string, unknown>): TaskRecord {
    return {
      id: String(row.id),
      isMain: Boolean(row.is_main),
      parentId: (row.parent_id as string | null) ?? null,
      title: String(row.title || ""),
      icon: String(row.icon || "✅"),
      listName: String(row.list_name || "Personal"),
      description: String(row.description || ""),
      scope: String(row.scope || ""),
      firstAction: String(row.first_action || ""),
      priority: (row.priority as TaskRecord["priority"]) || "medium",
      status: (row.status as TaskRecord["status"]) || "todo",
      scheduledStart: (row.scheduled_start as string) || "",
      scheduledEnd: (row.scheduled_end as string) || "",
      plannedEnd: (row.planned_end as string) || "",
      expectedDuration: Number(row.expected_duration) || 30,
      deadline: (row.deadline as string) || "",
      location: String(row.location || ""),
      alarm: Boolean(row.alarm),
      notes: String(row.notes || ""),
      resources: String(row.resources || ""),
      predictedDifficulty: Number(row.predicted_difficulty) || 7,
      actualDifficulty: (row.actual_difficulty as number | null) ?? null,
      wish: String(row.wish || ""),
      outcome: String(row.outcome || ""),
      obstacle: String(row.obstacle || ""),
      weeklyGoal: String(row.weekly_goal || ""),
      monthlyGoal: String(row.monthly_goal || ""),
      createdAt: String(row.created_at || new Date().toISOString()),
      executionStartedAt: (row.execution_started_at as string | null) ?? null,
      executionPausedAt: (row.execution_paused_at as string | null) ?? null,
      executionElapsedMs: Number(row.execution_elapsed_ms) || 0,
      completionReview: row.completed_at
        ? {
            actualDifficulty: Number(row.actual_difficulty) || 7,
            actualMinutes: Number(row.actual_minutes) || 0,
            outcome: (row.outcome_achieved as "yes" | "partially" | "no") || "yes",
            reflection: String(row.reflection || ""),
            completedAt: String(row.completed_at),
          }
        : null,
    };
  }

  function mapGoalToSupabase(goal: GoalRecord, userId: string) {
    return {
      id: goal.id,
      user_id: userId,
      title: goal.title,
      type: goal.type,
      target: goal.target,
      progress: goal.progress,
      progress_mode: goal.progressMode ?? "numeric",
      progress_entries: goal.progressEntries ?? [],
      updated_at: new Date().toISOString(),
    };
  }

  function mapSupabaseToGoal(row: Record<string, unknown>): GoalRecord {
    return {
      id: String(row.id),
      title: String(row.title || ""),
      type: (row.type as GoalRecord["type"]) || "weekly",
      target: String(row.target || ""),
      progress: Number(row.progress) || 0,
      progressMode: (row.progress_mode as GoalRecord["progressMode"]) || "numeric",
      progressEntries: (row.progress_entries as GoalProgressEntry[]) || [],
      updatedAt: String(row.updated_at || new Date().toISOString()),
    };
  }

  function mapQuickToSupabase(quick: QuickTask, userId: string) {
    return {
      id: quick.id,
      user_id: userId,
      title: quick.title,
      completed: quick.completed,
      updated_at: new Date().toISOString(),
    };
  }

  function mapSupabaseToQuick(row: Record<string, unknown>): QuickTask {
    return {
      id: String(row.id),
      title: String(row.title || ""),
      completed: Boolean(row.completed),
      createdAt: String(row.created_at || new Date().toISOString()),
    };
  }

  function mapSupabaseToSession(row: Record<string, unknown>): FocusSession {
    return {
      id: String(row.id),
      taskId: String(row.task_id || ""),
      taskTitle: String(row.task_title || ""),
      startedAt: String(row.started_at || ""),
      endedAt: String(row.ended_at || ""),
      durationMinutes: Number(row.duration_minutes) || 0,
      status: (row.status as FocusSession["status"]) || "completed",
    };
  }

  const value = useMemo<ExecutionDataContext>(() => ({
    tasks,
    goals,
    sessions,
    quickTasks,
    loading,
    error,
    addTask: (task) => {
      if (!user) return false;
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

      const supabase = createClient();
      supabase.from("tasks").upsert(mapTaskToSupabase(newTask, user.id)).then(({ error }) => {
        if (error) console.error("Error adding task to Supabase:", error);
      });

      return true;
    },
    updateTask: (id, patch) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error updating task in Supabase:", error);
        });
      }
    },
    recordCompletion: (id, review) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error recording task completion in Supabase:", error);
        });
      }
    },
    startExecution: (id) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error starting execution in Supabase:", error);
        });
      }
    },
    pauseExecution: (id) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error pausing execution in Supabase:", error);
        });
      }
    },
    resumeExecution: (id) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error resuming execution in Supabase:", error);
        });
      }
    },
    archiveTask: (id) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error archiving task in Supabase:", error);
        });
      }
    },
    deleteTask: (id) => {
      if (!user) return;
      setTasks((current) => current.filter((task) => task.id !== id));
      const supabase = createClient();
      supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).then(({ error }) => {
        if (error) console.error("Error deleting task in Supabase:", error);
      });
    },
    startTask: (id) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error starting task in Supabase:", error);
        });
      }
    },
    completeTask: (id, actualDifficulty) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("tasks").upsert(mapTaskToSupabase(updatedRecord, user.id)).then(({ error }) => {
          if (error) console.error("Error completing task in Supabase:", error);
        });
      }
    },
    addFocusSession: (session) => {
      if (!user) return;
      const fullSession: FocusSession = {
        ...session,
        id: session.id || `session-${Date.now()}`,
      };
      setSessions((current) => (current.some((item) => item.id === fullSession.id) ? current : [...current, fullSession]));
      const supabase = createClient();
      supabase.from("focus_sessions").upsert({
        id: fullSession.id,
        user_id: user.id,
        task_id: fullSession.taskId || null,
        task_title: fullSession.taskTitle,
        started_at: fullSession.startedAt,
        ended_at: fullSession.endedAt,
        duration_minutes: fullSession.durationMinutes,
        status: fullSession.status || "completed",
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.error("Error adding focus session in Supabase:", error);
      });
    },
    addGoal: (goal) => {
      if (!user) return;
      const newGoal: GoalRecord = {
        ...goal,
        id: `goal-${Date.now()}`,
        progress: goal.progress ?? 0,
        progressEntries: goal.progressEntries ?? [],
      };
      setGoals((current) => [...current, newGoal]);
      const supabase = createClient();
      supabase.from("goals").upsert(mapGoalToSupabase(newGoal, user.id)).then(({ error }) => {
        if (error) console.error("Error adding goal in Supabase:", error);
      });
    },
    updateGoal: (id, patch) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("goals").upsert(mapGoalToSupabase(updatedGoal, user.id)).then(({ error }) => {
          if (error) console.error("Error updating goal in Supabase:", error);
        });
      }
    },
    deleteGoal: (id) => {
      if (!user) return;
      setGoals((current) => current.filter((goal) => goal.id !== id));
      const supabase = createClient();
      supabase.from("goals").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).then(({ error }) => {
        if (error) console.error("Error deleting goal in Supabase:", error);
      });
    },
    updateGoalProgress: (id, progress, note = "") => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("goals").upsert(mapGoalToSupabase(updatedGoal, user.id)).then(({ error }) => {
          if (error) console.error("Error updating goal progress in Supabase:", error);
        });
      }
    },
    restoreData: (data, mode) => {
      if (!user) return;
      const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]) => {
        const map = new Map(existing.map((item) => [item.id, item]));
        incoming.forEach((item) => map.set(item.id, item));
        return [...map.values()];
      };
      const supabase = createClient();
      if (data.tasks) {
        const targetTasks = mode === "replace" ? data.tasks.map(normalizeTask) : mergeById(tasks, data.tasks.map(normalizeTask));
        setTasks(targetTasks);
        targetTasks.forEach((t) => supabase.from("tasks").upsert(mapTaskToSupabase(t, user.id)));
      }
      if (data.goals) {
        const targetGoals = mode === "replace" ? data.goals : mergeById(goals, data.goals);
        setGoals(targetGoals);
        targetGoals.forEach((g) => supabase.from("goals").upsert(mapGoalToSupabase(g, user.id)));
      }
      if (data.sessions) {
        const targetSessions = mode === "replace" ? data.sessions : mergeById(sessions, data.sessions);
        setSessions(targetSessions);
      }
      if (data.quickTasks) {
        const targetQuick = mode === "replace" ? data.quickTasks : mergeById(quickTasks, data.quickTasks);
        setQuickTasks(targetQuick);
        targetQuick.forEach((q) => supabase.from("quick_tasks").upsert(mapQuickToSupabase(q, user.id)));
      }
    },
    addQuickTask: (title) => {
      if (!user) return;
      const trimmed = title.trim();
      if (!trimmed) return;
      const newQuick: QuickTask = {
        id: `quick-${Date.now()}`,
        title: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setQuickTasks((current) => [...current, newQuick]);
      const supabase = createClient();
      supabase.from("quick_tasks").upsert(mapQuickToSupabase(newQuick, user.id)).then(({ error }) => {
        if (error) console.error("Error adding quick task in Supabase:", error);
      });
    },
    updateQuickTask: (id, title) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("quick_tasks").upsert(mapQuickToSupabase(updated, user.id)).then(({ error }) => {
          if (error) console.error("Error updating quick task in Supabase:", error);
        });
      }
    },
    toggleQuickTask: (id) => {
      if (!user) return;
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
        const supabase = createClient();
        supabase.from("quick_tasks").upsert(mapQuickToSupabase(updated, user.id)).then(({ error }) => {
          if (error) console.error("Error toggling quick task in Supabase:", error);
        });
      }
    },
    deleteQuickTask: (id) => {
      if (!user) return;
      setQuickTasks((current) => current.filter((item) => item.id !== id));
      const supabase = createClient();
      supabase.from("quick_tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).then(({ error }) => {
        if (error) console.error("Error deleting quick task in Supabase:", error);
      });
    },
  }), [goals, quickTasks, sessions, tasks, user, loading, error]);

  return <ExecutionDataContext.Provider value={value}>{children}</ExecutionDataContext.Provider>;
}

export function useExecutionData() {
  const context = useContext(ExecutionDataContext);
  if (!context) {
    throw new Error("useExecutionData must be used within an ExecutionDataProvider");
  }
  return context;
}

export function getTaskQuadrant(task: TaskRecord): "q1" | "q2" | "q3" | "q4" {
  const isUrgent = task.priority === "urgent" || task.priority === "high" || (task.deadline ? new Date(task.deadline).getTime() - Date.now() < 48 * 3600 * 1000 : false);
  const isImportant = task.predictedDifficulty >= 6 || task.priority === "high" || task.priority === "urgent";

  if (isUrgent && isImportant) return "q1";
  if (!isUrgent && isImportant) return "q2";
  if (isUrgent && !isImportant) return "q3";
  return "q4";
}
