import { useState } from "react";
import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { colorFor } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleBadge } from "@/components/StatusPill";
import { Role } from "@/lib/types";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
});

export default function Team() {
  const { users, currentUser, addUser, updateUserRole, removeUser, tasks } = useStore();
  const isAdmin = currentUser?.role === "admin";

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "member" as Role });
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const r = schema.safeParse(form);
    if (!r.success) return setErr(r.error.issues[0].message);
    if (users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      return setErr("That email is already on the team");
    }
    addUser({ name: r.data.name, email: r.data.email, role: form.role });
    toast.success("Member added");
    setOpen(false);
    setForm({ name: "", email: "", role: "member" });
    setErr(null);
  };

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="Manage who has access and what they can do."
        actions={
          isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4" /> Add member</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="n">Full name</Label>
                    <Input id="n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e">Email</Label>
                    <Input id="e" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {err && <p className="text-xs text-destructive">{err}</p>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={submit}>Add member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Member</th>
              <th className="px-5 py-3 text-left font-medium">Role</th>
              <th className="px-5 py-3 text-left font-medium">Open tasks</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const open = tasks.filter((t) => t.assigneeId === u.id && t.status !== "done").length;
              const isSelf = currentUser?.id === u.id;
              return (
                <tr key={u.id} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} color={colorFor(u.name)} />
                      <div>
                        <div className="font-medium">{u.name} {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {isAdmin && !isSelf ? (
                      <Select value={u.role} onValueChange={(v) => updateUserRole(u.id, v as Role)}>
                        <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <RoleBadge role={u.role} />
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{open}</td>
                  <td className="px-5 py-3 text-right">
                    {isAdmin && !isSelf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => { removeUser(u.id); toast.success("Member removed"); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
