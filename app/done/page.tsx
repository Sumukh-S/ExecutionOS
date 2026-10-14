"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Search, RotateCcw, CalendarPlus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExecutionData } from "@/contexts/execution-data";
import { getTomorrowDateString } from "@/lib/date-utils";
import type { MasterTask } from "@/types/execution-os";

export default function DonePage() {
  const { masterTasks, fiveMinuteTasks, updateMasterTask, createMasterTask } = useExecutionData();
  const [query, setQuery] = useState("");
  const [followUpTask, setFollowUpTask] = useState<MasterTask | null>(null);
  const [followUpDate, setFollowUpDate] = useState(getTomorrowDateString());
  const [message, setMessage] = useState("");

  const completedTasks = useMemo(
    () => masterTasks.filter((t) => t.status === "done" && !t.deletedAt),
    [masterTasks]
  );

  const completedFiveMin = useMemo(
    () => fiveMinuteTasks.filter((f) => f.completed),
    [fiveMinuteTasks]
  );

  const filteredTasks = useMemo(() => {
    if (!query.trim()) return completedTasks;
    const q = query.toLowerCase();
    return completedTasks.filter((t) => `${t.title} ${t.description} ${t.notes}`.toLowerCase().includes(q));
  }, [completedTasks, query]);

  const handleReopen = async (task: MasterTask) => {
    await updateMasterTask(task.id, { status: "todo", completedAt: null });
    setMessage(`Reopened "${task.title}".`);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleCreateFollowUp = async () => {
    if (!followUpTask || !followUpDate) return;
    await createMasterTask({
      title: `Follow-up: ${followUpTask.title}`,
      expectedOutcome: followUpTask.expectedOutcome,
      firstAction: followUpTask.firstAction,
      priority: followUpTask.priority,
      predictedDifficulty: followUpTask.predictedDifficulty,
      expectedDuration: followUpTask.expectedDuration,
      scheduledDate: followUpDate,
      goalId: followUpTask.goalId,
      status: "todo",
    });
    setFollowUpTask(null);
    setMessage(`Scheduled follow-up for ${followUpDate}.`);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Completion History</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Done</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {completedTasks.length} master tasks and {completedFiveMin.length} five-minute tasks successfully executed.
            </p>
          </div>
        </div>

        {message && (
          <output className="block rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            {message}
          </output>
        )}

        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search completed tasks..."
            className="pl-9"
          />
        </div>

        {/* Completed Regular Tasks */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Completed Tasks ({filteredTasks.length})</h2>

          {filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No completed tasks match your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Done on: {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "Previously"}
                      </span>
                      <span className="rounded bg-muted/60 px-2 py-0.5 font-medium uppercase text-[10px]">
                        {task.priority}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold line-through text-muted-foreground">{task.title}</h3>
                    {task.expectedOutcome && (
                      <p className="mt-1 text-xs text-muted-foreground">Outcome: {task.expectedOutcome}</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleReopen(task)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reopen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => setFollowUpTask(task)}
                    >
                      <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                      Schedule Follow-up
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Completed Five-Minute Tasks */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground">Completed Five-Minute Items ({completedFiveMin.length})</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {completedFiveMin.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground line-through">{item.title}</span>
                <span className="block mt-0.5 text-[11px] text-muted-foreground">{item.date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Schedule Follow-up Modal */}
      {followUpTask && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Schedule Next Occurrence</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Would you like to schedule when you will work on "{followUpTask.title}" next?
            </p>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Select Future Date</label>
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setFollowUpTask(null)}>
                Skip / Cancel
              </Button>
              <Button onClick={handleCreateFollowUp} className="gap-2">
                <CalendarPlus className="h-4 w-4" />
                Schedule Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
