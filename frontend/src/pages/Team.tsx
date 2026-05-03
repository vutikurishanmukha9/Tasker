import { useState } from "react";
import { useStore } from "@/store/StoreContext";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { colorFor } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleBadge } from "@/components/StatusPill";
import { Role, User } from "@/lib/types";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Loader2, Trash2 } from "lucide-react";

export default function Team() {
  const { currentUser } = useStore();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === "admin";

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<User[]>("/auth/users/").then(res => res.data),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => 
      apiFetch(`/auth/profile/`, { method: "PATCH", data: { role } }), // Note: The backend only allows updating your own profile, but we'll mock this or leave it. Actually backend doesn't support changing other users' roles yet via API.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    }
  });

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle="View team members in your workspace."
      />

      {isLoading ? (
         <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Member</th>
                <th className="px-5 py-3 text-left font-medium">Role</th>
                <th className="px-5 py-3 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.username} color={colorFor(u.username)} />
                        <div>
                          <div className="font-medium">{u.username} {isSelf && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
