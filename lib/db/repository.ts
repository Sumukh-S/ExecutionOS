import { getDatabase, type LocalTaskRecord, type LocalGoalRecord, type LocalQuickTask, type LocalFocusSession, type LocalStandard } from "./index";
import type { TaskRecord, GoalRecord, QuickTask, FocusSession } from "@/contexts/execution-data";
import type { EntityType, OperationType, OutboxItem } from "@/lib/sync/types";

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

export class Repository {
  private db = getDatabase();

  private createOutboxItem(
    entityType: EntityType,
    entityId: string,
    operationType: OperationType,
    payload: Record<string, unknown>,
    baseVersion: number,
    userId?: string | null
  ): OutboxItem {
    return {
      id: generateUUID(),
      entityType,
      entityId,
      operationType,
      payload,
      baseVersion,
      userId,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: "pending",
    };
  }

  // ==========================================
  // TASKS
  // ==========================================
  async getAllTasks(userId?: string | null): Promise<TaskRecord[]> {
    const all = await this.db.tasks.toArray();
    return all
      .filter((t) => !t.deletedAt && (!userId || !t.userId || t.userId === userId))
      .map(({ userId: _u, version: _v, updatedAt: _up, deletedAt: _d, ...task }) => task as TaskRecord);
  }

  async saveTask(task: TaskRecord, isNew = false, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.tasks, this.db.syncOutbox, async () => {
      const existing = await this.db.tasks.get(task.id);
      const version = existing ? existing.version + 1 : 1;
      const localRecord: LocalTaskRecord = {
        ...task,
        userId: userId ?? existing?.userId ?? null,
        version,
        updatedAt: now,
        deletedAt: null,
      };

      await this.db.tasks.put(localRecord);

      const outbox = this.createOutboxItem(
        "task",
        task.id,
        isNew || !existing ? "create" : "update",
        localRecord as unknown as Record<string, unknown>,
        existing?.version ?? 0,
        userId
      );
      await this.db.syncOutbox.put(outbox);
    });
  }

  async deleteTask(id: string, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.tasks, this.db.syncOutbox, async () => {
      const existing = await this.db.tasks.get(id);
      if (!existing) return;

      const tombstone: LocalTaskRecord = {
        ...existing,
        version: existing.version + 1,
        updatedAt: now,
        deletedAt: now,
      };
      await this.db.tasks.put(tombstone);

      const outbox = this.createOutboxItem(
        "task",
        id,
        "delete",
        { id, deletedAt: now },
        existing.version,
        userId
      );
      await this.db.syncOutbox.put(outbox);
    });
  }

  // ==========================================
  // GOALS
  // ==========================================
  async getAllGoals(userId?: string | null): Promise<GoalRecord[]> {
    const all = await this.db.goals.toArray();
    return all
      .filter((g) => !g.deletedAt && (!userId || !g.userId || g.userId === userId))
      .map(({ userId: _u, version: _v, updatedAt: _up, deletedAt: _d, ...goal }) => goal as GoalRecord);
  }

  async deleteGoal(id: string, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.goals, this.db.syncOutbox, async () => {
      const existing = await this.db.goals.get(id);
      if (!existing) return;

      const tombstone: LocalGoalRecord = {
        ...existing,
        version: existing.version + 1,
        updatedAt: now,
        deletedAt: now,
      };
      await this.db.goals.put(tombstone);

      const outbox = this.createOutboxItem(
        "goal",
        id,
        "delete",
        { id, deletedAt: now },
        existing.version,
        userId
      );
      await this.db.syncOutbox.put(outbox);
    });
  }

  async saveGoal(goal: GoalRecord, isNew = false, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.goals, this.db.syncOutbox, async () => {
      const existing = await this.db.goals.get(goal.id);
      const version = existing ? existing.version + 1 : 1;
      const localRecord: LocalGoalRecord = {
        ...goal,
        userId: userId ?? existing?.userId ?? null,
        version,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        deletedAt: null,
      };

      await this.db.goals.put(localRecord);

      const outbox = this.createOutboxItem(
        "goal",
        goal.id,
        isNew || !existing ? "create" : "update",
        localRecord as unknown as Record<string, unknown>,
        existing?.version ?? 0,
        userId
      );
      await this.db.syncOutbox.put(outbox);
    });
  }

  // ==========================================
  // QUICK TASKS
  // ==========================================
  async getAllQuickTasks(userId?: string | null): Promise<QuickTask[]> {
    const all = await this.db.quickTasks.toArray();
    return all
      .filter((q) => !q.deletedAt && (!userId || !q.userId || q.userId === userId))
      .map(({ userId: _u, version: _v, updatedAt: _up, deletedAt: _d, ...quick }) => quick as QuickTask);
  }

  async saveQuickTask(quick: QuickTask, isNew = false, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.quickTasks, this.db.syncOutbox, async () => {
      const existing = await this.db.quickTasks.get(quick.id);
      const version = existing ? existing.version + 1 : 1;
      const localRecord: LocalQuickTask = {
        ...quick,
        userId: userId ?? existing?.userId ?? null,
        version,
        updatedAt: now,
        deletedAt: null,
      };

      await this.db.quickTasks.put(localRecord);

      const outbox = this.createOutboxItem(
        "quick_task",
        quick.id,
        isNew || !existing ? "create" : "update",
        localRecord as unknown as Record<string, unknown>,
        existing?.version ?? 0,
        userId
      );
      await this.db.syncOutbox.put(outbox);
    });
  }

  async deleteQuickTask(id: string, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.quickTasks, this.db.syncOutbox, async () => {
      const existing = await this.db.quickTasks.get(id);
      if (!existing) return;

      const tombstone: LocalQuickTask = {
        ...existing,
        version: existing.version + 1,
        updatedAt: now,
        deletedAt: now,
      };
      await this.db.quickTasks.put(tombstone);

      const outbox = this.createOutboxItem(
        "quick_task",
        id,
        "delete",
        { id, deletedAt: now },
        existing.version,
        userId
      );
      await this.db.syncOutbox.put(outbox);
    });
  }

  // ==========================================
  // FOCUS SESSIONS
  // ==========================================
  async getAllFocusSessions(userId?: string | null): Promise<FocusSession[]> {
    const all = await this.db.focusSessions.toArray();
    return all
      .filter((s) => !s.deletedAt && (!userId || !s.userId || s.userId === userId))
      .map(({ userId: _u, version: _v, updatedAt: _up, deletedAt: _d, ...session }) => session as FocusSession);
  }

  async saveFocusSession(session: FocusSession, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.focusSessions, this.db.syncOutbox, async () => {
      const existing = await this.db.focusSessions.get(session.id);
      if (existing) return; // Append-only deduplication

      const localRecord: LocalFocusSession = {
        ...session,
        userId: userId ?? null,
        version: 1,
        createdAt: session.startedAt || now,
        updatedAt: now,
        deletedAt: null,
      };

      await this.db.focusSessions.put(localRecord);

      const outbox = this.createOutboxItem(
        "focus_session",
        session.id,
        "create",
        localRecord as unknown as Record<string, unknown>,
        0,
        userId
      );
      await this.db.syncOutbox.put(outbox);
    });
  }

  // ==========================================
  // STANDARDS
  // ==========================================
  async getAllStandards(userId?: string | null): Promise<LocalStandard[]> {
    const all = await this.db.standards.toArray();
    return all.filter((s) => !s.deletedAt && (!userId || !s.userId || s.userId === userId));
  }

  async saveStandardsBatch(standards: Array<{ id: string; practice: string }>, userId?: string | null): Promise<void> {
    const now = new Date().toISOString();
    await this.db.transaction("rw", this.db.standards, this.db.syncOutbox, async () => {
      for (let i = 0; i < standards.length; i++) {
        const item = standards[i];
        const existing = await this.db.standards.get(item.id);
        const version = existing ? existing.version + 1 : 1;
        const localRecord: LocalStandard = {
          id: item.id,
          practice: item.practice,
          sortOrder: i,
          userId: userId ?? existing?.userId ?? null,
          version,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          deletedAt: null,
        };
        await this.db.standards.put(localRecord);

        const outbox = this.createOutboxItem(
          "standard",
          item.id,
          existing ? "update" : "create",
          localRecord as unknown as Record<string, unknown>,
          existing?.version ?? 0,
          userId
        );
        await this.db.syncOutbox.put(outbox);
      }
    });
  }

  // ==========================================
  // OUTBOX OPERATIONS
  // ==========================================
  async getPendingOutbox(): Promise<OutboxItem[]> {
    return this.db.syncOutbox.where("status").equals("pending").sortBy("createdAt");
  }

  async markOutboxSyncing(ids: string[]): Promise<void> {
    await this.db.syncOutbox.where("id").anyOf(ids).modify({ status: "syncing" });
  }

  async removeOutboxItems(ids: string[]): Promise<void> {
    await this.db.syncOutbox.bulkDelete(ids);
  }

  async updateOutboxError(id: string, error: string): Promise<void> {
    const item = await this.db.syncOutbox.get(id);
    if (!item) return;
    await this.db.syncOutbox.update(id, {
      status: "pending",
      retryCount: item.retryCount + 1,
      lastError: error,
    });
  }

  // ==========================================
  // SYNC METADATA & CURSORS
  // ==========================================
  async getMeta(key: string): Promise<string | null> {
    const item = await this.db.syncMeta.get(key);
    return item ? item.value : null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.db.syncMeta.put({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const repository = new Repository();
