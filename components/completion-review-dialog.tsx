"use client";

import { useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompletionReview, FocusSession, TaskRecord } from "@/contexts/execution-data";

const inputClass = "mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

export function CompletionReviewDialog({ task, sessions, onClose, onSubmit }: { task: TaskRecord; sessions: FocusSession[]; onClose: () => void; onSubmit: (review: CompletionReview) => void }) {
  const trackedMinutes = useMemo(() => {
    const focusMinutes = sessions.filter((session) => session.taskId === task.id).reduce((sum, session) => sum + session.durationMinutes, 0);
    const executionMinutes = Math.round((task.executionElapsedMs ?? 0) / 60000);
    return Math.max(focusMinutes, executionMinutes, task.completionReview?.actualMinutes ?? 0);
  }, [sessions, task]);
  const [actualDifficulty, setActualDifficulty] = useState(String(task.completionReview?.actualDifficulty ?? task.actualDifficulty ?? ""));
  const [actualMinutes, setActualMinutes] = useState(String(task.completionReview?.actualMinutes ?? (trackedMinutes || "")));
  const [outcome, setOutcome] = useState<"" | "yes" | "partially" | "no">(task.completionReview?.outcome ?? "");
  const [reflection, setReflection] = useState(task.completionReview?.reflection ?? "");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const difficulty = Number(actualDifficulty);
    const minutes = Number(actualMinutes);
    if (!difficulty || difficulty < 1 || difficulty > 10 || !minutes || minutes < 1 || !outcome) {
      setError("Actual difficulty, actual time taken, and outcome achieved are required.");
      return;
    }
    onSubmit({ actualDifficulty: difficulty, actualMinutes: minutes, outcome, reflection, completedAt: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-semibold">Completion review</h2><p className="mt-1 text-sm text-muted-foreground">Review “{task.title}” before marking it done.</p></div>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent border border-border/40" onClick={onClose} aria-label="Close review"><X className="h-5 w-5" /></Button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium">Actual difficulty /10<input type="number" min="1" max="10" className={inputClass} value={actualDifficulty} onChange={(event) => setActualDifficulty(event.target.value)} required /></label>
          <label className="block text-sm font-medium">Actual time taken (minutes)<input type="number" min="1" className={inputClass} value={actualMinutes} onChange={(event) => setActualMinutes(event.target.value)} required /></label>
          <label className="block text-sm font-medium">Outcome achieved<select className={inputClass} value={outcome} onChange={(event) => setOutcome(event.target.value as "yes" | "partially" | "no")} required><option value="">Choose one</option><option value="yes">Yes</option><option value="partially">Partially</option><option value="no">No</option></select></label>
          <label className="block text-sm font-medium">Reflection / lessons learned<textarea className="mt-1 h-24 w-full rounded-md border border-border bg-background p-3 text-sm" value={reflection} onChange={(event) => setReflection(event.target.value)} /></label>
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">Submit review</Button></div>
      </form>
    </div>
  );
}
