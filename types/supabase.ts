export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profile: {
        Row: {
          id: string;
          email: string;
          avatar_url: string | null;
          birthday: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          avatar_url?: string | null;
          birthday?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          avatar_url?: string | null;
          birthday?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      list: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          sort_order: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          sort_order: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          color?: string;
          sort_order?: number;
          is_default?: boolean;
          created_at?: string;
        };
      };
      task: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          list_id: string | null;
          icon: string;
          priority: "low" | "medium" | "high" | "urgent";
          status: "todo" | "in_progress" | "done";
          difficulty: number | null;
          expected_duration_minutes: number | null;
          deadline: string | null;
          scheduled_start: string | null;
          scheduled_end: string | null;
          scheduled_date: string | null;
          outcome: string | null;
          why: string | null;
          scope: string | null;
          first_action: string | null;
          done_criteria: string | null;
          minimum: string | null;
          target: string | null;
          stop_condition: string | null;
          perceived_difficulty: number | null;
          perceived_duration_minutes: number | null;
          goal_id: string | null;
          weekly_goal_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          list_id?: string | null;
          icon?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "todo" | "in_progress" | "done";
          difficulty?: number | null;
          expected_duration_minutes?: number | null;
          deadline?: string | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          scheduled_date?: string | null;
          outcome?: string | null;
          why?: string | null;
          scope?: string | null;
          first_action?: string | null;
          done_criteria?: string | null;
          minimum?: string | null;
          target?: string | null;
          stop_condition?: string | null;
          perceived_difficulty?: number | null;
          perceived_duration_minutes?: number | null;
          goal_id?: string | null;
          weekly_goal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          list_id?: string | null;
          icon?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "todo" | "in_progress" | "done";
          difficulty?: number | null;
          expected_duration_minutes?: number | null;
          deadline?: string | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          scheduled_date?: string | null;
          outcome?: string | null;
          why?: string | null;
          scope?: string | null;
          first_action?: string | null;
          done_criteria?: string | null;
          minimum?: string | null;
          target?: string | null;
          stop_condition?: string | null;
          perceived_difficulty?: number | null;
          perceived_duration_minutes?: number | null;
          goal_id?: string | null;
          weekly_goal_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_scope_items: {
        Row: {
          id: string;
          task_id: string;
          name: string;
          completed: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          name: string;
          completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          name?: string;
          completed?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      task_reminders: {
        Row: {
          id: string;
          task_id: string;
          type: "start" | "deadline" | "custom";
          offset_minutes: number;
          custom_datetime: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          type: "start" | "deadline" | "custom";
          offset_minutes: number;
          custom_datetime?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          type?: "start" | "deadline" | "custom";
          offset_minutes?: number;
          custom_datetime?: string | null;
          created_at?: string;
        };
      };
      recurring_task: {
        Row: {
          id: string;
          task_id: string;
          frequency: "daily" | "weekdays" | "weekly" | "monthly" | "custom";
          custom_days: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          frequency: "daily" | "weekdays" | "weekly" | "monthly" | "custom";
          custom_days?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          frequency?: "daily" | "weekdays" | "weekly" | "monthly" | "custom";
          custom_days?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      task_occurrence: {
        Row: {
          id: string;
          recurring_task_id: string;
          task_id: string;
          occurrence_date: string;
          status: "pending" | "in_progress" | "done";
          created_at: string;
        };
        Insert: {
          id?: string;
          recurring_task_id: string;
          task_id: string;
          occurrence_date: string;
          status?: "pending" | "in_progress" | "done";
          created_at?: string;
        };
        Update: {
          id?: string;
          recurring_task_id?: string;
          task_id?: string;
          occurrence_date?: string;
          status?: "pending" | "in_progress" | "done";
          created_at?: string;
        };
      };
      task_execution: {
        Row: {
          id: string;
          task_id: string;
          occurred_at: string;
          actual_difficulty: number | null;
          actual_duration_minutes: number | null;
          execution_reliability: number | null;
          focus_level: number | null;
          energy_level: number | null;
          friction: string | null;
          lessons: string | null;
          notes: string | null;
          estimated_time_minutes: number | null;
          actual_start_time: string | null;
          actual_end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          occurred_at?: string;
          actual_difficulty?: number | null;
          actual_duration_minutes?: number | null;
          execution_reliability?: number | null;
          focus_level?: number | null;
          energy_level?: number | null;
          friction?: string | null;
          lessons?: string | null;
          notes?: string | null;
          estimated_time_minutes?: number | null;
          actual_start_time?: string | null;
          actual_end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          occurred_at?: string;
          actual_difficulty?: number | null;
          actual_duration_minutes?: number | null;
          execution_reliability?: number | null;
          focus_level?: number | null;
          energy_level?: number | null;
          friction?: string | null;
          lessons?: string | null;
          notes?: string | null;
          estimated_time_minutes?: number | null;
          actual_start_time?: string | null;
          actual_end_time?: string | null;
          created_at?: string;
        };
      };
      list_member: {
        Row: {
          id: string;
          task_id: string;
          list_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          list_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          list_id?: string;
          created_at?: string;
        };
      };
      goal: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          type: "longterm" | "monthly" | "weekly";
          parent_goal_id: string | null;
          start_date: string;
          end_date: string;
          target: number;
          unit: string;
          priority: "low" | "medium" | "high" | "urgent";
          status: "active" | "completed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          type: "longterm" | "monthly" | "weekly";
          parent_goal_id?: string | null;
          start_date: string;
          end_date: string;
          target: number;
          unit?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          type?: "longterm" | "monthly" | "weekly";
          parent_goal_id?: string | null;
          start_date?: string;
          end_date?: string;
          target?: number;
          unit?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
      };
      weekly_goal: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          title: string;
          description: string | null;
          target: number;
          current: number;
          unit: string;
          priority: "low" | "medium" | "high" | "urgent";
          status: "active" | "completed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          title: string;
          description?: string | null;
          target: number;
          current?: number;
          unit?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          title?: string;
          description?: string | null;
          target?: number;
          current?: number;
          unit?: string;
          priority?: "low" | "medium" | "high" | "urgent";
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
      };
      goal_task_link: {
        Row: {
          id: string;
          goal_id: string;
          task_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          task_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          task_id?: string;
          created_at?: string;
        };
      };
      habit: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          name: string;
          icon: string;
          color: string;
          frequency: "daily" | "weekly" | "monthly";
          target_count: number;
          completed_dates: string[];
          current_streak: number;
          longest_streak: number;
          last_completed_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          name: string;
          icon: string;
          color: string;
          frequency?: "daily" | "weekly" | "monthly";
          target_count?: number;
          completed_dates?: string[];
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          name?: string;
          icon?: string;
          color?: string;
          frequency?: "daily" | "weekly" | "monthly";
          target_count?: number;
          completed_dates?: string[];
          current_streak?: number;
          longest_streak?: number;
          last_completed_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      habit_completions: {
        Row: {
          id: string;
          habit_id: string;
          completed_at: string;
          quality: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          habit_id: string;
          completed_at?: string;
          quality?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          habit_id?: string;
          completed_at?: string;
          quality?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      standard: {
        Row: {
          id: string;
          user_id: string;
          group: string;
          text: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group: string;
          text: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          group?: string;
          text?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      countdown: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_date: string;
          icon: string;
          color: string;
          is_birthday: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_date: string;
          icon: string;
          color: string;
          is_birthday?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_date?: string;
          icon?: string;
          color?: string;
          is_birthday?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      focus_session: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          title: string;
          scheduled_minutes: number;
          completed_minutes: number;
          status: "planned" | "in_progress" | "completed" | "abandoned";
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          title: string;
          scheduled_minutes: number;
          completed_minutes?: number;
          status?: "planned" | "in_progress" | "completed" | "abandoned";
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          title?: string;
          scheduled_minutes?: number;
          completed_minutes?: number;
          status?: "planned" | "in_progress" | "completed" | "abandoned";
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      google_drive_connection: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      backup_record: {
        Row: {
          id: string;
          user_id: string;
          drive_file_id: string | null;
          backup_date: string;
          item_counts: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          drive_file_id?: string | null;
          backup_date: string;
          item_counts?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          drive_file_id?: string | null;
          backup_date: string;
          item_counts?: Json;
          created_at?: string;
        };
      };
      weekly_review: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          tasks_completed: number;
          execution_reliability: number | null;
          efficiency_score: number | null;
          weekly_goals_completed: number;
          weekly_goals_total: number;
          longest_streak: number | null;
          time_estimation_error_percent: number | null;
          main_friction: string | null;
          changes_for_next_week: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          tasks_completed?: number;
          execution_reliability?: number | null;
          efficiency_score?: number | null;
          weekly_goals_completed?: number;
          weekly_goals_total?: number;
          longest_streak?: number | null;
          time_estimation_error_percent?: number | null;
          main_friction?: string | null;
          changes_for_next_week?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          tasks_completed?: number;
          execution_reliability?: number | null;
          efficiency_score?: number | null;
          weekly_goals_completed?: number;
          weekly_goals_total?: number;
          longest_streak?: number | null;
          time_estimation_error_percent?: number | null;
          main_friction?: string | null;
          changes_for_next_week?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          focus_pomodoro_minutes: number;
          focus_break_minutes: number;
          study_music_url: string | null;
          study_discord_url: string | null;
          focus_resources_shown: boolean;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          focus_pomodoro_minutes?: number;
          focus_break_minutes?: number;
          study_music_url?: string | null;
          study_discord_url?: string | null;
          focus_resources_shown?: boolean;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          focus_pomodoro_minutes?: number;
          focus_break_minutes?: number;
          study_music_url?: string | null;
          study_discord_url?: string | null;
          focus_resources_shown?: boolean;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      calculate_execution_reliability: {
        Args: { difficulty: number; execution: number };
        Returns: number;
      };
      eisenhower_quadrant: {
        Args: { priority: string; deadline: string };
        Returns: string;
      };
    };
    Enums: {
      _gap: never[];
    };
  };
}
