"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const pages: Record<string, { title: string; description: string }> = {
  "/": { title: "Today", description: "Your specific tasks, schedule, priorities, and outcomes for today." },
  "/tasks": { title: "Tasks", description: "Define, schedule, prioritize, complete, and review your tasks." },
  "/calendar": { title: "Calendar", description: "See your exact task times and deadlines in one calendar." },
  "/weekly": { title: "Weekly Plan", description: "Connect this week's tasks to your weekly goals." },
  "/monthly": { title: "Monthly Plan", description: "Keep monthly commitments connected to your bigger goals." },
  "/goals": { title: "Goals", description: "Turn long-term direction into monthly and weekly goals." },
  "/eisenhower": { title: "Eisenhower Matrix", description: "Automatically organize tasks by priority and deadline urgency." },
  "/focus": { title: "Focus", description: "Run a focused work session with a clear time boundary." },
  "/empty": { title: "Empty State", description: "A calm starting point for a new execution system." },
};

export function PageMeta() {
  const pathname = usePathname();
  useEffect(() => {
    const page = pages[pathname] ?? { title: "Execution OS", description: "A focused personal execution and productivity system." };
    // Only set the document title. React/Next.js own the <head> nodes, so we
    // must never manually remove or create <meta>/<title> elements here.
    document.title = `${page.title} · Execution OS`;
  }, [pathname]);
  return null;
}
