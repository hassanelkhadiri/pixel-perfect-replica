import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FolderPlus, Sparkles } from "lucide-react";
import { useViewRole } from "@/lib/use-role";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const location = useLocation();
  const { role, setRole, isDirector } = useViewRole();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isDirector ? [{ to: "/projects/new", label: "New Project", icon: FolderPlus }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex">
          <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="font-serif text-base leading-none">Agency OS</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Creative</div>
            </div>
          </Link>
          <nav className="flex flex-col gap-1">
            {navItems.map((n) => {
              const active = location.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to} to={n.to}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
            <div className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground">View as</div>
            <div className="flex gap-1 rounded-md bg-secondary/50 p-1">
              {(["director", "creative"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded px-2 py-1.5 text-xs capitalize transition-colors ${
                    role === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </aside>
        <main className="min-h-screen w-full lg:pl-60">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
