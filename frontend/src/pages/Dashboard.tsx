import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";
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
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
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
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">To Do</span>
                  <span className="tabular-nums text-muted-foreground">{tasks_by_status.todo}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-foreground/20" style={{ width: `${total_tasks ? (tasks_by_status.todo / total_tasks) * 100 : 0}%` }} />
                </div>
              </div>
              
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">In Progress</span>
                  <span className="tabular-nums text-muted-foreground">{tasks_by_status.in_progress}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${total_tasks ? (tasks_by_status.in_progress / total_tasks) * 100 : 0}%` }} />
                </div>
              </div>
              
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Done</span>
                  <span className="tabular-nums text-muted-foreground">{tasks_by_status.done}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-accent" style={{ width: `${total_tasks ? (tasks_by_status.done / total_tasks) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
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
