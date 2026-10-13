"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Flag, Calendar, Flame, MoreVertical, Check, Trash2, Info, Pencil, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates";

const priorityColors = {
  low: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-300 border-red-500/30",
};

interface TaskCardProps {
  id?: string;
  title: string;
  icon: string;
  listName?: string;
  priority: string;
  scheduledDate?: string;
  deadline?: string | null;
  difficulty?: number;
  predictedDifficulty?: number;
  actualDifficulty?: number | null;
  expectedDuration?: number;
  streak?: number;
  status?: string;
  isMain?: boolean;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onDelete?: () => void;
  onMenu?: () => void;
  className?: string;
}

export function TaskCard({
  id,
  title,
  icon,
  listName,
  priority,
  scheduledDate,
  deadline,
  difficulty,
  predictedDifficulty,
  actualDifficulty,
  expectedDuration,
  streak,
  status,
  isMain,
  onComplete,
  onDelete,
  onMenu,
  onEdit,
  onStart,
  onPause,
  onViewDetails,
  className,
}: TaskCardProps) {
  return (
    <Card className={cn("bg-card border-border/50 hover:border-border transition-colors", className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h3 className="truncate font-medium text-sm leading-tight">{title}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {streak != null && streak > 0 && (
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
            )}
            {deadline && (
              <span className="flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive whitespace-nowrap">
                <Clock className="h-3.5 w-3.5" />
                Due {formatDateTime(deadline)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {listName && <Badge variant="outline" className="text-xs">{listName}</Badge>}
          <Badge className={cn("text-xs border", priorityColors[priority as keyof typeof priorityColors])}>
            <Flag className="w-3 h-3 mr-1" />
            {priority}
          </Badge>
          {scheduledDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {scheduledDate}
            </span>
          )}
        </div>
        {(difficulty || expectedDuration) && (
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            {(difficulty || predictedDifficulty) && <span>Predicted: {difficulty ?? predictedDifficulty}/10</span>}
            {actualDifficulty != null && <span>Actual: {actualDifficulty}/10</span>}
            {expectedDuration && <span>Expected: {expectedDuration} min</span>}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 flex justify-between">
        <div className="flex items-center gap-2">
          {streak != null && streak > 0 && (
            <span className="text-xs text-orange-400">🔥 {streak}-day streak</span>
          )}
        </div>
        <div className="flex gap-2">
          {onViewDetails && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onViewDetails} title="View task details" aria-label="View task details">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </Button>
          )}
          {onStart && status !== "in_progress" && status !== "done" && (
            <Button size="sm" variant="outline" className="gap-1.5 hidden" onClick={onStart} title="Start task" aria-label="Start task">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Start</span>
            </Button>
          )}
          {onPause && status === "in_progress" && (
            <Button size="sm" variant="outline" className="gap-1.5 hidden" onClick={onPause} title="Pause task" aria-label="Pause task">
              <Pause className="h-4 w-4" />
              <span className="hidden sm:inline">Pause</span>
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit} title="Edit task" aria-label="Edit task">
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {onMenu && (
            <Button size="sm" variant="ghost" onClick={onMenu}>
              <MoreVertical className="w-3 h-3" />
            </Button>
          )}
          {onComplete && status !== "done" && (

<Button
  size="sm"
  variant="ghost"
  className="shrink-0 border border-primary/40
             bg-primary/10 text-primary
             transition-all duration-200
             hover:scale-105
             hover:border-primary
             hover:bg-primary
             hover:text-primary-foreground
             hover:shadow-md
             active:scale-95"
  onClick={onComplete}
  title="Complete task"
>
  <Check className="w-3 h-3 mr-1" />
  Done
</Button>

          )}

{onDelete && (
  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 border border-primary/40
             bg-primary/10 text-primary
             transition-all duration-200
             hover:scale-105
             hover:border-primary
             hover:bg-primary
             hover:text-primary-foreground
             hover:shadow-md
             active:scale-95"
                    onClick={onDelete}
                    title="Delete"
                    aria-label="Delete task"
                  >
                    <Trash2 strokeWidth={2.2} className="h-5 w-5 shrink-0" />
                  </Button>
)}


        </div>
      </CardFooter>
    </Card>
  );
}