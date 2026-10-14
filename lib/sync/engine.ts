import { createClient } from "@/lib/supabase/client";
import { getDatabase, type LocalTaskRecord, type LocalGoalRecord, type LocalQuickTask, type LocalFocusSession, type LocalStandard } from "@/lib/db";
import { repository } from "@/lib/db/repository";
import { resolveEntityConflict } from "./conflict";
import type { OutboxItem, SyncState } from "./types";

type SyncListener = (state: SyncState, error?: string | null) => void;

function mapTaskToSupabase(task: LocalTaskRecord, userId: string) {
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
    version: task.version || 1,
    updated_at: task.updatedAt || new Date().toISOString(),
    deleted_at: task.deletedAt || null,
  };
}

function mapSupabaseToTask(row: Record<string, unknown>): LocalTaskRecord {
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
    outcome: String(row.outcome || ""),
    priority: (row.priority as LocalTaskRecord["priority"]) || "medium",
    predictedDifficulty: Number(row.predicted_difficulty) || 7,
    status: (row.status as LocalTaskRecord["status"]) || "todo",
    scheduledStart: (row.scheduled_start as string) || "",
    scheduledEnd: (row.scheduled_end as string) || "",
    plannedEnd: (row.planned_end as string) || "",
    expectedDuration: Number(row.expected_duration) || 30,
    deadline: (row.deadline as string) || "",
    location: String(row.location || ""),
    alarm: Boolean(row.alarm),
    wish: String(row.wish || ""),
    obstacle: String(row.obstacle || ""),
    notes: String(row.notes || ""),
    resources: String(row.resources || ""),
    weeklyGoal: String(row.weekly_goal || ""),
    monthlyGoal: String(row.monthly_goal || ""),
    executionStartedAt: (row.execution_started_at as string | null) ?? null,
    executionPausedAt: (row.execution_paused_at as string | null) ?? null,
    executionElapsedMs: Number(row.execution_elapsed_ms) || 0,
    actualDifficulty: (row.actual_difficulty as number | null) ?? null,
    completionReview: row.completed_at
      ? {
          actualDifficulty: Number(row.actual_difficulty) || 7,
          actualMinutes: Number(row.actual_minutes) || 0,
          outcome: (row.outcome_achieved as "yes" | "partially" | "no") || "yes",
          reflection: String(row.reflection || ""),
          completedAt: String(row.completed_at),
        }
      : null,
    userId: String(row.user_id),
    version: Number(row.version) || 1,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

export class SyncEngine {
  private listeners = new Set<SyncListener>();
  private isSyncing = false;
  private syncState: SyncState = "synced";
  private lastError: string | null = null;
  private realtimeChannel: unknown = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.triggerSync();
        }
      });
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.syncState, this.lastError);
    return () => this.listeners.delete(listener);
  }

  private notify(state: SyncState, error?: string | null) {
    this.syncState = state;
    this.lastError = error ?? null;
    this.listeners.forEach((l) => l(state, this.lastError));
  }

  private handleNetworkChange(online: boolean) {
    if (!online) {
      this.notify("offline");
    } else {
      this.triggerSync();
    }
  }

  async triggerSync(userId?: string | null): Promise<void> {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) {
      this.notify("offline");
      return;
    }
    if (this.isSyncing) return;

    this.isSyncing = true;
    this.notify("syncing");

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        // Unauthenticated mode or invalid session token: check if local outbox items are waiting
        const pending = await repository.getPendingOutbox(userId);
        this.notify(pending.length > 0 ? "pending" : "synced");
        this.isSyncing = false;
        return;
      }

      const activeUserId = user.id;

      // Step 1: Push Outbox mutations to Supabase for authenticated user
      await this.pushOutbox(activeUserId);

      // Step 2: Pull remote modifications since last cursor
      await this.pullRemoteChanges(activeUserId);

      // Check remaining conflicts or pending outbox items
      const pending = await repository.getPendingOutbox(activeUserId);
      const db = getDatabase();
      const unresolvedConflicts = await db.syncConflicts.where("resolved").equals(0).count();

      if (unresolvedConflicts > 0) {
        this.notify("conflict");
      } else if (pending.length > 0) {
        this.notify("pending");
      } else {
        await repository.setMeta(`last_sync_time_${activeUserId}`, new Date().toISOString());
        this.notify("synced");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.notify("failed", msg);
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushOutbox(userId: string): Promise<void> {
    const supabase = createClient();
    const pending = await repository.getPendingOutbox(userId);
    if (!pending.length) return;

    // Filter out items belonging to another user account
    const validPending = pending.filter((item) => !item.userId || item.userId === userId);
    if (!validPending.length) return;

    const ids = validPending.map((p) => p.id);
    await repository.markOutboxSyncing(ids);

    const completedIds: string[] = [];

    for (const item of validPending) {
      try {
        await this.processOutboxItem(supabase, item, userId);
        completedIds.push(item.id);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await repository.updateOutboxError(item.id, errorMsg);
      }
    }

    if (completedIds.length > 0) {
      await repository.removeOutboxItems(completedIds);
    }
  }

  private async processOutboxItem(
    supabase: ReturnType<typeof createClient>,
    item: OutboxItem,
    userId: string
  ): Promise<void> {
    const db = getDatabase();

    if (item.entityType === "task") {
      if (item.operationType === "delete") {
        await supabase
          .from("tasks")
          .update({ deleted_at: new Date().toISOString(), version: item.baseVersion + 1 })
          .eq("id", item.entityId)
          .eq("user_id", userId);
      } else {
        const local = await db.tasks.get(item.entityId);
        if (!local) return;
        const payload = mapTaskToSupabase(local, userId);

        const { error } = await supabase.from("tasks").upsert(payload);
        if (error) throw error;
      }
    } else if (item.entityType === "goal") {
      if (item.operationType === "delete") {
        await supabase
          .from("goals")
          .update({ deleted_at: new Date().toISOString(), version: item.baseVersion + 1 })
          .eq("id", item.entityId)
          .eq("user_id", userId);
      } else {
        const local = await db.goals.get(item.entityId);
        if (!local) return;
        const payload = {
          id: local.id,
          user_id: userId,
          title: local.title,
          type: local.type,
          target: local.target,
          progress: local.progress,
          progress_mode: local.progressMode ?? "numeric",
          progress_entries: local.progressEntries ?? [],
          version: local.version,
          updated_at: local.updatedAt,
          deleted_at: local.deletedAt ?? null,
        };
        const { error } = await supabase.from("goals").upsert(payload);
        if (error) throw error;
      }
    } else if (item.entityType === "quick_task") {
      if (item.operationType === "delete") {
        await supabase
          .from("quick_tasks")
          .update({ deleted_at: new Date().toISOString(), version: item.baseVersion + 1 })
          .eq("id", item.entityId)
          .eq("user_id", userId);
      } else {
        const local = await db.quickTasks.get(item.entityId);
        if (!local) return;
        const payload = {
          id: local.id,
          user_id: userId,
          title: local.title,
          completed: local.completed,
          version: local.version,
          updated_at: local.updatedAt,
          deleted_at: local.deletedAt ?? null,
        };
        const { error } = await supabase.from("quick_tasks").upsert(payload);
        if (error) throw error;
      }
    } else if (item.entityType === "focus_session") {
      const local = await db.focusSessions.get(item.entityId);
      if (!local) return;
      const payload = {
        id: local.id,
        user_id: userId,
        task_id: local.taskId || null,
        task_title: local.taskTitle,
        started_at: local.startedAt,
        ended_at: local.endedAt,
        duration_minutes: local.durationMinutes,
        status: local.status || "completed",
        version: local.version,
        updated_at: local.updatedAt,
      };
      const { error } = await supabase.from("focus_sessions").upsert(payload);
      if (error) throw error;
    } else if (item.entityType === "standard") {
      const local = await db.standards.get(item.entityId);
      if (!local) return;
      const payload = {
        id: local.id,
        user_id: userId,
        practice: local.practice,
        sort_order: local.sortOrder,
        version: local.version,
        updated_at: local.updatedAt,
        deleted_at: local.deletedAt ?? null,
      };
      const { error } = await supabase.from("standards").upsert(payload);
      if (error) throw error;
    }
  }

  private async pullRemoteChanges(userId: string): Promise<void> {
    const supabase = createClient();
    const db = getDatabase();
    const cursor = (await repository.getMeta(`cursor_${userId}`)) || "1970-01-01T00:00:00Z";

    // 1. Pull Tasks
    const { data: remoteTasks, error: taskErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", cursor)
      .order("updated_at", { ascending: true });

    if (!taskErr && remoteTasks) {
      for (const row of remoteTasks) {
        const remoteParsed = mapSupabaseToTask(row as Record<string, unknown>);
        const local = await db.tasks.get(remoteParsed.id);

        if (!local) {
          await db.tasks.put(remoteParsed);
        } else if (remoteParsed.version > local.version) {
          // Automatic 3-way conflict merge check
          const { mergedRecord } = await resolveEntityConflict(
            "task",
            remoteParsed.id,
            local as unknown as Record<string, unknown>,
            remoteParsed as unknown as Record<string, unknown>
          );
          await db.tasks.put(mergedRecord as unknown as LocalTaskRecord);
        }
      }
    }

    // 2. Pull Goals
    const { data: remoteGoals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", cursor);

    if (remoteGoals) {
      for (const row of remoteGoals) {
        const goalData: LocalGoalRecord = {
          id: row.id,
          title: row.title,
          type: row.type,
          target: row.target,
          progress: Number(row.progress) || 0,
          progressMode: row.progress_mode || "numeric",
          progressEntries: row.progress_entries || [],
          userId: row.user_id,
          version: Number(row.version) || 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        };
        const local = await db.goals.get(goalData.id);
        if (!local || goalData.version > local.version) {
          await db.goals.put(goalData);
        }
      }
    }

    // 3. Pull Quick Tasks
    const { data: remoteQuick } = await supabase
      .from("quick_tasks")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", cursor);

    if (remoteQuick) {
      for (const row of remoteQuick) {
        const quickData: LocalQuickTask = {
          id: row.id,
          title: row.title,
          completed: row.completed,
          userId: row.user_id,
          version: Number(row.version) || 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        };
        const local = await db.quickTasks.get(quickData.id);
        if (!local || quickData.version > local.version) {
          await db.quickTasks.put(quickData);
        }
      }
    }

    // 4. Pull Focus Sessions
    const { data: remoteSessions } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", cursor);

    if (remoteSessions) {
      for (const row of remoteSessions) {
        const sessionData: LocalFocusSession = {
          id: row.id,
          taskId: row.task_id,
          taskTitle: row.task_title,
          startedAt: row.started_at,
          endedAt: row.ended_at,
          durationMinutes: row.duration_minutes,
          status: row.status as "completed" | "interrupted",
          userId: row.user_id,
          version: Number(row.version) || 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        await db.focusSessions.put(sessionData);
      }
    }

    // 5. Pull Standards
    const { data: remoteStandards } = await supabase
      .from("standards")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", cursor);

    if (remoteStandards) {
      for (const row of remoteStandards) {
        const standardData: LocalStandard = {
          id: row.id,
          practice: row.practice,
          sortOrder: row.sort_order,
          userId: row.user_id,
          version: Number(row.version) || 1,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          deletedAt: row.deleted_at,
        };
        const local = await db.standards.get(standardData.id);
        if (!local || standardData.version > local.version) {
          await db.standards.put(standardData);
        }
      }
    }

    // Advance user synchronization cursor
    await repository.setMeta(`cursor_${userId}`, new Date().toISOString());
  }
}

export const syncEngine = new SyncEngine();
