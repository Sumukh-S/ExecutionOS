"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/lib/utils";

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff className="h-3.5 w-3.5 text-muted-foreground" />,
        label: "Offline",
        color: "border-border bg-muted/40 text-muted-foreground",
      };
    }
    if (user) {
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
        label: "Supabase Live",
        color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };
    }
    return {
      icon: <Cloud className="h-3.5 w-3.5 text-muted-foreground" />,
      label: "Guest Mode",
      color: "border-border bg-muted/40 text-muted-foreground",
    };
  };

  const { icon, label, color } = getStatusConfig();

  return (
    <div
      title={user ? `Connected to Supabase as ${user.email}` : "Signed out / Guest mode"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        color
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
