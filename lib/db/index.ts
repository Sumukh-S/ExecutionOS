import Dexie, { type Table } from "dexie";
import type { TaskRecord, GoalRecord, QuickTask, FocusSession } from "@/contexts/execution-data";
import type { OutboxItem, SyncMetadata, ConflictRecord } from "@/lib/sync/types";

export type LocalStandard = {
  id: string;
  practice: string;
  sortOrder: number;
  userId?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type LocalTaskRecord = TaskRecord & {
  userId?: string | null;
  version: number;
  updatedAt: string;
  deletedAt?: string | null;
};

export type LocalGoalRecord = GoalRecord & {
  userId?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type LocalQuickTask = QuickTask & {
  userId?: string | null;
  version: number;
  updatedAt: string;
  deletedAt?: string | null;
};

export type LocalFocusSession = FocusSession & {
  userId?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export class ExecutionOSDatabase extends Dexie {
  tasks!: Table<LocalTaskRecord, string>;
  goals!: Table<LocalGoalRecord, string>;
  quickTasks!: Table<LocalQuickTask, string>;
  focusSessions!: Table<LocalFocusSession, string>;
  standards!: Table<LocalStandard, string>;
  syncOutbox!: Table<OutboxItem, string>;
  syncMeta!: Table<SyncMetadata, string>;
  syncConflicts!: Table<ConflictRecord, string>;

  constructor() {
    super("execution_os_db");

    this.version(1).stores({
      tasks: "id, userId, isMain, parentId, status, priority, scheduledStart, deadline, updatedAt, deletedAt",
      goals: "id, userId, type, updatedAt, deletedAt",
      quickTasks: "id, userId, completed, updatedAt, deletedAt",
      focusSessions: "id, userId, taskId, startedAt, updatedAt, deletedAt",
      standards: "id, userId, sortOrder, updatedAt, deletedAt",
      syncOutbox: "id, entityType, entityId, operationType, status, createdAt",
      syncMeta: "key",
      syncConflicts: "id, entityType, entityId, resolved, createdAt",
    });
  }
}

let dbInstance: ExecutionOSDatabase | null = null;

export function getDatabase(): ExecutionOSDatabase {
  if (typeof window === "undefined") {
    // Return instance for SSR safety if imported, though operations occur client-side
    return new ExecutionOSDatabase();
  }
  if (!dbInstance) {
    dbInstance = new ExecutionOSDatabase();
  }
  return dbInstance;
}
