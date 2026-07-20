import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers, GitBranch, Sparkles, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-chart-5/10 blur-[120px]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-serif text-lg">Agency OS</span>
        </div>
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          The operating system for creative teams
        </div>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Work like a <em>senior creative</em>,<br />from the first project.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
          Creative Agency OS turns every brief into a guided workflow — with review gates,
          AI coaching, and quality checks the whole team already trusts.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link to="/auth"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: Layers, title: "Locked workflow stages", body: "Brief → Research → Moodboard → Design. No skipping. Every stage teaches what senior creatives already know." },
          { icon: ShieldCheck, title: "Review gates that stick", body: "Directors approve, reject, or request revisions with structured feedback — nothing ships uninspected." },
          { icon: GitBranch, title: "AI creative coach", body: "Every project gets an instant AI brief analysis: risks, open questions, and a suggested timeline." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-surface p-6">
            <f.icon className="mb-4 h-5 w-5 text-primary" />
            <div className="font-medium">{f.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built for creative directors, designers, and editors.
      </footer>
    </div>
  );
}
