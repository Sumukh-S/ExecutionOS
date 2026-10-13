"use client";

import { useState, type FormEvent } from "react";
import { X, LogIn, UserPlus, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

export function AuthDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signIn, signUp, signInWithOAuth, signOut } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSignoutWarning, setShowSignoutWarning] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (isSignUp) {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      const { error: authErr } = isSignUp
        ? await signUp(email, password, { data: { full_name: fullName.trim() } })
        : await signIn(email, password);

      if (authErr) {
        setError(authErr.message);
      } else {
        if (isSignUp) {
          setNotice("Account created! Check your email to confirm if required.");
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { error: authErr } = await signInWithOAuth(provider);
      if (authErr) setError(authErr.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      setShowSignoutWarning(false);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {user ? "Account & Sync" : isSignUp ? "Create Account" : "Sign In to Sync"}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent border border-border/40"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {user ? (
          <div className="space-y-4 pt-4">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-xs space-y-1">
              <p className="text-muted-foreground">Connected Account</p>
              <p className="font-semibold text-foreground break-all">{user.email}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Your tasks and execution records sync securely between your devices using Supabase.
            </p>

            {showSignoutWarning ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Sign out notice</span>
                </div>
                <p>
                  Any unsynchronized pending mutations will remain securely on this device. Sign in again on this device to resume syncing.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="ghost" onClick={() => setShowSignoutWarning(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleSignOut} disabled={loading}>
                    Confirm Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowSignoutWarning(true)}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {/* OAuth in dialog */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 justify-center gap-2 rounded-xl text-xs font-medium border-border"
                onClick={() => handleOAuth("google")}
                disabled={loading}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 justify-center gap-2 rounded-xl text-xs font-medium border-border"
                onClick={() => handleOAuth("github")}
                disabled={loading}
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Continue with GitHub</span>
              </Button>
            </div>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">or email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {error}
                </div>
              )}
              {notice && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-300">
                  {notice}
                </div>
              )}

              {isSignUp && (
                <label className="block text-xs font-medium text-foreground">
                  Full Name
                  <input
                    type="text"
                    required
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </label>
              )}

              <label className="block text-xs font-medium text-foreground">
                Email
                <input
                  type="email"
                  required
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </label>

              <label className="block text-xs font-medium text-foreground">
                Password
                <input
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>

              {isSignUp && (
                <label className="block text-xs font-medium text-foreground">
                  Confirm Password
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-xs"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </label>
              )}

              <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
                {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-xs text-primary underline hover:text-primary/80"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setNotice(null);
                  }}
                >
                  {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
