import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Trash2, Pencil, Loader2 } from "lucide-react";
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
    queryFn: () => apiFetch<Project[]>("/projects/").then(res => res.data),
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
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((p) => {
            const members = p.team_members || [];
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
                          onClick={() => deleteMutation.mutate(p.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-4">
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

      {/* Temporary disable ProjectDialog until we rewrite it for React Query */}
      {/* <ProjectDialog open={open} onOpenChange={setOpen} project={editing} /> */}
    </div>
  );
}
