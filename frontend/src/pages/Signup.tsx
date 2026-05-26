import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/StoreContext";
import { AuthShell } from "./Login";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { User, Role } from "@/lib/types";
import { Loader2 } from "lucide-react";

const schema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  password_confirm: z.string().min(8, "At least 8 characters").max(72),
  role: z.enum(["admin", "member"]),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords do not match",
  path: ["password_confirm"],
});

export default function Signup() {
  const { login } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", password_confirm: "", role: "member" as Role });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const map: Record<string, string> = {};
      r.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      return setErrs(map);
    }
    
    setIsLoading(true);
    setErrs({});

    try {
      const res = await apiFetch<{ user: User; tokens: { access: string; refresh: string } }>("/auth/signup/", {
        data: form,
        skipAuth: true,
      });
      
      login(res.data.tokens, res.data.user);
      nav("/app");
    } catch (error: any) {
      setErrs({ submit: error.message || "Failed to create account" });
    } finally {
      setIsLoading(false);
    }
  };

  const field = (k: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type={type}
        placeholder={placeholder}
        value={form[k]}
        onChange={(e) => { setForm({ ...form, [k]: e.target.value }); setErrs({ ...errs, [k]: "" }); }}
        disabled={isLoading}
      />
      {errs[k] && <p className="text-xs text-destructive">{errs[k]}</p>}
    </div>
  );

  return (
    <AuthShell title="Create your workspace" subtitle="Join to start collaborating.">
      <form onSubmit={submit} className="space-y-4">
        {field("username", "Username", "text", "janedoe")}
        {field("email", "Work email", "email", "jane@company.com")}
        
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <Select disabled={isLoading} value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin (Can create projects)</SelectItem>
              <SelectItem value="member">Member (Can work on assigned tasks)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {field("password", "Password", "password", "At least 8 characters")}
        {field("password_confirm", "Confirm Password", "password", "Repeat password")}
        
        {errs.submit && <p className="text-sm font-medium text-destructive">{errs.submit}</p>}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
