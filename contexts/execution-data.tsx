"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth";
import { getTodayDateString, generateUpcomingOccurrenceDates } from "@/lib/date-utils";
import type {
  MasterTask,
  TaskOccurrence,
  FiveMinuteTask,
  RecurrenceRule,
  CalendarEvent,
  FocusSession,
  PersonalObservation,
  JournalEntry,
  Goal,
  Standard,
  UserPreferences,
  DailySection,
} from "@/types/execution-os";

type ExecutionDataContext = {
  masterTasks: MasterTask[];
  occurrences: TaskOccurrence[];
  recurrenceRules: RecurrenceRule[];
  fiveMinuteTasks: FiveMinuteTask[];
  events: CalendarEvent[];
  focusSessions: FocusSession[];
  goals: Goal[];
  standards: Standard[];
  observations: PersonalObservation[];
  journalEntries: JournalEntry[];
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;

  createMasterTask: (
    payload: Partial<MasterTask>,
    recurrenceRule?: Omit<RecurrenceRule, "id" | "userId" | "createdAt" | "updatedAt"> | null
  ) => Promise<MasterTask | null>;
  updateMasterTask: (
    id: string,
    payload: Partial<MasterTask>,
    mode?: "single" | "future" | "series",
    targetOccurrenceDate?: string
  ) => Promise<void>;
  deleteMasterTask: (
    id: string,
    mode?: "single" | "future" | "series",
    targetOccurrenceDate?: string
  ) => Promise<void>;

  scheduleTaskToDate: (taskId: string, date: string, section?: DailySection) => Promise<void>;
  updateOccurrence: (occurrenceId: string, payload: Partial<TaskOccurrence>) => Promise<void>;
  completeOccurrence: (occurrenceId: string, actualDifficulty: number, completionNotes?: string) => Promise<void>;
  deleteOccurrence: (occurrenceId: string) => Promise<void>;

  addFiveMinuteTask: (title: string, date?: string) => Promise<void>;
  toggleFiveMinuteTask: (id: string) => Promise<void>;
  deleteFiveMinuteTask: (id: string) => Promise<void>;

  createEvent: (payload: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (id: string, payload: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  recordFocusSession: (payload: Omit<FocusSession, "id" | "userId" | "createdAt">) => Promise<void>;

  createGoal: (payload: Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, payload: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  createStandard: (payload: Partial<Standard>) => Promise<void>;
  updateStandard: (id: string, payload: Partial<Standard>) => Promise<void>;
  deleteStandard: (id: string) => Promise<void>;

  createObservation: (payload: Partial<PersonalObservation>) => Promise<void>;
  updateObservation: (id: string, payload: Partial<PersonalObservation>) => Promise<void>;
  deleteObservation: (id: string) => Promise<void>;

  createJournalEntry: (payload: Partial<JournalEntry>) => Promise<void>;
  updateJournalEntry: (id: string, payload: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  updatePreferences: (payload: Partial<UserPreferences>) => Promise<void>;
};

const ExecutionDataContext = createContext<ExecutionDataContext | null>(null);

export function ExecutionDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [masterTasks, setMasterTasks] = useState<MasterTask[]>([]);
  const [occurrences, setOccurrences] = useState<TaskOccurrence[]>([]);
  const [recurrenceRules, setRecurrenceRules] = useState<RecurrenceRule[]>([]);
  const [fiveMinuteTasks, setFiveMinuteTasks] = useState<FiveMinuteTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [observations, setObservations] = useState<PersonalObservation[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) {
        if (isMounted) {
          setMasterTasks([]);
          setOccurrences([]);
          setFiveMinuteTasks([]);
          setEvents([]);
          setFocusSessions([]);
          setGoals([]);
          setStandards([]);
          setObservations([]);
          setJournalEntries([]);
          setPreferences(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      const supabase = createClient();

      try {
        const [
          { data: tasksData },
          { data: occData },
          { data: rulesData },
          { data: fiveMinData },
          { data: eventsData },
          { data: focusData },
          { data: goalsData },
          { data: standardsData },
          { data: obsData },
          { data: journalData },
          { data: prefsData },
        ] = await Promise.all([
          supabase.from("tasks").select("*").eq("user_id", user.id).is("deleted_at", null),
          supabase.from("task_occurrences").select("*").eq("user_id", user.id),
          supabase.from("recurrence_rules").select("*").eq("user_id", user.id),
          supabase.from("five_minute_tasks").select("*").eq("user_id", user.id),
          supabase.from("calendar_events").select("*").eq("user_id", user.id),
          supabase.from("focus_sessions").select("*").eq("user_id", user.id),
          supabase.from("goals").select("*").eq("user_id", user.id).is("deleted_at", null),
          supabase.from("standards").select("*").eq("user_id", user.id),
          supabase.from("personal_observations").select("*").eq("user_id", user.id),
          supabase.from("journal_entries").select("*").eq("user_id", user.id),
          supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        ]);

        if (!isMounted) return;

        const mappedRules: RecurrenceRule[] = (rulesData || []).map((r) => ({
          id: r.id,
          userId: r.user_id,
          frequency: r.frequency,
          weekdays: r.weekdays || [],
          monthDay: r.month_day,
          intervalDays: r.interval_days || 1,
          startDate: r.start_date,
          endDate: r.end_date,
          isActive: r.is_active,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));

        const mappedTasks: MasterTask[] = (tasksData || []).map((t) => ({
          id: t.id,
          userId: t.user_id,
          title: t.title,
          expectedOutcome: t.expected_outcome,
          firstAction: t.first_action,
          priority: t.priority,
          predictedDifficulty: t.predicted_difficulty,
          expectedDuration: t.expected_duration,
          scheduledDate: t.scheduled_date,
          scheduledTime: t.scheduled_time,
          deadline: t.deadline,
          hasAlarm: t.has_alarm,
          alarmTime: t.alarm_time,
          alarmSetConfirmed: t.alarm_set_confirmed,
          description: t.description,
          notes: t.notes,
          goalId: t.goal_id,
          progress: t.progress,
          wish: t.wish,
          outcome: t.outcome,
          obstacle: t.obstacle,
          plan: t.plan,
          status: t.status,
          recurrenceId: t.recurrence_id,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          completedAt: t.completed_at,
          deletedAt: t.deleted_at,
        }));

        const mappedOcc: TaskOccurrence[] = (occData || []).map((o) => ({
          id: o.id,
          userId: o.user_id,
          taskId: o.task_id,
          scheduledDate: o.scheduled_date,
          dailySection: o.daily_section,
          dailySortOrder: o.daily_sort_order,
          status: o.status,
          progress: o.progress,
          actualDifficulty: o.actual_difficulty,
          actualMinutes: o.actual_minutes,
          completedAt: o.completed_at,
          completionNotes: o.completion_notes,
          nextActionScheduledFor: o.next_action_scheduled_for,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        }));

        const mappedFiveMin: FiveMinuteTask[] = (fiveMinData || []).map((f) => ({
          id: f.id,
          userId: f.user_id,
          title: f.title,
          date: f.date,
          targetTime: f.target_time,
          completed: f.completed,
          sortOrder: f.sort_order,
          createdAt: f.created_at,
          updatedAt: f.updated_at,
        }));

        const mappedEvents: CalendarEvent[] = (eventsData || []).map((e) => ({
          id: e.id,
          userId: e.user_id,
          title: e.title,
          date: e.date,
          startTime: e.start_time,
          endTime: e.end_time,
          location: e.location,
          description: e.description,
          reminderMinutesBefore: e.reminder_minutes_before,
          hasAlarm: e.has_alarm,
          alarmSetConfirmed: e.alarm_set_confirmed,
          recurrence: e.recurrence,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        }));

        const mappedFocus: FocusSession[] = (focusData || []).map((f) => ({
          id: f.id,
          userId: f.user_id,
          taskId: f.task_id,
          occurrenceId: f.occurrence_id,
          taskTitle: f.task_title,
          workGrade: f.work_grade,
          intendedDuration: f.intended_duration,
          actualDuration: f.actual_duration,
          startedAt: f.started_at,
          endedAt: f.ended_at,
          status: f.status,
          actualDifficulty: f.actual_difficulty,
          interruptionReason: f.interruption_reason,
          reflection: f.reflection,
          createdAt: f.created_at,
        }));

        const mappedGoals: Goal[] = (goalsData || []).map((g) => ({
          id: g.id,
          userId: g.user_id,
          title: g.title,
          desiredOutcome: g.desired_outcome,
          measurementMethod: g.measurement_method,
          targetValue: g.target_value,
          currentProgress: g.current_progress,
          startDate: g.start_date,
          deadline: g.deadline,
          whyItMatters: g.why_it_matters,
          nextSteps: g.next_steps,
          status: g.status,
          createdAt: g.created_at,
          updatedAt: g.updated_at,
          deletedAt: g.deleted_at,
        }));

        const mappedStandards: Standard[] = (standardsData || []).map((s) => ({
          id: s.id,
          userId: s.user_id,
          name: s.name,
          rule: s.rule,
          whyItExists: s.why_it_exists,
          practicalImplementation: s.practical_implementation,
          whenItApplies: s.when_it_applies,
          status: s.status,
          sortOrder: s.sort_order,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));

        const mappedObs: PersonalObservation[] = (obsData || []).map((o) => ({
          id: o.id,
          userId: o.user_id,
          type: o.type,
          title: o.title,
          points: o.points,
          category: o.category,
          status: o.status,
          date: o.date,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        }));

        const mappedJournal: JournalEntry[] = (journalData || []).map((j) => ({
          id: j.id,
          userId: j.user_id,
          category: j.category,
          subcategoryId: j.subcategory_id,
          title: j.title,
          points: j.points,
          isPinned: j.is_pinned,
          quoteSource: j.quote_source,
          context: j.context,
          problemTriggers: j.problem_triggers,
          problemWhatHelped: j.problem_what_helped,
          problemCurrentApproach: j.problem_current_approach,
          visualizationFuture: j.visualization_future,
          visualizationNextStep: j.visualization_next_step,
          entryDate: j.entry_date,
          createdAt: j.created_at,
          updatedAt: j.updated_at,
        }));

        const mappedPrefs: UserPreferences = prefsData ? {
          userId: prefsData.user_id,
          timezone: prefsData.timezone,
          currentWorkGrade: prefsData.current_work_grade,
          breakDurationMinutes: prefsData.break_duration_minutes,
          alarmSoundEnabled: prefsData.alarm_sound_enabled,
          dailyMainLimit: prefsData.daily_main_limit,
        } : {
          userId: user.id,
          timezone: "UTC",
          currentWorkGrade: 1,
          breakDurationMinutes: 5,
          alarmSoundEnabled: true,
          dailyMainLimit: 2,
        };

        setMasterTasks(mappedTasks);
        setOccurrences(mappedOcc);
        setRecurrenceRules(mappedRules);
        setFiveMinuteTasks(mappedFiveMin);
        setEvents(mappedEvents);
        setFocusSessions(mappedFocus);
        setGoals(mappedGoals);
        setStandards(mappedStandards);
        setObservations(mappedObs);
        setJournalEntries(mappedJournal);
        setPreferences(mappedPrefs);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const value = useMemo<ExecutionDataContext>(() => ({
    masterTasks,
    occurrences,
    recurrenceRules,
    fiveMinuteTasks,
    events,
    focusSessions,
    goals,
    standards,
    observations,
    journalEntries,
    preferences,
    loading,
    error,

    createMasterTask: async (payload, recurrenceRule) => {
      if (!user) return null;
      const supabase = createClient();

      let createdRecurrenceId: string | null = null;
      let newRecurrenceObj: RecurrenceRule | null = null;

      if (recurrenceRule) {
        const ruleInsert = {
          user_id: user.id,
          frequency: recurrenceRule.frequency,
          weekdays: recurrenceRule.weekdays || [],
          month_day: recurrenceRule.monthDay || null,
          interval_days: recurrenceRule.intervalDays || 1,
          start_date: recurrenceRule.startDate,
          end_date: recurrenceRule.endDate || null,
          is_active: recurrenceRule.isActive ?? true,
        };
        const { data: ruleData, error: ruleErr } = await supabase
          .from("recurrence_rules")
          .insert(ruleInsert)
          .select()
          .single();

        if (!ruleErr && ruleData) {
          createdRecurrenceId = ruleData.id;
          newRecurrenceObj = {
            id: ruleData.id,
            userId: ruleData.user_id,
            frequency: ruleData.frequency,
            weekdays: ruleData.weekdays || [],
            monthDay: ruleData.month_day,
            intervalDays: ruleData.interval_days || 1,
            startDate: ruleData.start_date,
            endDate: ruleData.end_date,
            isActive: ruleData.is_active,
            createdAt: ruleData.created_at,
            updatedAt: ruleData.updated_at,
          };
          setRecurrenceRules((prev) => [newRecurrenceObj!, ...prev]);
        }
      }

      const insertObj = {
        user_id: user.id,
        title: payload.title || "Untitled Task",
        expected_outcome: payload.expectedOutcome || "",
        first_action: payload.firstAction || "",
        priority: payload.priority || "medium",
        predicted_difficulty: payload.predictedDifficulty ?? 5,
        expected_duration: payload.expectedDuration ?? 30,
        scheduled_date: payload.scheduledDate || null,
        scheduled_time: payload.scheduledTime || null,
        deadline: payload.deadline || null,
        has_alarm: payload.hasAlarm ?? false,
        alarm_time: payload.alarmTime || null,
        alarm_set_confirmed: payload.alarmSetConfirmed ?? false,
        description: payload.description || "",
        notes: payload.notes || "",
        goal_id: payload.goalId || null,
        progress: payload.progress ?? 0,
        wish: payload.wish || "",
        outcome: payload.outcome || "",
        obstacle: payload.obstacle || "",
        plan: payload.plan || "",
        status: payload.status || "todo",
        recurrence_id: createdRecurrenceId || payload.recurrenceId || null,
      };

      const { data, error } = await supabase.from("tasks").insert(insertObj).select().single();
      if (error) {
        console.error("Error creating master task:", error);
        return null;
      }

      const newTask: MasterTask = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        expectedOutcome: data.expected_outcome,
        firstAction: data.first_action,
        priority: data.priority,
        predictedDifficulty: data.predicted_difficulty,
        expectedDuration: data.expected_duration,
        scheduledDate: data.scheduled_date,
        scheduledTime: data.scheduled_time,
        deadline: data.deadline,
        hasAlarm: data.has_alarm,
        alarmTime: data.alarm_time,
        alarmSetConfirmed: data.alarm_set_confirmed,
        description: data.description,
        notes: data.notes,
        goalId: data.goal_id,
        progress: data.progress,
        wish: data.wish,
        outcome: data.outcome,
        obstacle: data.obstacle,
        plan: data.plan,
        status: data.status,
        recurrenceId: data.recurrence_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
        deletedAt: data.deleted_at,
      };

      setMasterTasks((prev) => [newTask, ...prev]);

      // If this is a recurring task, generate the rolling 60-day occurrences
      if (newRecurrenceObj) {
        const dates = generateUpcomingOccurrenceDates(newRecurrenceObj, getTodayDateString(), 60);
        if (dates.length > 0) {
          const occInserts = dates.map((date) => ({
            user_id: user.id,
            task_id: newTask.id,
            scheduled_date: date,
            daily_section: "supporting",
            status: "todo",
          }));

          const { data: generatedOccs } = await supabase
            .from("task_occurrences")
            .upsert(occInserts, { onConflict: "user_id,task_id,scheduled_date" })
            .select();

          if (generatedOccs && generatedOccs.length > 0) {
            const mappedGenerated: TaskOccurrence[] = generatedOccs.map((o) => ({
              id: o.id,
              userId: o.user_id,
              taskId: o.task_id,
              scheduledDate: o.scheduled_date,
              dailySection: o.daily_section,
              dailySortOrder: o.daily_sort_order,
              status: o.status,
              progress: o.progress,
              actualDifficulty: o.actual_difficulty,
              actualMinutes: o.actual_minutes,
              completedAt: o.completed_at,
              completionNotes: o.completion_notes,
              nextActionScheduledFor: o.next_action_scheduled_for,
              createdAt: o.created_at,
              updatedAt: o.updated_at,
            }));

            setOccurrences((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const fresh = mappedGenerated.filter((m) => !existingIds.has(m.id));
              return [...prev, ...fresh];
            });
          }
        }
      } else if (newTask.scheduledDate) {
        // Non-recurring scheduled task occurrence
        await supabase.from("task_occurrences").upsert({
          user_id: user.id,
          task_id: newTask.id,
          scheduled_date: newTask.scheduledDate,
          daily_section: "supporting",
          status: "todo",
        }, { onConflict: "user_id,task_id,scheduled_date" });

        const { data: occData } = await supabase
          .from("task_occurrences")
          .select("*")
          .eq("task_id", newTask.id)
          .eq("scheduled_date", newTask.scheduledDate)
          .single();

        if (occData) {
          setOccurrences((prev) => [...prev, {
            id: occData.id,
            userId: occData.user_id,
            taskId: occData.task_id,
            scheduledDate: occData.scheduled_date,
            dailySection: occData.daily_section,
            dailySortOrder: occData.daily_sort_order,
            status: occData.status,
            progress: occData.progress,
            actualDifficulty: occData.actual_difficulty,
            actualMinutes: occData.actual_minutes,
            completedAt: occData.completed_at,
            completionNotes: occData.completion_notes,
            nextActionScheduledFor: occData.next_action_scheduled_for,
            createdAt: occData.created_at,
            updatedAt: occData.updated_at,
          }]);
        }
      }

      return newTask;
    },

    updateMasterTask: async (id, payload, mode = "series", targetOccurrenceDate) => {
      if (!user) return;
      const supabase = createClient();

      if (mode === "single" && targetOccurrenceDate) {
        // Update only this specific occurrence
        const targetOcc = occurrences.find((o) => o.taskId === id && o.scheduledDate === targetOccurrenceDate);
        if (targetOcc) {
          // If task attributes like title/priority changed, create an independent detached task
          const original = masterTasks.find((t) => t.id === id);
          if (original) {
            const { data: standaloneTask } = await supabase.from("tasks").insert({
              user_id: user.id,
              title: payload.title || original.title,
              expected_outcome: payload.expectedOutcome ?? original.expectedOutcome,
              first_action: payload.firstAction ?? original.firstAction,
              priority: payload.priority ?? original.priority,
              predicted_difficulty: payload.predictedDifficulty ?? original.predictedDifficulty,
              expected_duration: payload.expectedDuration ?? original.expectedDuration,
              scheduled_date: targetOccurrenceDate,
              scheduled_time: payload.scheduledTime ?? original.scheduledTime,
              deadline: payload.deadline ?? original.deadline,
              description: payload.description ?? original.description,
              notes: payload.notes ?? original.notes,
              goal_id: payload.goalId ?? original.goalId,
              status: payload.status ?? targetOcc.status,
            }).select().single();

            if (standaloneTask) {
              await supabase.from("task_occurrences").update({ task_id: standaloneTask.id }).eq("id", targetOcc.id);
              setOccurrences((prev) => prev.map((o) => (o.id === targetOcc.id ? { ...o, taskId: standaloneTask.id } : o)));
              setMasterTasks((prev) => [standaloneTask, ...prev]);
              return;
            }
          }
        }
      } else if (mode === "future" && targetOccurrenceDate) {
        // End the current recurrence rule before targetOccurrenceDate
        const task = masterTasks.find((t) => t.id === id);
        if (task?.recurrenceId) {
          await supabase.from("recurrence_rules").update({ end_date: targetOccurrenceDate, is_active: false }).eq("id", task.recurrenceId);
          // Delete uncompleted occurrences on or after targetOccurrenceDate
          await supabase.from("task_occurrences").delete().eq("task_id", id).gte("scheduled_date", targetOccurrenceDate).neq("status", "done");
          setOccurrences((prev) => prev.filter((o) => !(o.taskId === id && o.scheduledDate >= targetOccurrenceDate && o.status !== "done")));
        }
      }

      // Default series update
      const updateObj: Record<string, unknown> = {};
      if (payload.title !== undefined) updateObj.title = payload.title;
      if (payload.expectedOutcome !== undefined) updateObj.expected_outcome = payload.expectedOutcome;
      if (payload.firstAction !== undefined) updateObj.first_action = payload.firstAction;
      if (payload.priority !== undefined) updateObj.priority = payload.priority;
      if (payload.predictedDifficulty !== undefined) updateObj.predicted_difficulty = payload.predictedDifficulty;
      if (payload.expectedDuration !== undefined) updateObj.expected_duration = payload.expectedDuration;
      if (payload.scheduledDate !== undefined) updateObj.scheduled_date = payload.scheduledDate;
      if (payload.scheduledTime !== undefined) updateObj.scheduled_time = payload.scheduledTime;
      if (payload.deadline !== undefined) updateObj.deadline = payload.deadline;
      if (payload.hasAlarm !== undefined) updateObj.has_alarm = payload.hasAlarm;
      if (payload.alarmTime !== undefined) updateObj.alarm_time = payload.alarmTime;
      if (payload.alarmSetConfirmed !== undefined) updateObj.alarm_set_confirmed = payload.alarmSetConfirmed;
      if (payload.description !== undefined) updateObj.description = payload.description;
      if (payload.notes !== undefined) updateObj.notes = payload.notes;
      if (payload.goalId !== undefined) updateObj.goal_id = payload.goalId;
      if (payload.progress !== undefined) updateObj.progress = payload.progress;
      if (payload.wish !== undefined) updateObj.wish = payload.wish;
      if (payload.outcome !== undefined) updateObj.outcome = payload.outcome;
      if (payload.obstacle !== undefined) updateObj.obstacle = payload.obstacle;
      if (payload.plan !== undefined) updateObj.plan = payload.plan;
      if (payload.status !== undefined) updateObj.status = payload.status;
      if (payload.completedAt !== undefined) updateObj.completed_at = payload.completedAt;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("tasks").update(updateObj).eq("id", id).eq("user_id", user.id);
      setMasterTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...payload, updatedAt: new Date().toISOString() } : t)));
    },

    deleteMasterTask: async (id, mode = "series", targetOccurrenceDate) => {
      if (!user) return;
      const supabase = createClient();

      if (mode === "single" && targetOccurrenceDate) {
        // Delete only the single occurrence for target date
        await supabase.from("task_occurrences").delete().eq("task_id", id).eq("scheduled_date", targetOccurrenceDate);
        setOccurrences((prev) => prev.filter((o) => !(o.taskId === id && o.scheduledDate === targetOccurrenceDate)));
        return;
      }

      if (mode === "future" && targetOccurrenceDate) {
        // Delete occurrences from target date onward while preserving past/completed
        const task = masterTasks.find((t) => t.id === id);
        if (task?.recurrenceId) {
          await supabase.from("recurrence_rules").update({ end_date: targetOccurrenceDate, is_active: false }).eq("id", task.recurrenceId);
        }
        await supabase.from("task_occurrences").delete().eq("task_id", id).gte("scheduled_date", targetOccurrenceDate);
        setOccurrences((prev) => prev.filter((o) => !(o.taskId === id && o.scheduledDate >= targetOccurrenceDate)));
        return;
      }

      // Entire series deletion
      const task = masterTasks.find((t) => t.id === id);
      if (task?.recurrenceId) {
        await supabase.from("recurrence_rules").delete().eq("id", task.recurrenceId);
        setRecurrenceRules((prev) => prev.filter((r) => r.id !== task.recurrenceId));
      }
      await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
      setMasterTasks((prev) => prev.filter((t) => t.id !== id));
      setOccurrences((prev) => prev.filter((o) => o.taskId !== id));
    },

    scheduleTaskToDate: async (taskId, date, section = "supporting") => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("task_occurrences").upsert({
        user_id: user.id,
        task_id: taskId,
        scheduled_date: date,
        daily_section: section,
        status: "todo",
      }, { onConflict: "user_id,task_id,scheduled_date" });

      const { data } = await supabase.from("task_occurrences").select("*").eq("user_id", user.id).eq("task_id", taskId).eq("scheduled_date", date).single();
      if (data) {
        setOccurrences((prev) => {
          const exists = prev.some((o) => o.id === data.id);
          if (exists) {
            return prev.map((o) => (o.id === data.id ? { ...o, dailySection: section } : o));
          }
          return [...prev, {
            id: data.id,
            userId: data.user_id,
            taskId: data.task_id,
            scheduledDate: data.scheduled_date,
            dailySection: data.daily_section,
            dailySortOrder: data.daily_sort_order,
            status: data.status,
            progress: data.progress,
            actualDifficulty: data.actual_difficulty,
            actualMinutes: data.actual_minutes,
            completedAt: data.completed_at,
            completionNotes: data.completion_notes,
            nextActionScheduledFor: data.next_action_scheduled_for,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }];
        });
      }
    },

    updateOccurrence: async (occurrenceId, payload) => {
      if (!user) return;
      const supabase = createClient();
      const updateObj: Record<string, unknown> = {};
      if (payload.dailySection !== undefined) updateObj.daily_section = payload.dailySection;
      if (payload.status !== undefined) updateObj.status = payload.status;
      if (payload.progress !== undefined) updateObj.progress = payload.progress;
      if (payload.actualDifficulty !== undefined) updateObj.actual_difficulty = payload.actualDifficulty;
      if (payload.actualMinutes !== undefined) updateObj.actual_minutes = payload.actualMinutes;
      if (payload.completedAt !== undefined) updateObj.completed_at = payload.completedAt;
      if (payload.completionNotes !== undefined) updateObj.completion_notes = payload.completionNotes;
      if (payload.nextActionScheduledFor !== undefined) updateObj.next_action_scheduled_for = payload.nextActionScheduledFor;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("task_occurrences").update(updateObj).eq("id", occurrenceId).eq("user_id", user.id);
      setOccurrences((prev) => prev.map((o) => (o.id === occurrenceId ? { ...o, ...payload, updatedAt: new Date().toISOString() } : o)));
    },

    completeOccurrence: async (occurrenceId, actualDifficulty, completionNotes = "") => {
      if (!user) return;
      const nowIso = new Date().toISOString();
      const supabase = createClient();
      await supabase.from("task_occurrences").update({
        status: "done",
        progress: 100,
        actual_difficulty: actualDifficulty,
        completed_at: nowIso,
        completion_notes: completionNotes,
        updated_at: nowIso,
      }).eq("id", occurrenceId).eq("user_id", user.id);

      setOccurrences((prev) => prev.map((o) => (o.id === occurrenceId ? {
        ...o,
        status: "done",
        progress: 100,
        actualDifficulty,
        completedAt: nowIso,
        completionNotes,
        updatedAt: nowIso,
      } : o)));
    },

    deleteOccurrence: async (occurrenceId) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("task_occurrences").delete().eq("id", occurrenceId).eq("user_id", user.id);
      setOccurrences((prev) => prev.filter((o) => o.id !== occurrenceId));
    },

    addFiveMinuteTask: async (title, date = getTodayDateString()) => {
      if (!user || !title.trim()) return;
      const supabase = createClient();
      const { data, error } = await supabase.from("five_minute_tasks").insert({
        user_id: user.id,
        title: title.trim(),
        date,
        completed: false,
      }).select().single();

      if (!error && data) {
        setFiveMinuteTasks((prev) => [...prev, {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          date: data.date,
          targetTime: data.target_time,
          completed: data.completed,
          sortOrder: data.sort_order,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }]);
      }
    },

    toggleFiveMinuteTask: async (id) => {
      if (!user) return;
      const item = fiveMinuteTasks.find((f) => f.id === id);
      if (!item) return;
      const nextCompleted = !item.completed;
      const supabase = createClient();
      await supabase.from("five_minute_tasks").update({ completed: nextCompleted, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
      setFiveMinuteTasks((prev) => prev.map((f) => (f.id === id ? { ...f, completed: nextCompleted } : f)));
    },

    deleteFiveMinuteTask: async (id) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("five_minute_tasks").delete().eq("id", id).eq("user_id", user.id);
      setFiveMinuteTasks((prev) => prev.filter((f) => f.id !== id));
    },

    createEvent: async (payload) => {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase.from("calendar_events").insert({
        user_id: user.id,
        title: payload.title || "Event",
        date: payload.date || getTodayDateString(),
        start_time: payload.startTime || "09:00",
        end_time: payload.endTime || null,
        location: payload.location || "",
        description: payload.description || "",
        reminder_minutes_before: payload.reminderMinutesBefore ?? 15,
        has_alarm: payload.hasAlarm ?? false,
        alarm_set_confirmed: payload.alarmSetConfirmed ?? false,
        recurrence: payload.recurrence || "none",
      }).select().single();

      if (!error && data) {
        setEvents((prev) => [...prev, {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          date: data.date,
          startTime: data.start_time,
          endTime: data.end_time,
          location: data.location,
          description: data.description,
          reminderMinutesBefore: data.reminder_minutes_before,
          hasAlarm: data.has_alarm,
          alarmSetConfirmed: data.alarm_set_confirmed,
          recurrence: data.recurrence,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }]);
      }
    },

    updateEvent: async (id, payload) => {
      if (!user) return;
      const supabase = createClient();
      const updateObj: Record<string, unknown> = {};
      if (payload.title !== undefined) updateObj.title = payload.title;
      if (payload.date !== undefined) updateObj.date = payload.date;
      if (payload.startTime !== undefined) updateObj.start_time = payload.startTime;
      if (payload.endTime !== undefined) updateObj.end_time = payload.endTime;
      if (payload.location !== undefined) updateObj.location = payload.location;
      if (payload.description !== undefined) updateObj.description = payload.description;
      if (payload.hasAlarm !== undefined) updateObj.has_alarm = payload.hasAlarm;
      if (payload.alarmSetConfirmed !== undefined) updateObj.alarm_set_confirmed = payload.alarmSetConfirmed;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("calendar_events").update(updateObj).eq("id", id).eq("user_id", user.id);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...payload } : e)));
    },

    deleteEvent: async (id) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("calendar_events").delete().eq("id", id).eq("user_id", user.id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },

    recordFocusSession: async (payload) => {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase.from("focus_sessions").insert({
        user_id: user.id,
        task_id: payload.taskId || null,
        occurrence_id: payload.occurrenceId || null,
        task_title: payload.taskTitle || "Focus Session",
        work_grade: payload.workGrade ?? 1,
        intended_duration: payload.intendedDuration ?? 25,
        actual_duration: payload.actualDuration ?? 0,
        started_at: payload.startedAt,
        ended_at: payload.endedAt,
        status: payload.status || "completed",
        actual_difficulty: payload.actualDifficulty || null,
        interruption_reason: payload.interruptionReason || "",
        reflection: payload.reflection || "",
      }).select().single();

      if (!error && data) {
        setFocusSessions((prev) => [{
          id: data.id,
          userId: data.user_id,
          taskId: data.task_id,
          occurrenceId: data.occurrence_id,
          taskTitle: data.task_title,
          workGrade: data.work_grade,
          intendedDuration: data.intended_duration,
          actualDuration: data.actual_duration,
          startedAt: data.started_at,
          endedAt: data.ended_at,
          status: data.status,
          actualDifficulty: data.actual_difficulty,
          interruptionReason: data.interruption_reason,
          reflection: data.reflection,
          createdAt: data.created_at,
        }, ...prev]);
      }
    },

    createGoal: async (payload) => {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase.from("goals").insert({
        user_id: user.id,
        title: payload.title || "Goal",
        desired_outcome: payload.desiredOutcome || "",
        measurement_method: payload.measurementMethod || "numeric",
        target_value: payload.targetValue || "",
        current_progress: payload.currentProgress ?? 0,
        start_date: payload.startDate || null,
        deadline: payload.deadline || null,
        why_it_matters: payload.whyItMatters || "",
        next_steps: payload.nextSteps || "",
        status: payload.status || "active",
      }).select().single();

      if (!error && data) {
        setGoals((prev) => [{
          id: data.id,
          userId: data.user_id,
          title: data.title,
          desiredOutcome: data.desired_outcome,
          measurementMethod: data.measurement_method,
          targetValue: data.target_value,
          currentProgress: data.current_progress,
          startDate: data.start_date,
          deadline: data.deadline,
          whyItMatters: data.why_it_matters,
          nextSteps: data.next_steps,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          deletedAt: data.deleted_at,
        }, ...prev]);
      }
    },

    updateGoal: async (id, payload) => {
      if (!user) return;
      const supabase = createClient();
      const updateObj: Record<string, unknown> = {};
      if (payload.title !== undefined) updateObj.title = payload.title;
      if (payload.desiredOutcome !== undefined) updateObj.desired_outcome = payload.desiredOutcome;
      if (payload.measurementMethod !== undefined) updateObj.measurement_method = payload.measurementMethod;
      if (payload.targetValue !== undefined) updateObj.target_value = payload.targetValue;
      if (payload.currentProgress !== undefined) updateObj.current_progress = payload.currentProgress;
      if (payload.startDate !== undefined) updateObj.start_date = payload.startDate;
      if (payload.deadline !== undefined) updateObj.deadline = payload.deadline;
      if (payload.whyItMatters !== undefined) updateObj.why_it_matters = payload.whyItMatters;
      if (payload.nextSteps !== undefined) updateObj.next_steps = payload.nextSteps;
      if (payload.status !== undefined) updateObj.status = payload.status;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("goals").update(updateObj).eq("id", id).eq("user_id", user.id);
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...payload } : g)));
    },

    deleteGoal: async (id) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("goals").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    },

    createStandard: async (payload) => {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase.from("standards").insert({
        user_id: user.id,
        name: payload.name || "Standard",
        rule: payload.rule || "",
        why_it_exists: payload.whyItExists || "",
        practical_implementation: payload.practicalImplementation || "",
        when_it_applies: payload.whenItApplies || "",
        status: payload.status || "active",
        sort_order: payload.sortOrder ?? 0,
      }).select().single();

      if (!error && data) {
        setStandards((prev) => [...prev, {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          rule: data.rule,
          whyItExists: data.why_it_exists,
          practicalImplementation: data.practical_implementation,
          whenItApplies: data.when_it_applies,
          status: data.status,
          sortOrder: data.sort_order,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }]);
      }
    },

    updateStandard: async (id, payload) => {
      if (!user) return;
      const supabase = createClient();
      const updateObj: Record<string, unknown> = {};
      if (payload.name !== undefined) updateObj.name = payload.name;
      if (payload.rule !== undefined) updateObj.rule = payload.rule;
      if (payload.whyItExists !== undefined) updateObj.why_it_exists = payload.whyItExists;
      if (payload.practicalImplementation !== undefined) updateObj.practical_implementation = payload.practicalImplementation;
      if (payload.whenItApplies !== undefined) updateObj.when_it_applies = payload.whenItApplies;
      if (payload.status !== undefined) updateObj.status = payload.status;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("standards").update(updateObj).eq("id", id).eq("user_id", user.id);
      setStandards((prev) => prev.map((s) => (s.id === id ? { ...s, ...payload } : s)));
    },

    deleteStandard: async (id) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("standards").delete().eq("id", id).eq("user_id", user.id);
      setStandards((prev) => prev.filter((s) => s.id !== id));
    },

    createObservation: async (payload) => {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase.from("personal_observations").insert({
        user_id: user.id,
        type: payload.type || "what_works",
        title: payload.title || "Observation",
        points: payload.points || [],
        category: payload.category || "general",
        status: payload.status || "active",
        date: payload.date || getTodayDateString(),
      }).select().single();

      if (!error && data) {
        setObservations((prev) => [{
          id: data.id,
          userId: data.user_id,
          type: data.type,
          title: data.title,
          points: data.points,
          category: data.category,
          status: data.status,
          date: data.date,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }, ...prev]);
      }
    },

    updateObservation: async (id, payload) => {
      if (!user) return;
      const supabase = createClient();
      const updateObj: Record<string, unknown> = {};
      if (payload.title !== undefined) updateObj.title = payload.title;
      if (payload.points !== undefined) updateObj.points = payload.points;
      if (payload.category !== undefined) updateObj.category = payload.category;
      if (payload.status !== undefined) updateObj.status = payload.status;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("personal_observations").update(updateObj).eq("id", id).eq("user_id", user.id);
      setObservations((prev) => prev.map((o) => (o.id === id ? { ...o, ...payload } : o)));
    },

    deleteObservation: async (id) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("personal_observations").delete().eq("id", id).eq("user_id", user.id);
      setObservations((prev) => prev.filter((o) => o.id !== id));
    },

    createJournalEntry: async (payload) => {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        category: payload.category || "learnings",
        subcategory_id: payload.subcategoryId || null,
        title: payload.title || "Entry",
        points: payload.points || [],
        is_pinned: payload.isPinned ?? false,
        quote_source: payload.quoteSource || null,
        context: payload.context || null,
        problem_triggers: payload.problemTriggers || null,
        problem_what_helped: payload.problemWhatHelped || null,
        problem_current_approach: payload.problemCurrentApproach || null,
        visualization_future: payload.visualizationFuture || null,
        visualization_next_step: payload.visualizationNextStep || null,
        entry_date: payload.entryDate || getTodayDateString(),
      }).select().single();

      if (!error && data) {
        setJournalEntries((prev) => [{
          id: data.id,
          userId: data.user_id,
          category: data.category,
          subcategoryId: data.subcategory_id,
          title: data.title,
          points: data.points,
          isPinned: data.is_pinned,
          quoteSource: data.quote_source,
          context: data.context,
          problemTriggers: data.problem_triggers,
          problemWhatHelped: data.problem_what_helped,
          problemCurrentApproach: data.problem_current_approach,
          visualizationFuture: data.visualization_future,
          visualizationNextStep: data.visualization_next_step,
          entryDate: data.entry_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }, ...prev]);
      }
    },

    updateJournalEntry: async (id, payload) => {
      if (!user) return;
      const supabase = createClient();
      const updateObj: Record<string, unknown> = {};
      if (payload.title !== undefined) updateObj.title = payload.title;
      if (payload.points !== undefined) updateObj.points = payload.points;
      if (payload.isPinned !== undefined) updateObj.is_pinned = payload.isPinned;
      if (payload.quoteSource !== undefined) updateObj.quote_source = payload.quoteSource;
      if (payload.context !== undefined) updateObj.context = payload.context;
      if (payload.problemTriggers !== undefined) updateObj.problem_triggers = payload.problemTriggers;
      if (payload.problemWhatHelped !== undefined) updateObj.problem_what_helped = payload.problemWhatHelped;
      if (payload.problemCurrentApproach !== undefined) updateObj.problem_current_approach = payload.problemCurrentApproach;
      if (payload.visualizationFuture !== undefined) updateObj.visualization_future = payload.visualizationFuture;
      if (payload.visualizationNextStep !== undefined) updateObj.visualization_next_step = payload.visualizationNextStep;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("journal_entries").update(updateObj).eq("id", id).eq("user_id", user.id);
      setJournalEntries((prev) => prev.map((j) => (j.id === id ? { ...j, ...payload } : j)));
    },

    deleteJournalEntry: async (id) => {
      if (!user) return;
      const supabase = createClient();
      await supabase.from("journal_entries").delete().eq("id", id).eq("user_id", user.id);
      setJournalEntries((prev) => prev.filter((j) => j.id !== id));
    },

    updatePreferences: async (payload) => {
      if (!user) return;
      const supabase = createClient();
      const updateObj: Record<string, unknown> = {};
      if (payload.timezone !== undefined) updateObj.timezone = payload.timezone;
      if (payload.currentWorkGrade !== undefined) updateObj.current_work_grade = payload.currentWorkGrade;
      if (payload.breakDurationMinutes !== undefined) updateObj.break_duration_minutes = payload.breakDurationMinutes;
      if (payload.alarmSoundEnabled !== undefined) updateObj.alarm_sound_enabled = payload.alarmSoundEnabled;
      if (payload.dailyMainLimit !== undefined) updateObj.daily_main_limit = payload.dailyMainLimit;
      updateObj.updated_at = new Date().toISOString();

      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        timezone: payload.timezone ?? preferences?.timezone ?? "UTC",
        current_work_grade: payload.currentWorkGrade ?? preferences?.currentWorkGrade ?? 1,
        break_duration_minutes: payload.breakDurationMinutes ?? preferences?.breakDurationMinutes ?? 5,
        alarm_sound_enabled: payload.alarmSoundEnabled ?? preferences?.alarmSoundEnabled ?? true,
        daily_main_limit: payload.dailyMainLimit ?? preferences?.dailyMainLimit ?? 2,
        ...updateObj,
      });

      setPreferences((prev) => (prev ? { ...prev, ...payload } : null));
    },
  }), [masterTasks, occurrences, recurrenceRules, fiveMinuteTasks, events, focusSessions, goals, standards, observations, journalEntries, preferences, loading, error, user]);

  return <ExecutionDataContext.Provider value={value}>{children}</ExecutionDataContext.Provider>;
}

export function useExecutionData() {
  const context = useContext(ExecutionDataContext);
  if (!context) {
    throw new Error("useExecutionData must be used within an ExecutionDataProvider");
  }
  return context;
}
