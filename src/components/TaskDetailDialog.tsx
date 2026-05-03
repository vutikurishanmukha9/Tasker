import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/store/StoreContext";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./StatusPill";
import { Avatar } from "./Avatar";
import { colorFor } from "@/lib/seed";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { Calendar, Folder, User as UserIcon, Pencil, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/types";
import { toast } from "sonner";

export function TaskDetailDialog({
  taskId,
  onOpenChange,
  onEdit,
}: {
  taskId: string | null;
  onOpenChange: (v: boolean) => void;
  onEdit: (t: Task) => void;
}) {
  const { tasks, users, projects, deleteTask, currentUser } = useStore();
  const task = tasks.find((t) => t.id === taskId) || null;
  if (!task) return <Dialog open={false} onOpenChange={onOpenChange}><DialogContent /></Dialog>;

  const assignee = users.find((u) => u.id === task.assigneeId);
  const project = projects.find((p) => p.id === task.projectId);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!due && task.status !== "done" && isPast(due) && !isToday(due);
  const canEdit = currentUser?.role === "admin" || task.assigneeId === currentUser?.id;

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
            <p className="text-sm leading-relaxed text-foreground">
              {task.description || <span className="text-muted-foreground">No description.</span>}
            </p>
            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Activity</h4>
              <ol className="relative space-y-3 border-l border-border pl-4">
                {task.activity.slice().reverse().map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-foreground/40" />
                    <p className="text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="space-y-4 text-sm">
            <Detail icon={<Folder className="h-3.5 w-3.5" />} label="Project" value={project?.name ?? "—"} />
            <Detail
              icon={<UserIcon className="h-3.5 w-3.5" />}
              label="Assignee"
              value={
                assignee ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={assignee.name} color={colorFor(assignee.name)} size={20} />
                    {assignee.name}
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
              value={formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
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
                    onClick={() => { deleteTask(task.id); toast.success("Task deleted"); onOpenChange(false); }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
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
