import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/projects.functions";
import { ArrowRight, Clock, Flag, Sparkles, CheckCircle2, GitPullRequest } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Project = {
  id: string; client: string; brand: string | null; campaign: string | null;
  status: string; priority: string; discipline: string; deadline: string | null;
  current_stage_order: number; assigned_to: string | null; created_by: string;
  updated_at: string;
};
type Stage = { id: string; project_id: string; title: string; stage_order: number; status: string; submitted_at: string | null };
type Review = { id: string; comment: string | null; action: string; created_at: string; stage_id: string };

function Dashboard() {
  const fetchMe = useServerFn(getMe);
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const me = meQ.data;

  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase.from("projects")
        .select("id,client,brand,campaign,status,priority,discipline,deadline,current_stage_order,assigned_to,created_by,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  const stagesQ = useQuery({
    queryKey: ["active-stages"],
    queryFn: async (): Promise<Stage[]> => {
      const { data, error } = await supabase.from("project_stages")
        .select("id,project_id,title,stage_order,status,submitted_at")
        .in("status", ["active","in_review"])
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Stage[];
    },
  });

  const reviewsQ = useQuery({
    queryKey: ["recent-reviews"],
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase.from("reviews")
        .select("id,comment,action,created_at,stage_id")
        .order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const isDirector = me?.roles.includes("director") ?? false;
  const projects = projectsQ.data ?? [];
  const activeProjects = projects.filter((p) => p.status === "active");
  const completed = projects.filter((p) => p.status === "completed").length;
  const stages = stagesQ.data ?? [];
  const inReview = stages.filter((s) => s.status === "in_review");
  const myActive = stages.filter((s) => {
    const p = projects.find((pp) => pp.id === s.project_id);
    return s.status === "active" && p && (p.assigned_to === me?.userId || p.created_by === me?.userId);
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</div>
          <h1 className="mt-1 font-serif text-4xl">
            Hello, {me?.profile?.display_name ?? "creative"}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDirector ? "You're leading the studio." : "Here's what needs your craft today."}
          </p>
        </div>
        {isDirector && (
          <Link to="/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            New project <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active projects" value={activeProjects.length} icon={<Sparkles className="h-4 w-4" />} />
        <Stat label="In review" value={inReview.length} icon={<GitPullRequest className="h-4 w-4" />} />
        <Stat label="My stages" value={myActive.length} icon={<Clock className="h-4 w-4" />} />
        <Stat label="Completed" value={completed} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl">Active projects</h2>
            <span className="text-xs text-muted-foreground">{activeProjects.length} total</span>
          </div>
          {projectsQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : activeProjects.length === 0 ? (
            <EmptyState label={isDirector ? "Create your first project to get started." : "You'll see assigned projects here."} />
          ) : (
            <ul className="divide-y divide-border">
              {activeProjects.map((p) => (
                <li key={p.id}>
                  <Link to="/projects/$id" params={{ id: p.id }}
                    className="flex items-center justify-between py-3 hover:bg-secondary/40 -mx-2 px-2 rounded-md">
                    <div>
                      <div className="font-medium">{p.client} <span className="text-muted-foreground">· {p.brand ?? p.campaign ?? p.discipline}</span></div>
                      <div className="text-xs text-muted-foreground">
                        Stage {p.current_stage_order} · {p.deadline ? `Due ${format(new Date(p.deadline), "MMM d")}` : "No deadline"}
                      </div>
                    </div>
                    <PriorityBadge p={p.priority} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-serif text-xl">Waiting for review</h2>
          {inReview.length === 0 ? (
            <EmptyState label="Nothing waiting." />
          ) : (
            <ul className="space-y-2">
              {inReview.map((s) => {
                const p = projects.find((pp) => pp.id === s.project_id);
                return (
                  <li key={s.id}>
                    <Link to="/projects/$id" params={{ id: s.project_id }}
                      className="block rounded-md border border-border bg-background p-3 text-sm hover:border-primary">
                      <div className="font-medium">{s.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {p?.client} · submitted {s.submitted_at ? formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true }) : ""}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="mb-4 font-serif text-xl">Today's stages</h2>
          {myActive.length === 0 ? (
            <EmptyState label="No active stages assigned to you." />
          ) : (
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {myActive.map((s) => {
                const p = projects.find((pp) => pp.id === s.project_id);
                return (
                  <li key={s.id}>
                    <Link to="/projects/$id" params={{ id: s.project_id }}
                      className="block rounded-md border border-border bg-background p-3 text-sm hover:border-primary">
                      <div className="font-medium">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{p?.client}</div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-serif text-xl">Recent feedback</h2>
          {(reviewsQ.data ?? []).length === 0 ? (
            <EmptyState label="No feedback yet." />
          ) : (
            <ul className="space-y-2">
              {(reviewsQ.data ?? []).map((r) => (
                <li key={r.id} className="rounded-md border border-border bg-background p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ActionChip a={r.action} />
                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                  </div>
                  {r.comment && <div className="mt-1 text-sm">{r.comment}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
        {label} {icon}
      </div>
      <div className="mt-2 font-serif text-3xl">{value}</div>
    </div>
  );
}
function EmptyState({ label }: { label: string }) {
  return <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{label}</div>;
}
function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    low: "text-muted-foreground border-border",
    medium: "text-foreground border-border",
    high: "text-warning border-warning/30",
    urgent: "text-destructive border-destructive/30",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[p] ?? map.medium}`}><Flag className="h-3 w-3" />{p}</span>;
}
function ActionChip({ a }: { a: string }) {
  const map: Record<string, string> = {
    approve: "bg-success/15 text-success",
    reject: "bg-destructive/15 text-destructive",
    revision: "bg-warning/15 text-warning",
    comment: "bg-secondary text-muted-foreground",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[a] ?? ""}`}>{a}</span>;
}
