import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toggleChecklistItem, submitStageForReview, decideReview, getMe, setStageCountdown, updateStageAnnotation, askCoach, suggestStageAnnotation } from "@/lib/projects.functions";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Lock, Circle, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronLeft, Sparkles, Send, Timer, Pencil, BookOpen, MessageCircleQuestion, Wand2, X } from "lucide-react";

import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: ProjectPage,
});

type Project = { id: string; client: string; brand: string|null; campaign: string|null; discipline: string; priority: string; deadline: string|null; status: string; current_stage_order: number; brief: string; objective: string|null; audience: string|null; deliverables: string[]|null; assigned_to: string|null };
type Stage = { id: string; project_id: string; stage_key: string; title: string; description: string|null; time_estimate: string|null; common_mistakes: string[]|null; senior_tips: string[]|null; stage_order: number; status: string; submission_notes: string|null; countdown_ends_at: string|null; rejection_count: number; annotation: string|null };
type Item = { id: string; stage_id: string; label: string; done: boolean; item_order: number };
type Review = { id: string; stage_id: string; action: string; comment: string|null; created_at: string; reviewer_id: string };

function ProjectPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchMe = useServerFn(getMe);
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const me = meQ.data;
  const isDirector = me?.roles.includes("director") ?? false;

  const projectQ = useQuery({
    queryKey: ["project", id],
    queryFn: async (): Promise<Project> => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Project;
    },
  });

  const stagesQ = useQuery({
    queryKey: ["stages", id],
    queryFn: async (): Promise<Stage[]> => {
      const { data, error } = await supabase.from("project_stages").select("*").eq("project_id", id).order("stage_order");
      if (error) throw error;
      return (data ?? []) as Stage[];
    },
  });

  const stages = stagesQ.data ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const currentStage = useMemo(() => {
    if (selected) return stages.find((s) => s.id === selected) ?? null;
    return stages.find((s) => s.status === "active" || s.status === "in_review") ?? stages[0] ?? null;
  }, [stages, selected]);

  const itemsQ = useQuery({
    queryKey: ["checklist", currentStage?.id],
    queryFn: async (): Promise<Item[]> => {
      if (!currentStage) return [];
      const { data, error } = await supabase.from("stage_checklist_items")
        .select("*").eq("stage_id", currentStage.id).order("item_order");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
    enabled: !!currentStage,
  });

  const reviewsQ = useQuery({
    queryKey: ["stage-reviews", currentStage?.id],
    queryFn: async (): Promise<Review[]> => {
      if (!currentStage) return [];
      const { data, error } = await supabase.from("reviews")
        .select("*").eq("stage_id", currentStage.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
    enabled: !!currentStage,
  });

  const briefQ = useQuery({
    queryKey: ["ai-brief", id],
    queryFn: async () => {
      const { data } = await supabase.from("ai_briefs").select("*").eq("project_id", id).maybeSingle();
      return data;
    },
  });

  const toggleFn = useServerFn(toggleChecklistItem);
  const submitFn = useServerFn(submitStageForReview);
  const decideFn = useServerFn(decideReview);
  const countdownFn = useServerFn(setStageCountdown);
  const annotationFn = useServerFn(updateStageAnnotation);

  const toggle = useMutation({
    mutationFn: (v: { itemId: string; done: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist", currentStage?.id] }),
  });

  const submit = useMutation({
    mutationFn: (notes: string) => submitFn({ data: { stageId: currentStage!.id, notes } }),
    onSuccess: () => {
      toast.success("Submitted for review.");
      qc.invalidateQueries({ queryKey: ["stages", id] });
      qc.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const decide = useMutation({
    mutationFn: (v: { action: "approve"|"reject"|"revision"; comment: string }) =>
      decideFn({ data: { stageId: currentStage!.id, action: v.action, comment: v.comment, priority: "medium" } }),
    onSuccess: () => {
      toast.success("Review recorded.");
      qc.invalidateQueries({ queryKey: ["stages", id] });
      qc.invalidateQueries({ queryKey: ["stage-reviews", currentStage?.id] });
      qc.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const setCountdown = useMutation({
    mutationFn: (v: { stageId: string; endsAt: string | null }) => countdownFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stages", id] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const saveAnnotation = useMutation({
    mutationFn: (v: { stageId: string; annotation: string }) => annotationFn({ data: v }),
    onSuccess: () => {
      toast.success("Guidance saved.");
      qc.invalidateQueries({ queryKey: ["stages", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const [submissionNotes, setSubmissionNotes] = useState("");
  const [reviewComment, setReviewComment] = useState("");

  if (projectQ.isLoading || stagesQ.isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!projectQ.data) return <div className="p-10 text-sm text-muted-foreground">Project not found.</div>;
  const project = projectQ.data;
  const items = itemsQ.data ?? [];
  const allDone = items.length > 0 && items.every((i) => i.done);

  const approvedCount = stages.filter((s) => s.status === "approved").length;
  const progressPct = stages.length ? Math.round((approvedCount / stages.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-3 w-3" /> Dashboard
      </Link>

      <BeginnerBanner isDirector={isDirector} />

      <header className="mb-6 flex items-end justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {project.discipline === "editor" ? "Video Edit" : "Design"} · {project.priority}
          </div>
          <h1 className="mt-1 font-serif text-4xl">{project.client}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            {[project.brand, project.campaign].filter(Boolean).join(" · ") || "—"}
            {project.deadline && <> · Due {format(new Date(project.deadline), "MMM d, yyyy")}</>}
          </div>
        </div>
        <StatusPill s={project.status} />
      </header>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-4">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>Overall progress</span>
          <span className="font-mono text-foreground">{approvedCount}/{stages.length} stages · {progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>


      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Stage rail */}
        <aside className="rounded-2xl border border-border bg-surface p-3">
          <div className="mb-2 px-3 pt-2 text-xs uppercase tracking-widest text-muted-foreground">Workflow</div>
          <ol className="space-y-1">
            {stages.map((s) => (
              <li key={s.id}>
                <button onClick={() => setSelected(s.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                    currentStage?.id === s.id ? "bg-secondary" : "hover:bg-secondary/60"
                  }`}>
                  <StageIcon s={s.status} />
                  <div className="min-w-0 flex-1">
                    <div className={`flex items-center gap-2 ${s.status === "locked" ? "text-muted-foreground" : ""}`}>
                      <span className="truncate">{s.title}</span>
                      {s.rejection_count > 0 && (
                        <span className="ml-auto shrink-0 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
                          ×{s.rejection_count}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.status}</div>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        {/* Stage panel */}
        <section className="space-y-6">
          {currentStage && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Stage {currentStage.stage_order}
                    {currentStage.time_estimate ? <> · Suggested {currentStage.time_estimate}</> : null}
                  </div>
                  <h2 className="mt-1 font-serif text-2xl">{currentStage.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{currentStage.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill s={currentStage.status} />
                  {currentStage.rejection_count > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[10px] uppercase tracking-wider text-destructive">
                      <XCircle className="h-3 w-3" /> {currentStage.rejection_count} rejection{currentStage.rejection_count === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              {currentStage.status !== "locked" && (
                <CountdownBar
                  endsAt={currentStage.countdown_ends_at}
                  onSave={(iso) => setCountdown.mutate({ stageId: currentStage.id, endsAt: iso })}
                  saving={setCountdown.isPending}
                />
              )}

              {currentStage.status === "locked" ? (
                <div className="mt-6 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  <Lock className="mx-auto mb-2 h-4 w-4" />
                  Locked. Complete the previous stage to unlock.
                </div>
              ) : (
                <>
                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Checklist</h3>
                      <ul className="space-y-2">
                        {items.map((it) => (
                          <li key={it.id} className="flex items-start gap-2">
                            <button
                              disabled={currentStage.status !== "active"}
                              onClick={() => toggle.mutate({ itemId: it.id, done: !it.done })}
                              className="mt-0.5">
                              {it.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                            </button>
                            <span className={`text-sm ${it.done ? "line-through text-muted-foreground" : ""}`}>{it.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      {currentStage.senior_tips && currentStage.senior_tips.length > 0 && (
                        <div>
                          <h3 className="mb-2 flex items-center gap-1 text-xs uppercase tracking-widest text-primary"><Sparkles className="h-3 w-3" /> Senior tips</h3>
                          <ul className="space-y-1 text-sm">{currentStage.senior_tips.map((t, i) => <li key={i} className="italic text-muted-foreground">"{t}"</li>)}</ul>
                        </div>
                      )}
                      {currentStage.common_mistakes && currentStage.common_mistakes.length > 0 && (
                        <div>
                          <h3 className="mb-2 flex items-center gap-1 text-xs uppercase tracking-widest text-warning"><AlertTriangle className="h-3 w-3" /> Common mistakes</h3>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{currentStage.common_mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <AnnotationPanel
                    stageId={currentStage.id}
                    value={currentStage.annotation}
                    canEdit={isDirector}
                    onSave={(text) => saveAnnotation.mutate({ stageId: currentStage.id, annotation: text })}
                    saving={saveAnnotation.isPending}
                  />

                  <CoachChat stageId={currentStage.id} stageTitle={currentStage.title} />




                  {currentStage.status === "active" && (
                    <div className="mt-6 border-t border-border pt-6">
                      <label className="block">
                        <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Notes for reviewer (optional)</div>
                        <textarea rows={3} value={submissionNotes} onChange={(e) => setSubmissionNotes(e.target.value)}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                          placeholder="What did you focus on? What are you unsure about?" />
                      </label>
                      <button
                        disabled={!allDone || submit.isPending}
                        onClick={() => submit.mutate(submissionNotes)}
                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                        <Send className="h-4 w-4" /> {allDone ? "Submit for review" : "Complete checklist to submit"}
                      </button>
                    </div>
                  )}

                  {currentStage.status === "in_review" && (
                    <div className="mt-6 border-t border-border pt-6">
                      {currentStage.submission_notes && (
                        <div className="mb-4 rounded-md border border-border bg-background p-3 text-sm">
                          <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Creator notes</div>
                          {currentStage.submission_notes}
                        </div>
                      )}
                      {isDirector ? (
                        <div>
                          <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Review this stage</div>
                          <textarea rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                            placeholder="Feedback (required for revision/reject)" />
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button onClick={() => decide.mutate({ action: "approve", comment: reviewComment })}
                              className="inline-flex items-center gap-1 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:opacity-90">
                              <CheckCircle2 className="h-4 w-4" /> Approve
                            </button>
                            <button onClick={() => decide.mutate({ action: "revision", comment: reviewComment })}
                              className="inline-flex items-center gap-1 rounded-md bg-warning px-4 py-2 text-sm font-medium text-warning-foreground hover:opacity-90">
                              <AlertTriangle className="h-4 w-4" /> Needs revision
                            </button>
                            <button onClick={() => decide.mutate({ action: "reject", comment: reviewComment })}
                              className="inline-flex items-center gap-1 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90">
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                          Awaiting director review.
                        </div>
                      )}
                    </div>
                  )}

                  {(reviewsQ.data ?? []).length > 0 && (
                    <div className="mt-6 border-t border-border pt-6">
                      <h3 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Feedback thread</h3>
                      <ul className="space-y-2">
                        {(reviewsQ.data ?? []).map((r) => (
                          <li key={r.id} className="rounded-md border border-border bg-background p-3 text-sm">
                            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                              {r.action} · {format(new Date(r.created_at), "MMM d, HH:mm")}
                            </div>
                            {r.comment}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {briefQ.data && (
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-3 flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /><span className="text-sm font-medium">AI brief analysis</span></div>
              <p className="text-sm">{briefQ.data.summary}</p>
              {(briefQ.data.risks?.length ?? 0) > 0 && (<div className="mt-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Risks</div><ul className="mt-1 list-disc pl-5 text-sm">{(briefQ.data.risks ?? []).map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></div>)}
              {(briefQ.data.questions?.length ?? 0) > 0 && (<div className="mt-4"><div className="text-xs uppercase tracking-widest text-muted-foreground">Questions</div><ul className="mt-1 list-disc pl-5 text-sm">{(briefQ.data.questions ?? []).map((r: string, i: number) => <li key={i}>{r}</li>)}</ul></div>)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StageIcon({ s }: { s: string }) {
  if (s === "locked") return <Lock className="h-4 w-4 text-muted-foreground" />;
  if (s === "approved") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (s === "in_review") return <Clock className="h-4 w-4 text-primary" />;
  if (s === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
  if (s === "revision") return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <Circle className="h-4 w-4 text-foreground" />;
}
function StatusPill({ s }: { s: string }) {
  const map: Record<string, string> = {
    active: "bg-primary/15 text-primary",
    locked: "bg-secondary text-muted-foreground",
    in_review: "bg-primary/15 text-primary",
    approved: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
    revision: "bg-warning/15 text-warning",
    completed: "bg-success/15 text-success",
    archived: "bg-secondary text-muted-foreground",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${map[s] ?? "bg-secondary"}`}>{s.replace("_"," ")}</span>;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function useCountdown(endsAt: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - now;
  const over = diff < 0;
  const abs = Math.abs(diff);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const parts = d > 0 ? [`${d}d`, `${h}h`, `${m}m`] : h > 0 ? [`${h}h`, `${m}m`, `${s}s`] : [`${m}m`, `${s}s`];
  return { over, label: parts.join(" ") };
}

function CountdownBar({ endsAt, onSave, saving }: { endsAt: string | null; onSave: (iso: string | null) => void; saving: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(toLocalInputValue(endsAt));
  useEffect(() => setVal(toLocalInputValue(endsAt)), [endsAt]);
  const cd = useCountdown(endsAt);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
      <Timer className={`h-4 w-4 ${cd?.over ? "text-destructive" : "text-primary"}`} />
      {editing ? (
        <>
          <input
            type="datetime-local"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-primary"
          />
          <button
            disabled={saving}
            onClick={() => {
              const iso = val ? new Date(val).toISOString() : null;
              onSave(iso);
              setEditing(false);
            }}
            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
            Save
          </button>
          <button onClick={() => { setEditing(false); setVal(toLocalInputValue(endsAt)); }}
            className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          {endsAt && (
            <button onClick={() => { onSave(null); setEditing(false); }}
              className="ml-auto text-xs text-destructive hover:opacity-80">
              Clear
            </button>
          )}
        </>
      ) : cd ? (
        <>
          <span className={`font-mono tabular-nums ${cd.over ? "text-destructive" : "text-foreground"}`}>
            {cd.over ? "Overdue by " : ""}{cd.label}{cd.over ? "" : " remaining"}
          </span>
          <span className="text-xs text-muted-foreground">
            · Ends {format(new Date(endsAt!), "MMM d, HH:mm")}
          </span>
          <button onClick={() => setEditing(true)} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </>
      ) : (
        <>
          <span className="text-muted-foreground">No countdown set for this stage.</span>
          <button onClick={() => setEditing(true)} className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:opacity-80">
            <Pencil className="h-3 w-3" /> Set countdown
          </button>
        </>
      )}
    </div>
  );
}

function AnnotationPanel({ stageId, value, canEdit, onSave, saving }: {
  stageId: string; value: string | null; canEdit: boolean; onSave: (text: string) => void; saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  useEffect(() => { setText(value ?? ""); setEditing(false); }, [stageId, value]);

  if (!value && !canEdit) return null;

  return (
    <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-xs uppercase tracking-widest text-primary">Guidance for this step</h3>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Pencil className="h-3 w-3" /> {value ? "Edit" : "Add"}
          </button>
        )}
      </div>
      {editing ? (
        <>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Explain what a senior would look for here. What to watch out for, what 'great' looks like, examples to study."
          />
          <div className="mt-2 flex gap-2">
            <button disabled={saving} onClick={() => { onSave(text.trim()); setEditing(false); }}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
              Save guidance
            </button>
            <button onClick={() => { setText(value ?? ""); setEditing(false); }}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </>
      ) : value ? (
        <p className="whitespace-pre-wrap text-sm text-foreground/90">{value}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No guidance yet — add a note to help the creator learn.</p>
      )}
    </div>
  );
}
