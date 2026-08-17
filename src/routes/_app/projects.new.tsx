import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createProject, generateBriefInsights } from "@/lib/projects.functions";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/projects/new")({
  component: NewProject,
});

function NewProject() {
  const router = useRouter();
  const createFn = useServerFn(createProject);
  const briefFn = useServerFn(generateBriefInsights);
  const [insights, setInsights] = useState<null | Awaited<ReturnType<typeof briefFn>>>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [form, setForm] = useState({
    client: "", brand: "", campaign: "", platform: "",
    deliverables: "", deadline: "", priority: "medium" as "low"|"medium"|"high"|"urgent",
    objective: "", audience: "", brief: "", notes: "",
    discipline: "designer" as "designer" | "editor",
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await createFn({
        data: {
          ...form,
          deliverables: form.deliverables.split(",").map((s) => s.trim()).filter(Boolean),
          deadline: form.deadline || null,
        },
      });
      return res.projectId;
    },
    onSuccess: async (id) => {
      setProjectId(id);
      toast.success("Project created. Analyzing brief…");
      try {
        const result = await briefFn({ data: { projectId: id } });
        setInsights(result);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "AI analysis failed");
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">New Project</div>
        <h1 className="mt-1 font-serif text-4xl">Kick off a project.</h1>
        <p className="mt-1 text-sm text-muted-foreground">The brief becomes the playbook.</p>
      </div>

      {!projectId ? (
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
          className="space-y-8 rounded-2xl border border-border bg-surface p-6">
          <Section title="Client & Campaign">
            <Grid>
              <Field label="Client *"><Input value={form.client} onChange={(v) => setForm({ ...form, client: v })} required /></Field>
              <Field label="Brand"><Input value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} /></Field>
              <Field label="Campaign"><Input value={form.campaign} onChange={(v) => setForm({ ...form, campaign: v })} /></Field>
              <Field label="Platform"><Input value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} placeholder="Instagram, TikTok, print…" /></Field>
            </Grid>
          </Section>

          <Section title="Scope">
            <Grid>
              <Field label="Discipline">
                <Select value={form.discipline} onChange={(v) => setForm({ ...form, discipline: v as "designer"|"editor" })}
                  options={[{ v: "designer", l: "Designer" }, { v: "editor", l: "Video Editor" }]} />
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}
                  options={[{v:"low",l:"Low"},{v:"medium",l:"Medium"},{v:"high",l:"High"},{v:"urgent",l:"Urgent"}]} />
              </Field>
              <Field label="Deadline"><Input type="date" value={form.deadline} onChange={(v) => setForm({ ...form, deadline: v })} /></Field>
              <Field label="Deliverables (comma-separated)"><Input value={form.deliverables} onChange={(v) => setForm({ ...form, deliverables: v })} placeholder="Hero video, 3 cutdowns, thumbnail" /></Field>
            </Grid>
          </Section>

          <Section title="Strategy">
            <Grid>
              <Field label="Objective"><Textarea value={form.objective} onChange={(v) => setForm({ ...form, objective: v })} rows={2} /></Field>
              <Field label="Audience"><Textarea value={form.audience} onChange={(v) => setForm({ ...form, audience: v })} rows={2} /></Field>
            </Grid>
          </Section>

          <Section title="Creative brief">
            <Field label="Brief *"><Textarea value={form.brief} onChange={(v) => setForm({ ...form, brief: v })} rows={6} required /></Field>
            <Field label="Notes"><Textarea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} rows={3} /></Field>
          </Section>

          <div className="flex items-center justify-end gap-3">
            <button type="submit" disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {create.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <>Create & analyze <Sparkles className="h-4 w-4" /></>}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" /> <span className="text-sm font-medium">AI Creative Director analysis</span>
          </div>
          {!insights ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading the brief…
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Summary</div>
                <p className="mt-1 text-sm">{insights.summary}</p>
              </div>
              <BulletList title="Risks" items={insights.risks} />
              <BulletList title="Open questions" items={insights.questions} />
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Suggested timeline</div>
                <p className="mt-1 text-sm">{insights.suggested_timeline}</p>
              </div>
              <BulletList title="Suggested workflow" items={insights.suggested_workflow} />
              <div className="flex justify-end">
                <button onClick={() => router.navigate({ to: "/projects/$id", params: { id: projectId } })}
                  className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Open project →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-4"><h3 className="font-serif text-lg">{title}</h3>{children}</div>;
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{label}</div>{children}</label>;
}
function Input({ value, onChange, type = "text", required, placeholder }: { value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <input type={type} value={value} required={required} placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />;
}
function Textarea({ value, onChange, rows = 3, required }: { value: string; onChange: (v: string) => void; rows?: number; required?: boolean }) {
  return <textarea value={value} required={required} rows={rows}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: {v:string;l:string}[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
      {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}
