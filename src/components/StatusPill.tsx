import { cn } from "@/lib/utils";
import { TaskStatus } from "@/lib/types";

const map: Record<TaskStatus, { label: string; cls: string }> = {
  todo: { label: "To Do", cls: "bg-muted text-muted-foreground border-border" },
  in_progress: { label: "In Progress", cls: "bg-info-soft text-info-soft-foreground border-transparent" },
  done: { label: "Done", cls: "bg-accent-soft text-accent-soft-foreground border-transparent" },
};

export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        m.cls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </span>
  );
}

export function RoleBadge({ role }: { role: "admin" | "member" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        role === "admin"
          ? "border-transparent bg-accent-soft text-accent-soft-foreground"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {role === "admin" ? "Admin" : "Member"}
    </span>
  );
}
