import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./StatusPill";
import { Avatar } from "./Avatar";
import { colorFor } from "@/lib/seed";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { Calendar, Folder, User as UserIcon, Pencil, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task, Project, User } from "@/lib/types";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function TaskDetailDialog({
  taskId,
  onOpenChange,
  onEdit,
}: {
  taskId: number | null;
  onOpenChange: (v: boolean) => void;
  onEdit: (t: Task) => void;
}) {
  const { currentUser } = useStore();
  const queryClient = useQueryClient();

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => apiFetch<Task>(`/tasks/${taskId}/`).then(res => res.data),
    enabled: !!taskId,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<{results: Project[]}>("/projects/").then(res => res.data.results),
    enabled: !!taskId,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<{results: User[]}>("/auth/users/").then(res => res.data.results),
    enabled: !!taskId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/tasks/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete task");
    }
  });

  if (!taskId) return <Dialog open={false} onOpenChange={onOpenChange}><DialogContent /></Dialog>;

  if (taskLoading || !task) {
    return (
      <Dialog open={!!taskId} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </DialogContent>
      </Dialog>
    );
  }

  const assignee = users?.find((u) => u.id === task.assigned_to);
  const project = projects?.find((p) => p.id === task.project);
  const due = task.due_date ? new Date(task.due_date) : null;
  const overdue = !!due && task.status !== "done" && isPast(due) && !isToday(due);
  const canEdit = currentUser?.role === "admin" || task.assigned_to === currentUser?.id;

  return (
    <Dialog open={!!taskId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-lg">{task.title}</DialogTitle>
            <StatusPill status={task.status} />
          </div>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-4">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {task.description || <span className="text-muted-foreground">No description.</span>}
            </p>
            {/* Temporary removal of local activity log until we add an activity endpoint */}
          </div>
          <div className="space-y-4 text-sm">
            <Detail icon={<Folder className="h-3.5 w-3.5" />} label="Project" value={project?.name ?? "—"} />
            <Detail
              icon={<UserIcon className="h-3.5 w-3.5" />}
              label="Assignee"
              value={
                assignee ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={assignee.username} color={colorFor(assignee.username)} size={20} />
                    {assignee.username}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )
              }
            />
            <Detail
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Due"
              value={
                due ? (
                  <span className={cn("inline-flex items-center gap-1", overdue && "text-destructive")}>
                    {overdue && <AlertCircle className="h-3.5 w-3.5" />}
                    {format(due, "PPP")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No due date</span>
                )
              }
            />
            <Detail
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Created"
              value={formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            />

            {canEdit && (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { onEdit(task); onOpenChange(false); }}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                {currentUser?.role === "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(task.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
