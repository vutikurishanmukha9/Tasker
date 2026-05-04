import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Project, User } from "@/lib/types";
import { Avatar } from "./Avatar";
import { colorFor } from "@/lib/seed";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

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
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<{results: User[]}>("/auth/users/").then(res => res.data.results),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string; team_members: number[] }) =>
      apiFetch("/projects/", { method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      onOpenChange(false);
    },
    onError: (error: any) => setErr(error.message || "Failed to create project")
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: { name: string; description: string; team_members: number[] } }) =>
      apiFetch(`/projects/${data.id}/`, { method: "PUT", data: data.payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
      onOpenChange(false);
    },
    onError: (error: any) => setErr(error.message || "Failed to update project")
  });

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setDescription(project?.description ?? "");
      setMemberIds(project?.team_members?.map(m => m.id) ?? []);
      setErr(null);
    }
  }, [open, project]);

  const toggle = (id: number) =>
    setMemberIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = () => {
    const r = schema.safeParse({ name, description });
    if (!r.success) return setErr(r.error.issues[0].message);
    
    setErr(null);
    if (project) {
      updateMutation.mutate({ id: project.id, payload: { name: r.data.name, description: r.data.description, team_members: memberIds } });
    } else {
      createMutation.mutate({ name: r.data.name, description: r.data.description, team_members: memberIds });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Relaunch" disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pdesc">Description</Label>
            <Textarea id="pdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
          </div>
          <div className="space-y-1.5">
            <Label>Team members</Label>
            <div className="grid max-h-48 gap-1 overflow-auto rounded-md border border-border p-1">
              {usersLoading ? (
                 <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground h-5 w-5" /></div>
              ) : users?.map((u) => {
                const active = memberIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    disabled={isLoading}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                      active && "bg-muted",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Avatar name={u.username} color={colorFor(u.username)} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{u.username}</div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    {active && <Check className="h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
          {err && <p className="text-xs font-medium text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={submit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {project ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
