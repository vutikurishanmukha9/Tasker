import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle2, Clock, AlertTriangle, ListTodo, ArrowRight, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { DashboardData } from "@/lib/types";

export default function Dashboard() {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/dashboard/").then(res => res.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="A quick overview of your team's work." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-[350px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-destructive">
        Failed to load dashboard data.
      </div>
    );
  }

  const { total_tasks, completed_tasks, pending_tasks, overdue_tasks, tasks_by_status } = dashboard;
  const completion = total_tasks === 0 ? 0 : Math.round((completed_tasks / total_tasks) * 100);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A quick overview of your team's work." />

      <section className="mb-6 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-soft-foreground">
              <Activity className="h-3.5 w-3.5" />
              Workspace health
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              {completion >= 75 ? "Work is moving cleanly." : overdue_tasks > 0 ? "A few items need attention." : "Plenty of work is in flight."}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {completed_tasks} of {total_tasks} tasks are complete, with {pending_tasks} still active across the board.
            </p>
          </div>
          <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-md border border-border bg-surface p-3">
            <div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{completion}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Needs review</p>
              <p className={cn("mt-1 text-2xl font-semibold tabular-nums", overdue_tasks > 0 && "text-destructive")}>{overdue_tasks}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total tasks" value={total_tasks} icon={<ListTodo className="h-4 w-4" />} />
        <Stat label="Completed" value={completed_tasks} icon={<CheckCircle2 className="h-4 w-4 text-accent" />} />
        <Stat label="Pending" value={pending_tasks} icon={<Clock className="h-4 w-4" />} />
        <Stat
          label="Overdue"
          value={overdue_tasks}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          tone={overdue_tasks > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Completion</h2>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">{completion}%</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-accent transition-all" style={{ width: `${completion}%` }} />
          </div>
          
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Task Breakdown</h3>
            <div className="space-y-4">
              <BreakdownRow label="To Do" value={tasks_by_status.todo} total={total_tasks} className="bg-foreground/20" />
              <BreakdownRow label="In Progress" value={tasks_by_status.in_progress} total={total_tasks} className="bg-info" />
              <BreakdownRow label="Done" value={tasks_by_status.done} total={total_tasks} className="bg-accent" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="text-sm font-semibold">Next best move</h2>
          <div className="mt-5 space-y-4">
            <Insight label="Finish queued work" value={tasks_by_status.todo} detail="Tasks waiting to be picked up" />
            <Insight label="Protect momentum" value={tasks_by_status.in_progress} detail="Tasks currently active" />
            <Insight label="Clear blockers" value={overdue_tasks} detail="Past due tasks to resolve" danger={overdue_tasks > 0} />
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-md bg-surface p-3 text-sm text-muted-foreground">
            <ArrowRight className="h-4 w-4 text-accent" />
            Prioritize overdue work before starting new tasks.
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, total, className }: { label: string; value: number; total: number; className: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", className)} style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

function Insight({ label, value, detail, danger }: { label: string; value: number; detail: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className={cn("text-lg font-semibold tabular-nums", danger && "text-destructive")}>{value}</span>
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
