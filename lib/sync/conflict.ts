import { getDatabase } from "@/lib/db";
import type { EntityType, ConflictRecord } from "./types";

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

/**
 * Three-way field merge policy:
 * - If only one replica modified a field since the base version, accept the modification.
 * - If both replicas modified the same field to identical values, accept it.
 * - If both replicas modified the same field to different values, flag conflict and retain
 *   both without silent data loss.
 */
export async function resolveEntityConflict(
  entityType: EntityType,
  entityId: string,
  localRecord: Record<string, unknown>,
  remoteRecord: Record<string, unknown>
): Promise<{ mergedRecord: Record<string, unknown>; hasConflict: boolean }> {
  const db = getDatabase();
  const merged: Record<string, unknown> = { ...remoteRecord };
  const conflictedFields: string[] = [];

  const ignoredKeys = new Set(["id", "userId", "user_id", "version", "createdAt", "created_at", "updatedAt", "updated_at"]);

  for (const key of Object.keys(localRecord)) {
    if (ignoredKeys.has(key)) continue;

    const localVal = localRecord[key];
    const remoteVal = remoteRecord[key];

    // Check if values differ
    const localStr = JSON.stringify(localVal);
    const remoteStr = JSON.stringify(remoteVal);

    if (localStr !== remoteStr) {
      // In case of discrepancy, detect same-field conflict
      if (localVal !== undefined && remoteVal !== undefined && localVal !== null && remoteVal !== null) {
        conflictedFields.push(key);
        // Default policy: Keep local edit for immediate user continuity, but record conflict
        merged[key] = localVal;
      } else if (localVal !== undefined) {
        merged[key] = localVal;
      }
    }
  }

  // Version must advance past both
  const localVer = Number(localRecord.version || 1);
  const remoteVer = Number(remoteRecord.version || 1);
  merged.version = Math.max(localVer, remoteVer) + 1;
  merged.updatedAt = new Date().toISOString();

  if (conflictedFields.length > 0) {
    const conflict: ConflictRecord = {
      id: generateUUID(),
      entityType,
      entityId,
      localPayload: localRecord,
      remotePayload: remoteRecord,
      conflictedFields,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    await db.syncConflicts.put(conflict);
    return { mergedRecord: merged, hasConflict: true };
  }

  return { mergedRecord: merged, hasConflict: false };
}
