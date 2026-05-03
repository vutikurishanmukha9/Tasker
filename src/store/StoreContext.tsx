import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Project, Task, TaskStatus, User, Role } from "@/lib/types";
import { seedProjects, seedTasks, seedUsers } from "@/lib/seed";

type AuthUser = { id: string; name: string; email: string; role: Role };

type Store = {
  // auth
  currentUser: AuthUser | null;
  login: (email: string) => boolean;
  signup: (name: string, email: string) => void;
  logout: () => void;
  // data
  users: User[];
  projects: Project[];
  tasks: Task[];
  // actions
  addProject: (p: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTask: (t: Omit<Task, "id" | "createdAt" | "activity">) => void;
  updateTask: (id: string, patch: Partial<Task>, activityText?: string) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  addUser: (u: Omit<User, "id" | "avatarColor">) => void;
  updateUserRole: (id: string, role: Role) => void;
  removeUser: (id: string) => void;
};

const StoreContext = createContext<Store | null>(null);

const KEY = "ttm.state.v1";
const AUTH_KEY = "ttm.auth.v1";

function load<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = load(KEY, { users: seedUsers, projects: seedProjects, tasks: seedTasks });
  const [users, setUsers] = useState<User[]>(initial.users);
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(load<AuthUser | null>(AUTH_KEY, null));

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ users, projects, tasks }));
  }, [users, projects, tasks]);
  useEffect(() => {
    if (currentUser) localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
    else localStorage.removeItem(AUTH_KEY);
  }, [currentUser]);

  const value = useMemo<Store>(
    () => ({
      currentUser,
      login: (email) => {
        const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
        if (!u) return false;
        setCurrentUser({ id: u.id, name: u.name, email: u.email, role: u.role });
        return true;
      },
      signup: (name, email) => {
        const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          setCurrentUser({ id: existing.id, name: existing.name, email: existing.email, role: existing.role });
          return;
        }
        const id = uid();
        const role: Role = users.length === 0 ? "admin" : "member";
        const u: User = { id, name, email, role, avatarColor: "#0f766e" };
        setUsers((s) => [...s, u]);
        setCurrentUser({ id, name, email, role });
      },
      logout: () => setCurrentUser(null),
      users,
      projects,
      tasks,
      addProject: (p) => setProjects((s) => [{ ...p, id: uid(), createdAt: now() }, ...s]),
      updateProject: (id, patch) => setProjects((s) => s.map((p) => (p.id === id ? { ...p, ...patch } : p))),
      deleteProject: (id) => {
        setProjects((s) => s.filter((p) => p.id !== id));
        setTasks((s) => s.filter((t) => t.projectId !== id));
      },
      addTask: (t) =>
        setTasks((s) => [
          { ...t, id: uid(), createdAt: now(), activity: [{ id: uid(), at: now(), text: "Task created" }] },
          ...s,
        ]),
      updateTask: (id, patch, activityText) =>
        setTasks((s) =>
          s.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...patch,
                  activity: activityText
                    ? [...t.activity, { id: uid(), at: now(), text: activityText }]
                    : t.activity,
                }
              : t,
          ),
        ),
      deleteTask: (id) => setTasks((s) => s.filter((t) => t.id !== id)),
      setTaskStatus: (id, status) =>
        setTasks((s) =>
          s.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  activity: [
                    ...t.activity,
                    { id: uid(), at: now(), text: `Status changed to ${status.replace("_", " ")}` },
                  ],
                }
              : t,
          ),
        ),
      addUser: (u) => setUsers((s) => [...s, { ...u, id: uid(), avatarColor: "#0f766e" }]),
      updateUserRole: (id, role) => setUsers((s) => s.map((u) => (u.id === id ? { ...u, role } : u))),
      removeUser: (id) => setUsers((s) => s.filter((u) => u.id !== id)),
    }),
    [users, projects, tasks, currentUser],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
