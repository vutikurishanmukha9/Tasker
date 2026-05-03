import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { colorFor } from "@/lib/seed";
import { ProjectDialog } from "@/components/ProjectDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Project } from "@/lib/types";
import { toast } from "sonner";

export default function Projects() {
  const { projects, tasks, users, currentUser, deleteProject } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const isAdmin = currentUser?.role === "admin";

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="All initiatives across your workspace."
        actions={
          isAdmin && (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const pt = tasks.filter((t) => t.projectId === p.id);
          const pd = pt.filter((t) => t.status === "done").length;
          const pct = pt.length === 0 ? 0 : Math.round((pd / pt.length) * 100);
          const members = users.filter((u) => p.memberIds.includes(u.id));
          return (
            <div key={p.id} className="group relative rounded-lg border border-border bg-card p-5 transition-colors hover:border-strong">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/app/tasks?project=${p.id}`} className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                </Link>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditing(p); setOpen(true); }}>
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => { deleteProject(p.id); toast.success("Project deleted"); }}
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="tabular-nums">{pd}/{pt.length}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} name={m.name} color={colorFor(m.name)} size={24} className="ring-2 ring-card" />
                  ))}
                  {members.length > 4 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
                      +{members.length - 4}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{pt.length} tasks</span>
              </div>
            </div>
          );
        })}
      </div>

      <ProjectDialog open={open} onOpenChange={setOpen} project={editing} />
    </div>
  );
}
