import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreContext";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

export default function Login() {
  const { login } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState("alex@acme.co");
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ email });
    if (!r.success) return setErr(r.error.issues[0].message);
    if (!login(email)) {
      setErr("No account with that email. Try signing up.");
      return;
    }
    toast.success("Signed in");
    nav("/app");
  };

  return (
    <AuthShell title="Sign in to Tasker" subtitle="Use one of the seeded accounts to explore.">
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
          />
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
        <Button type="submit" className="w-full">Continue</Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <div className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">
          Demo accounts: <span className="font-medium text-foreground">alex@acme.co</span> (admin),{" "}
          <span className="font-medium text-foreground">priya@acme.co</span> (member)
        </div>
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
