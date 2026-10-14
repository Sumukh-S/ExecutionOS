"use client";

import { useMemo, useState } from "react";
import { Plus, BookOpen, Activity, AlertCircle, Compass, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExecutionData } from "@/contexts/execution-data";
import type { JournalEntry } from "@/types/execution-os";

type JournalCategory = "learnings" | "behaviour" | "problems" | "purpose";

export default function JournalPage() {
  const { journalEntries, createJournalEntry, deleteJournalEntry, updateJournalEntry } = useExecutionData();
  const [selectedCat, setSelectedCat] = useState<JournalCategory>("learnings");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [context, setContext] = useState("");
  const [problemTriggers, setProblemTriggers] = useState("");
  const [problemWhatHelped, setProblemWhatHelped] = useState("");
  const [visualizationFuture, setVisualizationFuture] = useState("");
  const [visualizationNextStep, setVisualizationNextStep] = useState("");

  const entriesForCat = useMemo(
    () => journalEntries.filter((j) => j.category === selectedCat),
    [journalEntries, selectedCat]
  );

  const pinnedEntries = useMemo(() => entriesForCat.filter((j) => j.isPinned), [entriesForCat]);
  const regularEntries = useMemo(() => entriesForCat.filter((j) => !j.isPinned), [entriesForCat]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const points = pointsInput
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    await createJournalEntry({
      category: selectedCat,
      title: title.trim(),
      points,
      quoteSource: quoteSource.trim() || undefined,
      context: context.trim() || undefined,
      problemTriggers: problemTriggers.trim() || undefined,
      problemWhatHelped: problemWhatHelped.trim() || undefined,
      visualizationFuture: visualizationFuture.trim() || undefined,
      visualizationNextStep: visualizationNextStep.trim() || undefined,
      isPinned: false,
    });

    setTitle("");
    setPointsInput("");
    setQuoteSource("");
    setContext("");
    setProblemTriggers("");
    setProblemWhatHelped("");
    setVisualizationFuture("");
    setVisualizationNextStep("");
    setShowAddModal(false);
  };

  const handleTogglePin = async (entry: JournalEntry) => {
    await updateJournalEntry(entry.id, { isPinned: !entry.isPinned });
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Pointwise Journal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Four focused categories for retention, behavioral data, structured problems and purpose.
            </p>
          </div>

          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {/* Four Category Tabs */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            onClick={() => setSelectedCat("learnings")}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
              selectedCat === "learnings" ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-accent/40"
            }`}
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">1. Read Everyday</span>
            <span className="text-[11px] text-muted-foreground">Learnings & quotes</span>
          </button>

          <button
            onClick={() => setSelectedCat("behaviour")}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
              selectedCat === "behaviour" ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-accent/40"
            }`}
          >
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">2. Behaviour</span>
            <span className="text-[11px] text-muted-foreground">Quick data drop</span>
          </button>

          <button
            onClick={() => setSelectedCat("problems")}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
              selectedCat === "problems" ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-accent/40"
            }`}
          >
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">3. Problems</span>
            <span className="text-[11px] text-muted-foreground">Structured triggers</span>
          </button>

          <button
            onClick={() => setSelectedCat("purpose")}
            className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors ${
              selectedCat === "purpose" ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-accent/40"
            }`}
          >
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">4. My Purpose</span>
            <span className="text-[11px] text-muted-foreground">Direction & visualization</span>
          </button>
        </div>

        {/* Pinned Entries (if any) */}
        {pinnedEntries.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5" /> Pinned Entries
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pinnedEntries.map((entry) => (
                <div key={entry.id} className="relative rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{entry.title}</h3>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => handleTogglePin(entry)}>
                        <Pin className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteJournalEntry(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {entry.quoteSource && <p className="mt-1 text-xs italic text-muted-foreground">— {entry.quoteSource}</p>}
                  {entry.points && entry.points.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {entry.points.map((pt, i) => (
                        <li key={i}>• {pt}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regular Entries */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entries</p>
          {regularEntries.length === 0 && pinnedEntries.length === 0 ? (
            <p className="py-8 text-center text-xs italic text-muted-foreground">No entries in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {regularEntries.map((entry) => (
                <div key={entry.id} className="relative rounded-2xl border border-border bg-card p-4 text-sm shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{entry.title}</h3>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleTogglePin(entry)}>
                        <Pin className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteJournalEntry(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {entry.quoteSource && <p className="mt-1 text-xs italic text-muted-foreground">— {entry.quoteSource}</p>}
                  {entry.points && entry.points.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {entry.points.map((pt, i) => (
                        <li key={i}>• {pt}</li>
                      ))}
                    </ul>
                  )}
                  {entry.problemTriggers && (
                    <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Triggers:</span> {entry.problemTriggers}</p>
                  )}
                  {entry.problemWhatHelped && (
                    <p className="mt-1 text-xs text-muted-foreground"><span className="font-semibold text-foreground">What Helped:</span> {entry.problemWhatHelped}</p>
                  )}
                  {entry.visualizationFuture && (
                    <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Vision:</span> {entry.visualizationFuture}</p>
                  )}
                  {entry.visualizationNextStep && (
                    <p className="mt-1 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Next Step:</span> {entry.visualizationNextStep}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Add Journal Entry</h2>
            <form onSubmit={handleAddEntry} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Category</label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value as JournalCategory)}
                  className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
                >
                  <option value="learnings">1. Read Everyday — Learnings</option>
                  <option value="behaviour">2. Behaviour — Data Drop</option>
                  <option value="problems">3. Specific Problems</option>
                  <option value="purpose">4. My Purpose & Visualization</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Title *</label>
                <Input
                  required
                  placeholder="Subject or concept..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              {selectedCat === "learnings" && (
                <div>
                  <label className="text-xs text-muted-foreground">Source / Author (Optional)</label>
                  <Input placeholder="e.g. Marcus Aurelius, Clean Code" value={quoteSource} onChange={(e) => setQuoteSource(e.target.value)} />
                </div>
              )}

              {selectedCat === "behaviour" && (
                <div>
                  <label className="text-xs text-muted-foreground">Context / Environment (Optional)</label>
                  <Input placeholder="e.g. 2:00 PM after lunch at library" value={context} onChange={(e) => setContext(e.target.value)} />
                </div>
              )}

              {selectedCat === "problems" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Triggers</label>
                    <Input placeholder="What triggers this problem?" value={problemTriggers} onChange={(e) => setProblemTriggers(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">What Helped</label>
                    <Input placeholder="What has actually helped reduce it?" value={problemWhatHelped} onChange={(e) => setProblemWhatHelped(e.target.value)} />
                  </div>
                </>
              )}

              {selectedCat === "purpose" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Desired Future Scenario</label>
                    <textarea rows={2} placeholder="Written visualization of where you are heading..." value={visualizationFuture} onChange={(e) => setVisualizationFuture(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Next Action Connecting Today to That Future</label>
                    <Input placeholder="Specific next action..." value={visualizationNextStep} onChange={(e) => setVisualizationNextStep(e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Points (one per line)</label>
                <textarea
                  rows={4}
                  placeholder="Enter takeaway points or observations..."
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-sm"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Entry</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
