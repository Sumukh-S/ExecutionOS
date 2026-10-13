"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  className?: string;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const variants = {
    default: "inline-flex items-center gap-1.5 rounded border bg-background px-3 py-1.5 text-sm text-foreground",
    secondary: "inline-flex items-center gap-1.5 rounded border border-border bg-card text-card-foreground px-3 py-1.5 text-sm",
    destructive: "inline-flex items-center gap-1.5 rounded bg-destructive px-3 py-1.5 text-sm text-destructive-foreground",
    outline: "inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-foreground",
    ghost: "inline-flex items-center gap-1.5 rounded bg-transparent px-3 py-1.5 text-sm text-muted-foreground",
  };

  return <span className={cn(variants[variant], className)} {...props} />;
}