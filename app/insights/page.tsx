"use client";

import { useMemo, useState } from "react";
import { Plus, Check, X, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useExecutionData } from "@/contexts/execution-data";
import type { PersonalObservation } from "@/types/execution-os";

export default function InsightsPage() {
  const { observations, createObservation, deleteObservation } = useExecutionData();
  const [activeType, setActiveType] = useState<"what_works" | "what_doesnt_work">("what_works");
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [category, setCategory] = useState("general");

  const whatWorks = useMemo(
    () => observations.filter((o) => o.type === "what_works"),
    [observations]
  );

  const whatDoesntWork = useMemo(
    () => observations.filter((o) => o.type === "what_doesnt_work"),
    [observations]
  );

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const points = pointsInput
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    await createObservation({
      type: activeType,
      title: title.trim(),
      points,
      category: category.trim() || "general",
      status: "active",
    });

    setTitle("");
    setPointsInput("");
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Self-Understanding & Behavioral Calibration</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              What Works / What Doesn't Work
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Empirical observations of personal conditions, triggers, starting techniques and failure patterns.
            </p>
          </div>

          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Observation
          </Button>
        </div>

        {/* Section 1: What Works */}
        <section className="space-y-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">What Works For Me</h2>
                <p className="text-xs text-muted-foreground">Effective working times, helpful environments, starting habits.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setActiveType("what_works"); setShowAddModal(true); }}>
              Add
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {whatWorks.length === 0 ? (
              <p className="py-4 text-xs italic text-muted-foreground">No records added yet.</p>
            ) : (
              whatWorks.map((item) => (
                <div key={item.id} className="relative rounded-2xl border border-border bg-card p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                  </div>
                  {item.points && item.points.length > 0 && (
                    <ul className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                      {item.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteObservation(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section 2: What Doesn't Work */}
        <section className="space-y-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-white font-bold">
                <X className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">What Doesn't Work For Me</h2>
                <p className="text-xs text-muted-foreground">Sources of distraction, triggers for procrastination, burnout patterns.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setActiveType("what_doesnt_work"); setShowAddModal(true); }}>
              Add
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {whatDoesntWork.length === 0 ? (
              <p className="py-4 text-xs italic text-muted-foreground">No records added yet.</p>
            ) : (
              whatDoesntWork.map((item) => (
                <div key={item.id} className="relative rounded-2xl border border-border bg-card p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{item.title}</span>
                    <Badge variant="outline" className="text-[10px] capitalize">{item.category}</Badge>
                  </div>
                  {item.points && item.points.length > 0 && (
                    <ul className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                      {item.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-red-500">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteObservation(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Add Observation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Add Personal Observation</h2>
            <form onSubmit={handleAddObservation} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Type</label>
                <div className="mt-1 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeType === "what_works" ? "default" : "outline"}
                    onClick={() => setActiveType("what_works")}
                  >
                    What Works
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeType === "what_doesnt_work" ? "default" : "outline"}
                    onClick={() => setActiveType("what_doesnt_work")}
                  >
                    What Doesn't Work
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Title *</label>
                <Input
                  required
                  placeholder="e.g. Morning walk before coding"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Category</label>
                <Input
                  placeholder="e.g. environment, starting, sleep..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Pointwise Insights (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Enter specific points or evidence observed..."
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Observation</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
