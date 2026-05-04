import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskStatus, Project, User } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

const schema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(120),
  description: z.string().trim().max(2000).default(""),
});

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  defaultStatus,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus ?? "todo");
  const [due, setDue] = useState<Date | undefined>();
  const [err, setErr] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<{results: Project[]}>("/projects/").then(res => res.data.results),
    enabled: open,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<{results: User[]}>("/auth/users/").then(res => res.data.results),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/tasks/", { method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task created");
      onOpenChange(false);
    },
    onError: (error: any) => setErr(error.message || "Failed to create task")
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: any }) => apiFetch(`/tasks/${data.id}/`, { method: "PUT", data: data.payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task updated");
      onOpenChange(false);
    },
    onError: (error: any) => setErr(error.message || "Failed to update task")
  });

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setProjectId(task?.project?.toString() ?? defaultProjectId ?? projects?.[0]?.id?.toString() ?? "");
      setAssigneeId(task?.assigned_to?.toString() ?? "");
      setStatus(task?.status ?? defaultStatus ?? "todo");
      setDue(task?.due_date ? new Date(task.due_date) : undefined);
      setErr(null);
    }
  }, [open, task, defaultProjectId, defaultStatus, projects]);

  const submit = () => {
    const r = schema.safeParse({ title, description });
    if (!r.success) return setErr(r.error.issues[0].message);
    if (!projectId) return setErr("Pick a project");
    
    const payload = {
      project: parseInt(projectId),
      title: r.data.title,
      description: r.data.description,
      assigned_to: assigneeId ? parseInt(assigneeId) : null,
      status,
      due_date: due ? format(due, "yyyy-MM-dd") : null,
    };
    
    setErr(null);
    if (task) {
      updateMutation.mutate({ id: task.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t">Title</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Draft homepage copy" disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d">Description</Label>
            <Textarea id="d" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={isLoading || projectsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={projectsLoading ? "Loading..." : "Select project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)} disabled={isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assignee</Label>
              <Select value={assigneeId || "none"} onValueChange={(v) => setAssigneeId(v === "none" ? "" : v)} disabled={isLoading || usersLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={usersLoading ? "Loading..." : "Unassigned"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users?.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.username}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" disabled={isLoading} className={cn("w-full justify-start font-normal", !due && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4" />
                    {due ? format(due, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={due} onSelect={setDue} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {err && <p className="text-xs font-medium text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={submit} disabled={isLoading}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {task ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
