import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/StoreContext";
import { Task, TaskStatus } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toast } from "sonner";

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
  const { projects, users, addTask, updateTask } = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId ?? projects[0]?.id ?? "");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus ?? "todo");
  const [due, setDue] = useState<Date | undefined>();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setProjectId(task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "");
      setAssigneeId(task?.assigneeId ?? "");
      setStatus(task?.status ?? defaultStatus ?? "todo");
      setDue(task?.dueDate ? new Date(task.dueDate) : undefined);
      setErr(null);
    }
  }, [open, task, defaultProjectId, defaultStatus, projects]);

  const submit = () => {
    const r = schema.safeParse({ title, description });
    if (!r.success) return setErr(r.error.issues[0].message);
    if (!projectId) return setErr("Pick a project");
    const payload = {
      projectId,
      title: r.data.title,
      description: r.data.description,
      assigneeId: assigneeId || null,
      status,
      dueDate: due ? due.toISOString() : null,
    };
    if (task) {
      updateTask(task.id, payload, "Task updated");
      toast.success("Task updated");
    } else {
      addTask(payload);
      toast.success("Task created");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t">Title</Label>
            <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Draft homepage copy" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d">Description</Label>
            <Textarea id="d" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
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
              <Select value={assigneeId || "none"} onValueChange={(v) => setAssigneeId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start font-normal", !due && "text-muted-foreground")}>
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
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{task ? "Save changes" : "Create task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
