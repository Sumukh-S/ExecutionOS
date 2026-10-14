"use client";

import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useExecutionData } from "@/contexts/execution-data";
import type { Standard } from "@/types/execution-os";

const suggestedDefaults = [
  { name: "Clarity Before Execution", rule: "Define the expected outcome and first action before starting any task.", why: "Reduces starting friction and cognitive ambiguity." },
  { name: "Consistency Before Intensity", rule: "Do not attempt massive workloads on single days at the expense of subsequent days.", why: "Burnout triggers prolonged regression." },
  { name: "Start at Current Capacity", rule: "Use Grade 0 (2–9 min) or Grade 1 (10–30 min) when resistance is high.", why: "Starting small preserves continuity." },
  { name: "No Overcompensation", rule: "Do not compensate for missed days with excessive workloads.", why: "Missed days are normal; overcompensating causes abandonment." },
  { name: "Return Immediately", rule: "After any setback, resume with one simple action without self-criticism.", why: "Recovery speed matters more than perfection." },
  { name: "Empirical Calibration", rule: "Review and adapt based on actual observed data, not assumptions.", why: "Calibration builds realistic confidence." },
];

export default function StandardsPage() {
  const { standards, createStandard, deleteStandard } = useExecutionData();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [rule, setRule] = useState("");
  const [whyItExists, setWhyItExists] = useState("");
  const [practicalImplementation, setPracticalImplementation] = useState("");

  const handleAddStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rule.trim()) return;

    await createStandard({
      name: name.trim(),
      rule: rule.trim(),
      whyItExists: whyItExists.trim(),
      practicalImplementation: practicalImplementation.trim(),
      status: "active",
      sortOrder: standards.length,
    });

    setName("");
    setRule("");
    setWhyItExists("");
    setPracticalImplementation("");
    setShowModal(false);
  };

  const handleAddSuggested = async (suggested: typeof suggestedDefaults[0]) => {
    await createStandard({
      name: suggested.name,
      rule: suggested.rule,
      whyItExists: suggested.why,
      status: "active",
      sortOrder: standards.length,
    });
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>Personal Operating Manual</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Standards & Practices
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Guiding principles developed from actual experience to govern sustainable daily execution.
            </p>
          </div>

          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Standard
          </Button>
        </div>

        {/* Active Standards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {standards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center col-span-2 space-y-4">
              <p className="text-sm font-semibold text-foreground">No personal standards defined yet.</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                You can start by adopting any of these core suggested standards:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {suggestedDefaults.map((s) => (
                  <Button
                    key={s.name}
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddSuggested(s)}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" />
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            standards.map((std, i) => (
              <div key={std.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Standard #{i + 1}</span>
                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                  </div>
                  <h3 className="mt-1.5 text-base font-bold text-foreground">{std.name}</h3>
                  <p className="mt-2 text-sm text-foreground font-medium bg-muted/30 p-2.5 rounded-lg border border-border/80">
                    "{std.rule}"
                  </p>
                  {std.whyItExists && (
                    <p className="mt-2.5 text-xs text-muted-foreground">
                      <strong className="text-foreground">Why it exists:</strong> {std.whyItExists}
                    </p>
                  )}
                  {std.practicalImplementation && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <strong className="text-foreground">Implementation:</strong> {std.practicalImplementation}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end border-t border-border pt-3">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteStandard(std.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Add Custom Standard</h2>
            <form onSubmit={handleAddStandard} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Standard Name *</label>
                <Input
                  required
                  placeholder="e.g. Clarity before execution"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">The Rule *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Clear operating rule..."
                  value={rule}
                  onChange={(e) => setRule(e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Why it exists</label>
                <Input
                  placeholder="e.g. Prevents burnout after high-intensity periods"
                  value={whyItExists}
                  onChange={(e) => setWhyItExists(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Practical Implementation</label>
                <Input
                  placeholder="How it applies in practice..."
                  value={practicalImplementation}
                  onChange={(e) => setPracticalImplementation(e.target.value)}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Standard</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
