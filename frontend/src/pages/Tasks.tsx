import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock3, ListTodo, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatus, Task, Project } from "@/lib/types";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskCard } from "@/components/TaskCard";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

const COLUMNS: { id: TaskStatus; label: string; icon: typeof ListTodo; hint: string }[] = [
  { id: "todo", label: "To Do", icon: ListTodo, hint: "Ready to start" },
  { id: "in_progress", label: "In Progress", icon: Clock3, hint: "Currently moving" },
  { id: "done", label: "Done", icon: CheckCircle2, hint: "Shipped work" },
];

export default function Tasks() {
  const { currentUser } = useStore();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const isAdmin = currentUser?.role === "admin";

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>("todo");
  const [editing, setEditing] = useState<Task | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<{results: Project[]}>("/projects/").then(res => res.data.results),
  });

  const projectId = params.get("project") ?? projects?.[0]?.id?.toString() ?? "";

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => apiFetch<{results: Task[]}>(`/tasks/?project=${projectId}`).then(res => res.data.results),
    enabled: !!projectId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => 
      apiFetch(`/tasks/${id}/`, { method: "PATCH", data: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  const canMove = (t: Task) =>
    currentUser?.role === "admin" || t.assigned_to === currentUser?.id;

  const onDrop = (status: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id");
    const task = tasks?.find((t) => t.id.toString() === id);
    if (!task || !canMove(task) || task.status === status) return;
    updateStatusMutation.mutate({ id: task.id, status });
  };

  if (projectsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tasks" subtitle="Drag cards across stages to update status." />
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Drag cards across stages to update status."
        actions={
          <>
            <Select
              value={projectId}
              onValueChange={(v) => { params.set("project", v); setParams(params, { replace: true }); }}
            >
              <SelectTrigger className="w-56"><SelectValue placeholder="Select Project" /></SelectTrigger>
              <SelectContent>
                {projects?.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button onClick={() => { setEditing(null); setDialogStatus("todo"); setDialogOpen(true); }} disabled={!projectId}>
                <Plus className="h-4 w-4" /> New task
              </Button>
            )}
          </>
        }
      />

      {tasksLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((c) => {
            const items = tasks?.filter((t) => t.status === c.id) || [];
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onDragOver={(e) => { e.preventDefault(); setDragOver(c.id); }}
                onDragLeave={() => setDragOver((d) => (d === c.id ? null : d))}
                onDrop={(e) => onDrop(c.id, e)}
                className={cn(
                  "flex min-h-[520px] flex-col rounded-lg border bg-surface/80 transition-colors",
                  dragOver === c.id ? "border-accent bg-accent-soft/40" : "border-border",
                )}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/70">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-background text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="block text-sm font-semibold">{c.label}</span>
                      <span className="text-xs text-muted-foreground">{c.hint}</span>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {items.length}
                    </span>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!projectId}
                      onClick={() => { setEditing(null); setDialogStatus(c.id); setDialogOpen(true); }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-3 min-h-[120px]">
                  {items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      draggable={canMove(t)}
                      onOpen={() => setDetailId(t.id)}
                      onEdit={() => { setEditing(t); setDialogOpen(true); }}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultProjectId={projectId}
        defaultStatus={dialogStatus}
      />
      <TaskDetailDialog taskId={detailId} onOpenChange={(v) => !v && setDetailId(null)} onEdit={(t) => { setEditing(t); setDialogOpen(true); }} />
    </div>
  );
}
