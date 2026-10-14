export type Priority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done";
export type DailySection = "main" | "supporting" | "easy";

export type MasterTask = {
  id: string;
  userId: string;
  title: string;
  expectedOutcome: string;
  firstAction: string;
  priority: Priority;
  predictedDifficulty: number; // 1-10
  expectedDuration: number; // minutes
  scheduledDate: string | null; // YYYY-MM-DD
  scheduledTime: string | null; // HH:MM:SS
  deadline: string | null; // ISO timestamp
  hasAlarm: boolean;
  alarmTime: string | null;
  alarmSetConfirmed: boolean;
  description: string;
  notes: string;
  goalId: string | null;
  progress: number; // 0-100
  // WOOP
  wish: string;
  outcome: string;
  obstacle: string;
  plan: string;
  status: TaskStatus;
  recurrenceId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
};

export type TaskOccurrence = {
  id: string;
  userId: string;
  taskId: string;
  scheduledDate: string; // YYYY-MM-DD
  dailySection: DailySection;
  dailySortOrder: number;
  status: TaskStatus;
  progress: number;
  actualDifficulty: number | null;
  actualMinutes: number | null;
  completedAt: string | null;
  completionNotes: string | null;
  nextActionScheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FiveMinuteTask = {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  targetTime: string | null;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type RecurrenceRule = {
  id: string;
  userId: string;
  frequency: "daily" | "weekly" | "selected_days" | "monthly" | "interval_days";
  weekdays: number[]; // 0=Sunday... 6=Saturday
  monthDay: number | null;
  intervalDays: number;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEvent = {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string | null;
  location: string;
  description: string;
  reminderMinutesBefore: number;
  hasAlarm: boolean;
  alarmSetConfirmed: boolean;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  createdAt: string;
  updatedAt: string;
};

export type FocusSession = {
  id: string;
  userId: string;
  taskId: string | null;
  occurrenceId: string | null;
  taskTitle: string;
  workGrade: number; // 0-4
  intendedDuration: number; // minutes
  actualDuration: number; // minutes
  startedAt: string;
  endedAt: string;
  status: "completed" | "interrupted" | "extended";
  actualDifficulty: number | null;
  interruptionReason?: string;
  reflection?: string;
  createdAt: string;
};

export type BreakSession = {
  id: string;
  userId: string;
  focusSessionId: string | null;
  durationMinutes: number;
  startedAt: string;
  endedAt: string;
  createdAt: string;
};

export type PersonalObservation = {
  id: string;
  userId: string;
  type: "what_works" | "what_doesnt_work";
  title: string;
  points: string[];
  category: string;
  status: "active" | "testing" | "retired";
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type JournalSubcategory = {
  id: string;
  userId: string;
  category: "learnings" | "behaviour" | "problems" | "purpose";
  name: string;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  userId: string;
  category: "learnings" | "behaviour" | "problems" | "purpose";
  subcategoryId: string | null;
  title: string;
  points: string[];
  isPinned: boolean;
  quoteSource?: string;
  context?: string;
  problemTriggers?: string;
  problemWhatHelped?: string;
  problemCurrentApproach?: string;
  visualizationFuture?: string;
  visualizationNextStep?: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Goal = {
  id: string;
  userId: string;
  title: string;
  desiredOutcome: string;
  measurementMethod: "numeric" | "boolean" | "milestone";
  targetValue: string;
  currentProgress: number;
  startDate: string | null;
  deadline: string | null;
  whyItMatters: string;
  nextSteps: string;
  status: "active" | "completed" | "paused" | "archived";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Standard = {
  id: string;
  userId: string;
  name: string;
  rule: string;
  whyItExists: string;
  practicalImplementation: string;
  whenItApplies: string;
  status: "active" | "paused";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = {
  userId: string;
  timezone: string;
  currentWorkGrade: number;
  breakDurationMinutes: number;
  alarmSoundEnabled: boolean;
  dailyMainLimit: number;
};
