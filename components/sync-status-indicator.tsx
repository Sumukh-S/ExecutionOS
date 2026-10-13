"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { syncEngine } from "@/lib/sync/engine";
import { useAuth } from "@/contexts/auth";
import type { SyncState } from "@/lib/sync/types";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator() {
  const [syncState, setSyncState] = useState<SyncState>("synced");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state, error) => {
      setSyncState(state);
      setErrorMsg(error || null);
      setIsSyncing(state === "syncing");
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncEngine.triggerSync(user?.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusConfig = () => {
    switch (syncState) {
      case "syncing":
        return {
          icon: <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />,
          label: "Syncing...",
          color: "border-primary/40 bg-primary/10 text-primary",
        };
      case "offline":
        return {
          icon: <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />,
          label: "Offline",
          color: "border-border bg-muted/40 text-muted-foreground",
        };
      case "pending":
        return {
          icon: <RefreshCw className="h-3.5 w-3.5 text-amber-500" />,
          label: "Pending sync",
          color: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        };
      case "conflict":
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />,
          label: "Conflicts noted",
          color: "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-400",
        };
      case "failed":
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
          label: "Sync retry",
          color: "border-destructive/40 bg-destructive/10 text-destructive",
        };
      case "synced":
      default:
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
          label: user ? "Synced" : "Local",
          color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        };
    }
  };

  const { icon, label, color } = getStatusConfig();

  return (
    <button
      type="button"
      onClick={handleManualSync}
      title={errorMsg ? `Sync issue: ${errorMsg}. Click to retry.` : "Click to trigger manual sync"}
      aria-label={`Sync state: ${label}. Click to sync.`}
      disabled={isSyncing}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all active:scale-95 disabled:opacity-75",
        color
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
