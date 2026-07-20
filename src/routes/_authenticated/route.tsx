import { createFileRoute, redirect, Outlet, Link, useRouter, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, FolderPlus, Sparkles, LogOut } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const router = useRouter();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fetchMe = useServerFn(getMe);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });

  const roles = me?.roles ?? [];
  const isDirector = roles.includes("director");

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

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
            <div className="px-2">
              <div className="text-sm font-medium">{me?.profile?.display_name ?? "You"}</div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {roles.join(" · ") || "member"}
              </div>
            </div>
            <button onClick={signOut} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>
        <main className="min-h-screen w-full lg:pl-60">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
