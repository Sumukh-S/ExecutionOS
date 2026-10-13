"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarRange,
  CheckSquare2,
  Home,
  Menu,
  Moon,
  Target,
  Timer,
  X,
  Sun,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme";

const allNavItems = [
  { href: "/", label: "Today", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/weekly", label: "Weekly", icon: CalendarRange },
  { href: "/monthly", label: "Monthly", icon: CalendarRange },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/eisenhower", label: "Eisenhower", icon: Layers },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/standards", label: "Standards", icon: BookOpen },
];

const mobileNavItems = [
  { href: "/", label: "Today", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/focus", label: "Focus", icon: Timer },
];

export function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* 1. Backdrop for Mobile/Tablet Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* 2. Slide-out Navigation Drawer for Smartphones & Tablets */}
      <aside
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 flex w-[min(22rem,85vw)] flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out nav-water lg:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
        aria-label="Mobile and tablet navigation drawer"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Execution OS</p>
            <h2 className="text-lg font-bold text-foreground">Menu</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {allNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex min-h-12 items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 bg-card/50">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl h-11 text-sm font-medium"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
            {theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
          </Button>
        </div>
      </aside>

      {/* 3. Bottom Navigation Bar for Tablets & Smartphones (<1024px) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/85 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden"
        aria-label="Quick mobile navigation"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-center px-1 py-1">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-all active:scale-90",
                  active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 transition-transform", active ? "scale-110" : "")} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Trigger Drawer for All Other Pages & Tools on Tablets/Phones */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open full menu"
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-90"
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* 4. Large Screen Floating Watery Dock Navbar (>=1024px) */}
      <nav
        className="fixed bottom-6 left-1/2 z-50 hidden -translate-x-1/2 items-center lg:flex"
        aria-label="Desktop floating navigation dock"
      >
        <div className="watery-dock group/dock flex items-center gap-1.5 rounded-full border border-border/70 p-2 backdrop-blur-2xl transition-all duration-500 ease-out hover:scale-105 hover:p-2.5 hover:shadow-2xl">
          {allNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-110",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 font-semibold"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 transition-transform duration-300" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}

          <div className="mx-1 h-5 w-px bg-border/80" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:text-foreground"
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
          </Button>
        </div>
      </nav>
    </>
  );
}
