"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useExecutionData } from "@/contexts/execution-data";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const toIso = (value: string) => value ? new Date(value).toISOString() : "";

export default function CalendarPage() {
  const today = new Date();
  const { tasks, addTask } = useExecutionData();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<"Day" | "Week" | "Month">("Month");
  const [showAdd, setShowAdd] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const previousMonthDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - firstDay + 1;
      if (dayNumber < 1) return { day: previousMonthDays + dayNumber, current: false, date: null };
      if (dayNumber > daysInMonth) return { day: dayNumber - daysInMonth, current: false, date: null };
      return { day: dayNumber, current: true, date: new Date(month.getFullYear(), month.getMonth(), dayNumber) };
    });
  }, [month]);

  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const isToday = (date: Date | null) => Boolean(date && date.toDateString() === today.toDateString());
  const tasksForDay = (date: Date | null) => date ? tasks.filter((task) => task.scheduledStart && new Date(task.scheduledStart).toDateString() === date.toDateString()) : [];

  const addEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!eventTitle.trim() || !eventStart || !eventEnd) return;
    addTask({ title: eventTitle.trim(), description: eventTitle.trim(), scope: "Calendar event", firstAction: "Show up at the scheduled time.", icon: "📅", listName: "Calendar", priority: "medium", scheduledStart: toIso(eventStart), scheduledEnd: toIso(eventEnd), deadline: "", location: "", alarm: false, notes: "", resources: "", predictedDifficulty: 3, expectedDuration: Math.max(1, Math.round((new Date(eventEnd).getTime() - new Date(eventStart).getTime()) / 60000)), wish: "", outcome: "", obstacle: "", weeklyGoal: "", monthlyGoal: "" });
    setEventTitle(""); setEventStart(""); setEventEnd(""); setShowAdd(false);
  };

  return <div className="min-h-screen p-4 sm:p-6 pb-24"><div className="max-w-6xl mx-auto space-y-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-muted-foreground">Plan your attention</p><h1 className="text-2xl font-bold tracking-tight">Calendar</h1></div><div className="flex items-center gap-2"><Button variant="outline" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</Button><Button className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add event</span></Button></div></div><section className="rounded-xl border border-border bg-card p-3 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-1"><Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft className="h-5 w-5" /></Button><Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight className="h-5 w-5" /></Button></div><h2 className="text-lg font-semibold sm:mr-auto">{monthLabel}</h2></div><div className="grid grid-cols-3 rounded-lg border border-border p-1 sm:flex">{(["Day", "Week", "Month"] as const).map((option) => <Button key={option} variant={view === option ? "secondary" : "ghost"} size="sm" onClick={() => setView(option)}>{option}</Button>)}</div></div>{view === "Month" ? <div className="mt-5 w-full overflow-hidden"><div className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-medium text-muted-foreground">{WEEKDAYS.map((weekday) => <div key={weekday}>{weekday}</div>)}</div><div className="grid grid-cols-7">{days.map((item, index) => <div key={`${item.day}-${index}`} className={`min-h-16 overflow-hidden border-b border-r border-border p-1 sm:min-h-24 sm:p-2 ${item.current ? "bg-background" : "bg-muted/30 text-muted-foreground"}`}><div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] sm:h-7 sm:w-7 sm:text-xs ${isToday(item.date) ? "bg-primary font-semibold text-primary-foreground" : ""}`}>{item.day}</div>{tasksForDay(item.date).map((task) => <Link key={task.id} href={`/tasks?task=${task.id}`} className="mt-1 block truncate rounded bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary hover:bg-primary/20 sm:text-[11px]">{task.title}</Link>)}</div>)}</div></div> : <div className="mt-5 grid min-h-64 place-items-center rounded-lg border border-dashed border-border p-8 text-center"><div><p className="font-medium">{view} view</p><p className="mt-1 text-sm text-muted-foreground">Scheduled tasks are linked from the month view.</p></div></div>}</section></div>{showAdd && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4"><form onSubmit={addEvent} className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Add calendar event</h2><Button type="button" variant="ghost" size="icon" className="h-11 w-11" onClick={() => setShowAdd(false)} aria-label="Close add event"><X className="h-6 w-6" strokeWidth={2.5} /></Button></div><label className="mt-5 block text-sm font-medium">Event name<Input className="mt-2" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} required /></label><label className="mt-4 block text-sm font-medium">Start<input type="datetime-local" className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3" value={eventStart} onChange={(event) => setEventStart(event.target.value)} required /></label><label className="mt-4 block text-sm font-medium">End<input type="datetime-local" className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3" value={eventEnd} onChange={(event) => setEventEnd(event.target.value)} required /></label><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Add event</Button></div></form></div>}</div>;
}
