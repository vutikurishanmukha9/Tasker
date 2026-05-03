import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatus, Task } from "@/lib/types";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskCard } from "@/components/TaskCard";
import { TaskDetailDialog } from "@/components/TaskDetailDialog";
import { cn } from "@/lib/utils";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

export default function Tasks() {
  const { projects, tasks, currentUser, setTaskStatus } = useStore();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("project") ?? projects[0]?.id ?? "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<TaskStatus>("todo");
  const [editing, setEditing] = useState<Task | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const visible = tasks.filter((t) => t.projectId === projectId);

  const canMove = (t: Task) =>
    currentUser?.role === "admin" || t.assigneeId === currentUser?.id;

  const onDrop = (status: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/task-id");
    const task = tasks.find((t) => t.id === id);
    if (!task || !canMove(task) || task.status === status) return;
    setTaskStatus(id, status);
  };

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
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => { setEditing(null); setDialogStatus("todo"); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((c) => {
          const items = visible.filter((t) => t.status === c.id);
          return (
            <div
              key={c.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(c.id); }}
              onDragLeave={() => setDragOver((d) => (d === c.id ? null : d))}
              onDrop={(e) => onDrop(c.id, e)}
              className={cn(
                "flex flex-col rounded-lg border bg-surface transition-colors",
                dragOver === c.id ? "border-accent" : "border-border",
              )}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setEditing(null); setDialogStatus(c.id); setDialogOpen(true); }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
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
