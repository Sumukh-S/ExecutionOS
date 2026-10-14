"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Sun,
  Sunrise,
  CheckSquare,
  Clock,
  Archive,
  CheckCircle2,
  Calendar,
  Timer,
  Target,
  CalendarDays,
  CalendarRange,
  Sparkles,
  BookMarked,
  ShieldCheck,
  BarChart2,
  Menu,
  Moon,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme";
import { useAuth } from "@/contexts/auth";
import { SyncStatusIndicator } from "@/components/sync-status-indicator";
import { AuthDialog } from "@/components/auth-dialog";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/tomorrow", label: "Tomorrow", icon: Sunrise },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/backlogs", label: "Backlogs", icon: Archive },
  { href: "/done", label: "Done", icon: CheckCircle2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/weekly", label: "Weekly", icon: CalendarDays },
  { href: "/monthly", label: "Monthly", icon: CalendarRange },
  { href: "/insights", label: "What Works", icon: Sparkles },
  { href: "/journal", label: "Journal", icon: BookMarked },
  { href: "/standards", label: "Standards", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

const mobileQuickNav = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/tomorrow", label: "Tomorrow", icon: Sunrise },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/focus", label: "Focus", icon: Timer },
];

export function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

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
          "fixed right-0 top-0 bottom-0 z-50 flex w-[min(22rem,85vw)] flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        )}
        aria-label="Navigation drawer"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Execution OS</p>
            <h2 className="text-lg font-bold text-foreground">Menu</h2>
          </div>
          <div className="flex items-center gap-2">
            <SyncStatusIndicator />
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
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href === "/today" && pathname === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4 bg-card/50 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl h-11 text-sm font-medium"
            onClick={() => {
              setDrawerOpen(false);
              setAuthOpen(true);
            }}
          >
            <User className="h-4 w-4 text-primary" />
            <span className="truncate">{user ? user.email : "Sign In to Cloud"}</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-xl h-11 text-sm font-medium"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
        </div>
      </aside>

      {/* 3. Bottom Quick Nav for Smartphones & Tablets */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/85 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:hidden"
        aria-label="Quick mobile navigation"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-center px-1 py-1">
          {mobileQuickNav.map((item) => {
            const active = pathname === item.href || (item.href === "/today" && pathname === "/");
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

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open full menu"
            className="flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground hover:text-foreground active:scale-90"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* 4. Desktop Top/Floating Navigation Bar (>=1024px) */}
      <header className="sticky top-0 z-40 hidden w-full border-b border-border/80 bg-background/85 backdrop-blur-xl lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm shadow-md shadow-primary/30">
                EX
              </span>
              <span className="text-base font-semibold">Execution OS</span>
            </Link>

            <nav className="flex items-center gap-1">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/today", label: "Today" },
                { href: "/tomorrow", label: "Tomorrow" },
                { href: "/tasks", label: "Tasks" },
                { href: "/backlogs", label: "Backlogs" },
                { href: "/done", label: "Done" },
                { href: "/calendar", label: "Calendar" },
                { href: "/focus", label: "Focus" },
                { href: "/goals", label: "Goals" },
                { href: "/journal", label: "Journal" },
                { href: "/standards", label: "Standards" },
                { href: "/insights", label: "What Works" },
                { href: "/analytics", label: "Analytics" },
              ].map((item) => {
                const active = pathname === item.href || (item.href === "/today" && pathname === "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <SyncStatusIndicator />

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-lg text-xs"
              onClick={() => setAuthOpen(true)}
            >
              <User className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-[120px] truncate">{user ? user.email?.split("@")[0] : "Account"}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Auth Dialog */}
      <AuthDialog isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
