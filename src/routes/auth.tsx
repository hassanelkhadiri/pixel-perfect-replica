import { createFileRoute, redirect, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) throw result.error;
      if (result.redirected) return;
      router.navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-serif text-lg">Agency OS</span>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h1 className="font-serif text-2xl">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your workspace." : "Your first account becomes the Creative Director."}
          </p>

          <button onClick={handleGoogle} disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-secondary px-4 py-2 text-sm hover:bg-secondary/80 disabled:opacity-50">
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="email" required placeholder="you@studio.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <input type="password" required minLength={6} placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            <button type="submit" disabled={busy}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
