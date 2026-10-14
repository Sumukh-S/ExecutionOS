"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExecutionData } from "@/contexts/execution-data";
import { formatLocalDate, getTodayDateString } from "@/lib/date-utils";
import type { CalendarEvent } from "@/types/execution-os";

export default function CalendarPage() {
  const todayStr = getTodayDateString();
  const { events, createEvent, deleteEvent, occurrences, masterTasks } = useExecutionData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showEventModal, setShowEventModal] = useState(false);

  // Form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(selectedDate);
  const [eventStart, setEventStart] = useState("09:00");
  const [eventEnd, setEventEnd] = useState("10:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventAlarm, setEventAlarm] = useState(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Calendar dates generation
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prefix padding from prev month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({ dateStr: formatLocalDate(prevDate), dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      days.push({ dateStr: formatLocalDate(currDate), dayNum: i, isCurrentMonth: true });
    }

    // Suffix padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ dateStr: formatLocalDate(nextDate), dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // Selected date items
  const selectedEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate),
    [events, selectedDate]
  );

  const selectedOccurrences = useMemo(() => {
    return occurrences.filter((o) => o.scheduledDate === selectedDate).map((occ) => {
      const task = masterTasks.find((t) => t.id === occ.taskId);
      return { occurrence: occ, task };
    });
  }, [occurrences, masterTasks, selectedDate]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    await createEvent({
      title: eventTitle.trim(),
      date: eventDate,
      startTime: eventStart,
      endTime: eventEnd || null,
      location: eventLocation.trim(),
      description: eventDesc.trim(),
      hasAlarm: eventAlarm,
      alarmSetConfirmed: eventAlarm,
    });
    setEventTitle("");
    setEventLocation("");
    setEventDesc("");
    setShowEventModal(false);
  };

  return (
    <div className="min-h-screen p-4 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Calendar & Events</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Distinct appointment and commitment tracking alongside scheduled tasks.
            </p>
          </div>

          <Button onClick={() => setShowEventModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Calendar View Container */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Month Grid (2 cols) */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-lg font-bold text-foreground">
                {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </h2>
              <div className="flex gap-1.5">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 border-b border-border">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="mt-2 grid grid-cols-7 gap-1">
              {daysInMonth.map(({ dateStr, dayNum, isCurrentMonth }) => {
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const dayEventCount = events.filter((e) => e.date === dateStr).length;
                const dayOccCount = occurrences.filter((o) => o.scheduledDate === dateStr).length;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setEventDate(dateStr);
                    }}
                    className={`flex min-h-[64px] flex-col items-start justify-between rounded-xl border p-2 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/60 hover:border-border hover:bg-accent/40"
                    } ${!isCurrentMonth ? "opacity-35" : ""}`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {dayNum}
                    </span>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayEventCount > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title={`${dayEventCount} events`} />
                      )}
                      {dayOccCount > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" title={`${dayOccCount} tasks`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Details Sidebar (1 col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </h3>

              {/* Events on this date */}
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Events ({selectedEvents.length})
                </p>
                {selectedEvents.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">No events on this day.</p>
                ) : (
                  selectedEvents.map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-border bg-background p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{ev.title}</span>
                        {ev.hasAlarm && <Bell className="h-3 w-3 text-amber-500" />}
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {ev.startTime} {ev.endTime ? `– ${ev.endTime}` : ""}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                      {ev.description && <p className="mt-1 text-muted-foreground">{ev.description}</p>}
                    </div>
                  ))
                )}
              </div>

              {/* Tasks on this date */}
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Scheduled Tasks ({selectedOccurrences.length})
                </p>
                {selectedOccurrences.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground">No tasks scheduled for this day.</p>
                ) : (
                  selectedOccurrences.map(({ occurrence, task }) => (
                    <div key={occurrence.id} className="rounded-lg border border-border bg-background p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{task?.title || "Task"}</span>
                        <span className="capitalize text-[10px] text-muted-foreground">{occurrence.dailySection}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground">Add Calendar Event</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Events are time-bound commitments separate from regular tasks.
            </p>

            <form onSubmit={handleSaveEvent} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">Title *</label>
                <Input
                  required
                  placeholder="e.g. Doctor appointment, Interview, Class..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Date</label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Start</label>
                  <Input type="time" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End</label>
                  <Input type="time" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Location</label>
                <Input
                  placeholder="e.g. Room 204 or Clinic"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Input
                  placeholder="Any details or preparation notes..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="alarm-check"
                  checked={eventAlarm}
                  onChange={(e) => setEventAlarm(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="alarm-check" className="text-xs text-foreground cursor-pointer">
                  Set reminder / alarm notification
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEventModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Event</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
