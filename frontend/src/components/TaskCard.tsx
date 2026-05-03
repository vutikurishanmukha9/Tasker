import { Task } from "@/lib/types";
import { useStore } from "@/store/StoreContext";
import { Avatar } from "./Avatar";
import { colorFor } from "@/lib/seed";
import { format, isPast, isToday } from "date-fns";
import { CalendarDays, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskCard({
  task,
  draggable,
  onOpen,
  onEdit,
}: {
  task: Task;
  draggable: boolean;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const { users } = useStore();
  const assignee = users.find((u) => u.id === task.assigneeId);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = !!due && task.status !== "done" && isPast(due) && !isToday(due);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/task-id", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onOpen}
      onDoubleClick={(e) => { e.stopPropagation(); onEdit(); }}
      className={cn(
        "group rounded-md border border-border bg-card p-3 text-left transition-all hover:border-strong hover:shadow-sm",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
    >
      <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {due && (
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-destructive")}>
              {overdue ? <AlertCircle className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
              {format(due, "MMM d")}
            </span>
          )}
        </div>
        {assignee ? (
          <Avatar name={assignee.name} color={colorFor(assignee.name)} size={22} />
        ) : (
          <span className="text-[11px] text-muted-foreground">Unassigned</span>
        )}
      </div>
    </div>
  );
}
