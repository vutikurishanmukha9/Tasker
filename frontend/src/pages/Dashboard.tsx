import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { colorFor } from "@/lib/seed";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { tasks, users, projects } = useStore();
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.filter((t) => t.status !== "done").length;
  const overdue = tasks.filter(
    (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate).getTime() < Date.now(),
  ).length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);

  const recent = [...tasks]
    .flatMap((t) => t.activity.map((a) => ({ ...a, task: t })))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A quick overview of your team's work." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total tasks" value={total} icon={<ListTodo className="h-4 w-4" />} />
        <Stat label="Completed" value={done} icon={<CheckCircle2 className="h-4 w-4 text-accent" />} />
        <Stat label="Pending" value={pending} icon={<Clock className="h-4 w-4" />} />
        <Stat
          label="Overdue"
          value={overdue}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          tone={overdue > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Completion</h2>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">{completion}%</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-accent transition-all" style={{ width: `${completion}%` }} />
          </div>

          <div className="mt-8 space-y-4">
            {projects.map((p) => {
              const pt = tasks.filter((t) => t.projectId === p.id);
              const pd = pt.filter((t) => t.status === "done").length;
              const pct = pt.length === 0 ? 0 : Math.round((pd / pt.length) * 100);
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{pd}/{pt.length}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground/80" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Activity</h2>
          <ul className="mt-4 space-y-4">
            {recent.map((a) => {
              const u = users.find((x) => x.id === a.task.assigneeId);
              return (
                <li key={a.id} className="flex gap-3">
                  {u ? (
                    <Avatar name={u.name} color={colorFor(u.name)} size={28} />
                  ) : (
                    <span className="h-7 w-7 shrink-0 rounded-full bg-muted" />
                  )}
                  <div className="min-w-0 text-sm">
                    <p className="text-foreground">
                      <span className="font-medium">{a.text}</span>{" "}
                      <span className="text-muted-foreground">on</span>{" "}
                      <span className="font-medium">{a.task.title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              );
            })}
            {recent.length === 0 && <li className="text-sm text-muted-foreground">No activity yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className={cn("mt-3 text-3xl font-semibold tabular-nums", tone === "danger" && value > 0 && "text-destructive")}>
        {value}
      </div>
    </div>
  );
}
