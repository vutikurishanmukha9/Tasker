import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckSquare, ArrowRight, KanbanSquare, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">Tasker</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 bg-surface border border-border/80 rounded-full px-1 py-1">
            <Link to="/" className="px-4 py-1.5 text-xs font-medium text-foreground bg-card border border-border/60 rounded-full shadow-sm">Home</Link>
            <a href="#features" className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>

          <nav className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-xs font-medium">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4">
                Get started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border/60 bg-gradient-to-b from-surface to-background">
        <div className="mx-auto max-w-6xl px-6 py-28 md:py-36">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent-soft px-3.5 py-1 text-xs font-medium text-accent-soft-foreground">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> New: Dynamic Project Boards
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl leading-tight">
              Plan projects.<br />Track tasks.<br />
              <span className="text-accent underline decoration-accent/30 decoration-wavy decoration-2 underline-offset-8">Ship together.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Tasker is a quiet, hyper-focused digital workspace built specifically for high-momentum product teams. Clean UI, snappy interactions, zero noise.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-6 font-medium">
                  Start free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-full px-6 font-medium">Sign in</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Large Spotlight feature (Bento grid span 2) */}
          <div className="bg-card border border-border/80 rounded-2xl p-8 md:col-span-2 flex flex-col justify-between overflow-hidden relative group">
            <div className="max-w-md">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-accent-soft text-accent">
                <KanbanSquare className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-foreground">Interactive Kanban Boards</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag cards across custom progress columns. Assign owners, set priority levels, and keep momentum fluid without friction.
              </p>
            </div>
            {/* Visual simulation of Kanban column */}
            <div className="mt-8 border border-border/60 bg-surface/50 rounded-xl p-4 flex gap-3 select-none">
              <div className="flex-1 bg-card border border-border/80 rounded-lg p-3 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider">In Progress</span>
                <span className="block text-xs font-semibold mt-1">Refactor Design System</span>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-muted-foreground">Today</span>
                  <div className="h-4 w-4 rounded-full bg-accent text-[9px] text-accent-foreground font-bold flex items-center justify-center">M</div>
                </div>
              </div>
              <div className="flex-1 bg-card border border-border/80 rounded-lg p-3 shadow-sm opacity-60 hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Done</span>
                <span className="block text-xs font-semibold mt-1">Audit Codebase</span>
              </div>
            </div>
          </div>

          {/* Card 2: Stacked feature 1 */}
          <div className="bg-card border border-border/80 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-info-soft text-info">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">Granular Workspace Roles</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Admins orchestrate plans and projects, while members stay focused on delivering work with distraction-free interfaces.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <span>Setup roles</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          {/* Card 3: Stacked feature 2 */}
          <div className="bg-card border border-border/80 rounded-2xl p-8 flex flex-col justify-between md:col-span-1">
            <div>
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-warning-soft text-warning">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">Workspace Health & Progress</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Monitor team completion metrics, identify past-due items, and protect your shipping velocity using live insight dashboards.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <span>View analytics</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between text-xs text-muted-foreground">
            <div className="space-y-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <CheckSquare className="h-3 w-3" />
                </div>
                <span className="text-sm font-bold tracking-tight text-foreground">Tasker</span>
              </Link>
              <p className="text-[11px] max-w-xs text-muted-foreground/80 leading-relaxed">
                Quiet software for teams who value velocity and aesthetic restraint over distraction and feature bloat.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <a href="#about" className="hover:text-foreground transition-colors">About</a>
              <a href="#terms" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[11px] text-muted-foreground/60">
            <span>© {new Date().getFullYear()} Tasker Inc. All rights reserved.</span>
            <span>Designed with typographic restraint and visual balance.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
