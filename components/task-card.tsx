"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Repeat,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDeadlineCountdown } from "@/lib/date-utils";
import type { MasterTask, Priority } from "@/types/execution-os";

const priorityConfig: Record<Priority, { label: string; badgeClass: string }> = {
  urgent: { label: "Urgent", badgeClass: "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" },
  high: { label: "High", badgeClass: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  medium: { label: "Medium", badgeClass: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  low: { label: "Low", badgeClass: "border-border bg-muted/40 text-muted-foreground" },
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onStartFocus,
  onSchedule,
  showFullDetails = false,
  isRecurring = false,
}: {
  task: MasterTask;
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onStartFocus?: () => void;
  onSchedule?: () => void;
  showFullDetails?: boolean;
  isRecurring?: boolean;
}) {
  const [expanded, setExpanded] = useState(showFullDetails);
  const countdown = getDeadlineCountdown(task.deadline);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const hasRecurrence = isRecurring || Boolean(task.recurrenceId);

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md",
        task.status === "done" && "opacity-75 bg-muted/20"
      )}
    >
      <div>
        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-semibold", priority.badgeClass)}>
              {priority.label}
            </span>
            <span className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              Diff: {task.predictedDifficulty}/10
            </span>
            {task.expectedDuration > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.expectedDuration}m
              </span>
            )}
            {hasRecurrence && (
              <span className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Repeat className="h-3 w-3" />
                Repeating
              </span>
            )}
          </div>

          {/* Deadline Countdown */}
          {countdown && (
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                countdown.isOverdue
                  ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                  : countdown.isClose
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              {countdown.label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className={cn(
            "mt-2 text-base font-semibold leading-snug tracking-tight text-foreground",
            task.status === "done" && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </h3>

        {/* First Action Callout */}
        {task.firstAction && (
          <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs text-primary">
            <span className="font-semibold">First Action:</span> {task.firstAction}
          </div>
        )}

        {/* Expected Outcome */}
        {task.expectedOutcome && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            <span className="font-medium text-foreground">Outcome:</span> {task.expectedOutcome}
          </p>
        )}

        {/* Optional Expanded View: WOOP & Notes */}
        {expanded && (
          <div className="mt-3 space-y-2 border-t border-border/80 pt-3 text-xs">
            {task.wish && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Wish:</span> {task.wish}
              </p>
            )}
            {task.obstacle && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Obstacle:</span> {task.obstacle}
              </p>
            )}
            {task.plan && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Plan:</span> {task.plan}
              </p>
            )}
            {task.notes && (
              <p className="whitespace-pre-wrap text-muted-foreground">
                <span className="font-semibold text-foreground">Notes:</span> {task.notes}
              </p>
            )}
            {task.scheduledDate && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Scheduled:</span> {task.scheduledDate}{" "}
                {task.scheduledTime || ""}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center gap-1">
          {onComplete && task.status !== "done" && (
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700"
              onClick={onComplete}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </Button>
          )}

          {onStartFocus && task.status !== "done" && (
            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={onStartFocus}>
              <Play className="h-3.5 w-3.5 text-primary" />
              Focus
            </Button>
          )}

          {onSchedule && (
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={onSchedule}>
              <Calendar className="h-3.5 w-3.5" />
              Schedule
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {(task.wish || task.obstacle || task.notes) && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Collapse details" : "Expand details"}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}

          {onEdit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
              title="Edit task"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}

          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              title="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
