"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, signIn, signUp, signInWithOAuth } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Authenticating Execution OS...
          </p>
        </div>
      </div>
    );
  }

  // Once user is authenticated, render application content
  if (user) {
    return <>{children}</>;
  }

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
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error: signErr } = await signUp(email, password, {
          data: { full_name: fullName.trim() },
        });
        if (signErr) {
          setError(signErr.message);
        } else {
          setNotice("Account created! If confirmation is required, check your email to activate.");
        }
      } else {
        const { error: signErr } = await signIn(email, password);
        if (signErr) {
          setError(signErr.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    setNotice(null);
    setOauthLoading(provider);
    try {
      const { error: authErr } = await signInWithOAuth(provider);
      if (authErr) {
        setError(authErr.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth sign-in failed");
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center space-y-1.5 pb-5 border-b border-border">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Execution OS</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isSignUp ? "Create Secure Account" : "Sign In to Access"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Your tasks, focus history, and goals are encrypted and permanently isolated to your account.
          </p>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {notice && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="mt-5 space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 justify-center gap-2.5 rounded-xl text-xs font-medium border-border hover:bg-accent"
            onClick={() => handleOAuth("google")}
            disabled={submitting || oauthLoading !== null}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{oauthLoading === "google" ? "Connecting to Google..." : "Continue with Google"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 justify-center gap-2.5 rounded-xl text-xs font-medium border-border hover:bg-accent"
            onClick={() => handleOAuth("github")}
            disabled={submitting || oauthLoading !== null}
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>{oauthLoading === "github" ? "Connecting to GitHub..." : "Continue with GitHub"}</span>
          </Button>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-semibold tracking-wider">or with email</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <label className="block text-xs font-medium text-foreground">
              Full Name
              <input
                type="text"
                required
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </label>
          )}

          <label className="block text-xs font-medium text-foreground">
            Email address
            <input
              type="email"
              required
              className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </label>

          <label className="block text-xs font-medium text-foreground">
            Password
            <input
              type="password"
              required
              minLength={6}
              className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
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
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
          )}

          <Button type="submit" className="w-full h-11 gap-2 rounded-xl mt-4 text-xs font-semibold shadow-md shadow-primary/20" disabled={submitting}>
            {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {submitting ? "Authenticating..." : isSignUp ? "Create Account" : "Sign In to Execution OS"}
          </Button>

          <div className="text-center pt-3 border-t border-border/70 mt-4">
            <button
              type="button"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1.5 mx-auto"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setNotice(null);
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up with Name & Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
