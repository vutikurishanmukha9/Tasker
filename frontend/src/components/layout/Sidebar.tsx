import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, ListChecks, Users, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/tasks", label: "Tasks", icon: ListChecks },
  { to: "/app/team", label: "Team", icon: Users },
];

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CheckSquare className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Tasker</span>
      </div>
      <nav className="flex-1 px-2 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {items.map((it) => {
            const active = it.end ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  end={it.end}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-5 py-3 text-xs text-muted-foreground border-t border-sidebar-border">
        v1.0 · All systems normal
      </div>
    </aside>
  );
}
