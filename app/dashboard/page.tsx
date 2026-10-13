"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task-card";
import { Clock, Flame, TrendingUp, Plus, Play, Target } from "lucide-react";
import { useExecutionData } from "@/contexts/execution-data";

export default function DashboardPage() {
  const { tasks, goals, sessions } = useExecutionData();
  const todayKey = new Date().toISOString().slice(0, 10);
  const activeMainTasks = useMemo(() => tasks.filter((task) => task.isMain && task.status !== "done"), [tasks]);
  const plannedCount = useMemo(() => tasks.filter((task) => task.status === "todo").length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((task) => task.status === "done").length, [tasks]);
  const todayTasks = useMemo(() => tasks.filter((task) => (task.scheduledStart?.slice(0, 10) === todayKey || task.deadline?.slice(0, 10) === todayKey)), [tasks, todayKey]);
  const activeGoals = useMemo(() => goals.filter((goal) => goal.progress < (Number.parseFloat(goal.target) || 1)), [goals]);
  const totalFocusMinutes = useMemo(() => sessions.reduce((acc, session) => acc + session.durationMinutes, 0), [sessions]);
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">What can you realistically commit to today?</p>
          </div>
          <Link href="/tasks">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                <span>Planned Tasks</span>
              </div>
              <div className="text-2xl font-bold">{plannedCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Flame className="w-4 h-4" />
                <span>Active Main Tasks</span>
              </div>
              <div className="text-2xl font-bold">{activeMainTasks.length} / 2</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span>Completion Rate</span>
              </div>
              <div className="text-2xl font-bold">{completionRate}%</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Target className="w-4 h-4" />
                <span>Active Goals</span>
              </div>
              <div className="text-2xl font-bold">{activeGoals.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Focus Mode</h3>
                <p className="text-sm text-muted-foreground">{totalFocusMinutes} minutes logged across {sessions.length} sessions</p>
              </div>
              <Link href="/focus">
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Open Focus
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today's Commitments ({todayTasks.length})</h2>
            <Link href="/">
              <Button variant="ghost" size="sm">Go to Today</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {todayTasks.slice(0, 3).map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
            {todayTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks scheduled or due today.</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Goal Snapshot</h2>
            <Link href="/goals">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {goals.slice(0, 4).map((goal) => (
              <Card key={goal.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{goal.title}</span>
                    <span className="text-sm text-muted-foreground">{goal.progress} / {goal.target}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (goal.progress / (Number.parseFloat(goal.target) || 1)) * 100)}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}