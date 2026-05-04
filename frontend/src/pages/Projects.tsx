import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Trash2, Pencil, Users, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function Projects() {
  const { currentUser } = useStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const isAdmin = currentUser?.role === "admin";

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<{results: Project[]}>("/projects/").then(res => res.data.results),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/projects/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete project");
    }
  });

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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p) => {
            const members = p.team_members || [];
            return (
              <div key={p.id} className="group relative rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-strong hover:shadow-md">
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
                          onClick={() => deleteMutation.mutate(p.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 rounded-md bg-surface p-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      Members
                    </div>
                    <p className="mt-1 font-semibold tabular-nums">{members.length}</p>
                  </div>
                  <Link to={`/app/tasks?project=${p.id}`} className="flex items-center justify-end gap-1 font-medium text-accent-soft-foreground hover:text-accent">
                    Board
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex -space-x-1.5">
                    {members.slice(0, 4).map((m) => (
                      <Avatar key={m.id} name={m.username} color={colorFor(m.username)} size={24} className="ring-2 ring-card" />
                    ))}
                    {members.length > 4 && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
                        +{members.length - 4}
                      </span>
                    )}
                    {members.length === 0 && (
                      <span className="text-xs text-muted-foreground">No members</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {projects?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
              No projects found.
            </div>
          )}
        </div>
      )}

      <ProjectDialog open={open} onOpenChange={setOpen} project={editing} />
    </div>
  );
}
