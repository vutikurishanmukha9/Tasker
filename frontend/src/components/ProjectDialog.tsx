import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/StoreContext";
import { Project } from "@/lib/types";
import { Avatar } from "./Avatar";
import { colorFor } from "@/lib/seed";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(400).default(""),
});

export function ProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: Project | null;
}) {
  const { users, addProject, updateProject } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setMemberIds(project?.memberIds ?? []);
      setErr(null);
    }
  }, [open, project]);

  const toggle = (id: string) =>
    setMemberIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = () => {
    const r = schema.safeParse({ name, description });
    if (!r.success) return setErr(r.error.issues[0].message);
    if (project) {
      updateProject(project.id, { name: r.data.name, description: r.data.description, memberIds });
      toast.success("Project updated");
    } else {
      addProject({ name: r.data.name, description: r.data.description, memberIds });
      toast.success("Project created");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Relaunch" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdesc">Description</Label>
            <Textarea id="pdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Team members</Label>
            <div className="grid max-h-48 gap-1 overflow-auto rounded-md border border-border p-1">
              {users.map((u) => {
                const active = memberIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                      active && "bg-muted",
                    )}
                  >
                    <Avatar name={u.name} color={colorFor(u.name)} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{u.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    {active && <Check className="h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>{project ? "Save changes" : "Create project"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
