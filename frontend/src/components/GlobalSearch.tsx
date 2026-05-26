import { useState, useEffect } from "react";
import { Search, Folder, CheckSquare, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, fetchAllPages } from "@/lib/api";
import { Project, Task, User } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch all data for client-side search
  // Note: This is a pragmatic client-side aggregation suitable for small-medium datasets.
  // For production scale, this should be replaced with a dedicated backend /search endpoint
  // to avoid fetching all records to the client.
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiFetch<{results: Project[]}>("/projects/").then(res => res.data.results),
  });

  const { data: tasks } = useQuery({
    queryKey: ["all_tasks"],
    queryFn: () => fetchAllPages<Task>("/tasks/"),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<{results: User[]}>("/auth/users/").then(res => res.data.results),
  });

  const q = query.toLowerCase();
  
  const matchedProjects = q ? projects?.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) || [] : [];
  const matchedTasks = q ? tasks?.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) || [] : [];
  const matchedUsers = q ? users?.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) || [] : [];

  const hasResults = matchedProjects.length > 0 || matchedTasks.length > 0 || matchedUsers.length > 0;

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest(".global-search-container")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const navigateTo = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative max-w-md flex-1 global-search-container">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input 
        placeholder="Search tasks, projects, people…" 
        className="h-9 pl-8 bg-surface border-border" 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query && setOpen(true)}
      />

      {open && query && (
        <div className="absolute top-full mt-2 w-full max-h-[400px] overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md p-2 z-50">
          {!hasResults ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
          ) : (
            <div className="space-y-4">
              {matchedProjects.length > 0 && (
                <div>
                  <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">Projects</h3>
                  {matchedProjects.slice(0, 3).map(p => (
                    <button 
                      key={p.id} 
                      className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                      onClick={() => navigateTo(`/app/projects`)}
                    >
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {matchedTasks.length > 0 && (
                <div>
                  <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">Tasks</h3>
                  {matchedTasks.slice(0, 5).map(t => (
                    <button 
                      key={t.id} 
                      className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                      onClick={() => navigateTo(`/app/tasks?project=${t.project}`)}
                    >
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {matchedUsers.length > 0 && (
                <div>
                  <h3 className="mb-1 px-2 text-xs font-semibold uppercase text-muted-foreground">People</h3>
                  {matchedUsers.slice(0, 3).map(u => (
                    <button 
                      key={u.id} 
                      className="w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                      onClick={() => navigateTo(`/app/team`)}
                    >
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
