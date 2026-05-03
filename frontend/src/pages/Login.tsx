import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreContext";
import { CheckSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { User } from "@/lib/types";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ email, password });
    if (!r.success) return setErr(r.error.issues[0].message);
    
    setIsLoading(true);
    setErr(null);

    try {
      const res = await apiFetch<{ user: User; tokens: { access: string; refresh: string } }>("/auth/login/", {
        data: { email, password },
        skipAuth: true,
      });
      
      login(res.data.tokens, res.data.user);
      toast.success("Signed in successfully");
      nav("/app");
    } catch (error: any) {
      setErr(error.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in to Tasker">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErr(null); }}
            placeholder="you@company.com"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErr(null); }}
            disabled={isLoading}
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Tasker</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="hidden border-l border-border surface lg:block">
        <div className="flex h-full items-center justify-center p-12">
          <div className="max-w-sm">
            <blockquote className="text-lg font-medium leading-snug text-foreground">
              “Switching to Tasker felt like turning down the volume on our work. Everything became calmer and faster.”
            </blockquote>
            <div className="mt-5 text-sm text-muted-foreground">Mara Chen · Head of Product, Northwind</div>
          </div>
        </div>
      </div>
    </div>
  );
}
