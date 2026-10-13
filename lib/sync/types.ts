export type EntityType = "task" | "goal" | "quick_task" | "focus_session" | "standard";
export type OperationType = "create" | "update" | "delete";
export type OutboxStatus = "pending" | "syncing" | "failed";

export type OutboxItem = {
  id: string; // unique operation UUID
  entityType: EntityType;
  entityId: string;
  operationType: OperationType;
  payload: Record<string, unknown>;
  baseVersion: number;
  userId?: string | null;
  createdAt: string;
  retryCount: number;
  status: OutboxStatus;
  lastError?: string | null;
};

export type SyncMetadata = {
  key: string; // e.g. "task_cursor", "last_sync_time", "user_id"
  value: string;
  updatedAt: string;
};

export type ConflictRecord = {
  id: string;
  entityType: EntityType;
  entityId: string;
  localPayload: Record<string, unknown>;
  remotePayload: Record<string, unknown>;
  conflictedFields: string[];
  resolved: boolean;
  createdAt: string;
};

export type SyncState = "synced" | "syncing" | "offline" | "pending" | "failed" | "conflict";
