import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckSquare, ArrowRight, KanbanSquare, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Tasker</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-accent" /> New · Project boards
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              Plan projects. Track tasks. Ship together.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Tasker is a calm, fast workspace for product teams. Organize work,
              assign owners, and keep momentum without the noise.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">Sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {[
            { icon: KanbanSquare, title: "Kanban boards", body: "Drag cards across stages with frictionless updates." },
            { icon: Users, title: "Team roles", body: "Admins manage, members focus. Clear, structured access." },
            { icon: BarChart3, title: "Real progress", body: "See completion, overdue work, and momentum at a glance." },
          ].map((f) => (
            <div key={f.title} className="bg-card p-8">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Tasker</span>
          <span>Built for teams who ship.</span>
        </div>
      </footer>
    </div>
  );
}
