import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center bg-background px-6 py-16 sm:px-12 md:px-24">
      <div className="max-w-xl">
        <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent-soft px-3 py-1 rounded-full">Error 404</span>
        <h1 className="mt-8 text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
          Lost in transit.
        </h1>
        <p className="mt-6 text-base text-muted-foreground leading-relaxed">
          The page you requested—<code className="text-foreground font-mono bg-surface px-1.5 py-0.5 rounded border border-border/80 text-xs">{location.pathname}</code>—doesn’t exist or has been archived to preserve focus.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/">
            <Button size="lg" className="rounded-full px-6 font-medium">
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
            </Button>
          </Link>
          <Button size="lg" variant="ghost" className="rounded-full px-6 font-medium" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
