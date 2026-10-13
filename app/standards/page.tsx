"use client";

import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { GripVertical, Lock, Plus, Trash2, Unlock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UtilityPage } from "@/components/utility-page";

type Standard = { id: string; practice: string };

const DEFAULT_STANDARDS: Standard[] = [
  { id: "first-action", practice: "A task is ready when the next physical action is obvious and small enough to begin without negotiation." },
  { id: "minimum", practice: "Protect a version of the work you can complete even on a low-energy day. Consistency beats heroic plans." },
  { id: "review", practice: "Use the weekly review to adjust commitments, not to judge the previous week." },
];

export default function StandardsPage() {
  const [standards, setStandards] = useState<Standard[]>(DEFAULT_STANDARDS);
  const [locked, setLocked] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [practice, setPractice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("execution-os-standards");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { standards?: Array<Standard & { title?: string; text?: string }>; locked?: boolean };
      if (Array.isArray(parsed.standards)) {
        setStandards(parsed.standards.map((item) => ({ id: item.id, practice: item.practice || [item.title, item.text].filter(Boolean).join(": ") })));
      }
      if (typeof parsed.locked === "boolean") setLocked(parsed.locked);
    } catch {
      window.localStorage.removeItem("execution-os-standards");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("execution-os-standards", JSON.stringify({ standards, locked }));
  }, [locked, standards]);

  const move = (fromId: string, toId: string) => {
    if (locked || fromId === toId) return;
    setStandards((current) => {
      const fromIndex = current.findIndex((item) => item.id === fromId);
      const toIndex = current.findIndex((item) => item.id === toId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();
    if (draggedId) move(draggedId, targetId);
    setDraggedId(null);
  };

  const addPractice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) return;
    if (!practice.trim()) {
      setError("Write the practice before adding it.");
      return;
    }
    setStandards((current) => [...current, { id: `standard-${Date.now()}`, practice: practice.trim() }]);
    setPractice("");
    setError("");
    setShowAdd(false);
  };

  const removePractice = (id: string) => {
    if (!locked) setStandards((current) => current.filter((item) => item.id !== id));
  };

  return <UtilityPage title="Standards & Practices" description="A personal operating manual. Unlock to arrange or add practices.">
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${locked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>{locked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}</div><div><p className="font-medium">{locked ? "List locked" : "List unlocked"}</p><p className="text-sm text-muted-foreground">{locked ? "Drag and add actions are disabled." : "Drag practices to change their order or add a new one."}</p></div></div><div className="flex gap-2"><Button variant={locked ? "default" : "secondary"} onClick={() => setLocked((value) => !value)}>{locked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}{locked ? "Unlock list" : "Lock list"}</Button><Button variant="outline" disabled={locked} onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" />Add practice</Button></div></div>
    <div className="space-y-3" aria-label="Practices list">{standards.map((standard) => <div key={standard.id} draggable={!locked} onDragStart={() => setDraggedId(standard.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, standard.id)} className={`transition-all ${draggedId === standard.id ? "opacity-50" : ""}`}><Card className={!locked ? "border-primary/30 shadow-md shadow-primary/5" : ""}><CardContent className="flex items-center gap-3 p-4 sm:p-5"><div className={`shrink-0 ${locked ? "text-muted-foreground/40" : "cursor-grab text-primary"}`} aria-label={locked ? "Locked practice" : "Drag to reorder practice"} title={locked ? "Unlock the list to drag" : "Drag to reorder"}><GripVertical className="h-5 w-5" /></div><p className="min-w-0 flex-1 text-sm leading-6">{standard.practice}</p><Button variant="ghost" size="icon" disabled={locked} onClick={() => removePractice(standard.id)} aria-label="Delete practice" title="Delete practice"><Trash2 className="h-5 w-5 text-destructive" /></Button></CardContent></Card></div>)}</div>
    {!standards.length && <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No practices yet. Unlock the list and add your first one.</CardContent></Card>}
    {showAdd && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"><form onSubmit={addPractice} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Add practice</h2><Button type="button" variant="ghost" size="icon" onClick={() => setShowAdd(false)} aria-label="Close add practice dialog"><X className="h-4 w-4" /></Button></div>{error && <p role="alert" className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}<label className="mt-5 block text-sm font-medium">Practice<textarea className="mt-1 h-28 w-full rounded-md border border-border bg-background p-3" value={practice} onChange={(event) => setPractice(event.target.value)} autoFocus placeholder="Write one clear practice" /></label><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Add practice</Button></div></form></div>}
  </UtilityPage>;
}
