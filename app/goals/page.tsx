"use client";

import { useMemo, useState } from "react";
import { Plus, Target, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useExecutionData } from "@/contexts/execution-data";
import type { Goal } from "@/types/execution-os";

export default function GoalsPage() {
  const { goals, createGoal, updateGoal, deleteGoal, masterTasks } = useExecutionData();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [title, setTitle] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentProgress, setCurrentProgress] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [nextSteps, setNextSteps] = useState("");

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        title: title.trim(),
        desiredOutcome: desiredOutcome.trim(),
        targetValue: targetValue.trim(),
        currentProgress: Number(currentProgress),
        deadline: deadline || null,
        whyItMatters: whyItMatters.trim(),
        nextSteps: nextSteps.trim(),
      });
      setEditingGoal(null);
    } else {
      await createGoal({
        title: title.trim(),
        desiredOutcome: desiredOutcome.trim(),
        targetValue: targetValue.trim(),
        currentProgress: Number(currentProgress),
        deadline: deadline || null,
        whyItMatters: whyItMatters.trim(),
        nextSteps: nextSteps.trim(),
        status: "active",
      });
    }

    setTitle("");
    setDesiredOutcome("");
    setTargetValue("");
    setCurrentProgress(0);
    setDeadline("");
    setWhyItMatters("");
    setNextSteps("");
    setShowModal(false);
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Goals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Clear, specific, and measurable outcomes linked to daily execution.
            </p>
          </div>

          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Goal
          </Button>
        </div>

        {/* Active Goals Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeGoals.length === 0 ? (
            <p className="py-8 text-center text-xs italic text-muted-foreground col-span-2">
              No active goals defined. Add a specific outcome above.
            </p>
          ) : (
            activeGoals.map((goal) => {
              const linkedTasks = masterTasks.filter((t) => t.goalId === goal.id && !t.deletedAt);
              return (
                <div key={goal.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-foreground">{goal.title}</h3>
                      {goal.deadline && (
                        <span className="text-[11px] text-muted-foreground">Deadline: {goal.deadline}</span>
                      )}
                    </div>

                    {goal.desiredOutcome && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <strong className="text-foreground">Outcome:</strong> {goal.desiredOutcome}
                      </p>
                    )}

                    {goal.targetValue && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <strong className="text-foreground">Target:</strong> {goal.targetValue}
                      </p>
                    )}

                    {goal.whyItMatters && (
                      <p className="mt-2 text-xs italic text-primary/80">
                        "{goal.whyItMatters}"
                      </p>
                    )}

                    {/* Progress Slider */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-foreground">{goal.currentProgress}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.currentProgress}
                        onChange={(e) => updateGoal(goal.id, { currentProgress: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    {/* Linked Tasks Count */}
                    <div className="mt-4 rounded-lg border border-border bg-background p-2.5 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{linkedTasks.length}</span> linked master tasks (
                      {linkedTasks.filter((t) => t.status === "done").length} done)
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGoal(goal.id, { status: "completed" })}
                      className="gap-1.5 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      Mark Completed
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Create Goal</h2>
            <form onSubmit={handleSaveGoal} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Title *</label>
                <Input
                  required
                  placeholder="e.g. Complete 100 DSA Problems"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Desired Outcome</label>
                <Input
                  placeholder="e.g. Fluent with dynamic programming and trees"
                  value={desiredOutcome}
                  onChange={(e) => setDesiredOutcome(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Target Metric Value</label>
                <Input
                  placeholder="e.g. 100 problems"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Deadline (Optional)</label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Why It Matters</label>
                <Input
                  placeholder="Internal motivation..."
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Next Actionable Steps</label>
                <Input
                  placeholder="First set of actions..."
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Goal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
