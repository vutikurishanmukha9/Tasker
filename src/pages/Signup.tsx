import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreContext";
import { AuthShell } from "./Login";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export default function Signup() {
  const { signup } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const map: Record<string, string> = {};
      r.error.issues.forEach((i) => (map[i.path[0] as string] = i.message));
      return setErrs(map);
    }
    signup(form.name.trim(), form.email.trim());
    toast.success("Welcome to Tasker");
    nav("/app");
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
      />
      {errs[k] && <p className="text-xs text-destructive">{errs[k]}</p>}
    </div>
  );

  return (
    <AuthShell title="Create your workspace" subtitle="Free during beta. No credit card required.">
      <form onSubmit={submit} className="space-y-4">
        {field("name", "Full name", "text", "Jane Cooper")}
        {field("email", "Work email", "email", "jane@company.com")}
        {field("password", "Password", "password", "At least 8 characters")}
        <Button type="submit" className="w-full">Create account</Button>
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
