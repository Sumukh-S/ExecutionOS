"use client";

import { Download, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtilityPage } from "@/components/utility-page";
import { useExecutionData } from "@/contexts/execution-data";

export default function BackupPage() {
  const { tasks, goals, sessions, quickTasks, restoreData } = useExecutionData();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const exportData = () => {
    setError("");
    const backupPayload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      tasks,
      goals,
      sessions,
      quickTasks,
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `execution-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`Backup downloaded (${tasks.length} tasks, ${goals.length} goals, ${sessions.length} sessions, ${quickTasks.length} quick tasks).`);
  };

  const handleImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setMessage("");
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Invalid JSON structure");
        }
        restoreData(
          {
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : undefined,
            goals: Array.isArray(parsed.goals) ? parsed.goals : undefined,
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : undefined,
            quickTasks: Array.isArray(parsed.quickTasks) ? parsed.quickTasks : undefined,
          },
          "merge"
        );
        setMessage("Backup successfully restored and merged without duplicates.");
      } catch (err) {
        setError(`Failed to parse backup file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <UtilityPage title="Backup" description="Keep a portable copy of your execution system.">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Data portability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={exportData}>
              <Download className="mr-2 h-4 w-4" />Export backup
            </Button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              <Upload className="mr-2 h-4 w-4" />Import backup file
              <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Imports preserve your existing records and merge imported records safely by ID.
          </p>
        </CardContent>
      </Card>
      {message && (
        <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mt-4">
          <CheckCircle2 className="h-4 w-4" />{message}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mt-4">
          <AlertCircle className="h-4 w-4" />{error}
        </p>
      )}
    </UtilityPage>
  );
}
