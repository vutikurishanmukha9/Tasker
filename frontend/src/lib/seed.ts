import { Project, Task, User } from "./types";

const COLORS = ["#0f766e", "#1e40af", "#9333ea", "#b91c1c", "#c2410c", "#0891b2", "#4338ca", "#16a34a"];
export const colorFor = (seed: string) => COLORS[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length];

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const today = new Date();
const offset = (d: number) => new Date(today.getTime() + d * 86400000).toISOString();

export const seedUsers: User[] = [
  { id: "u1", name: "Alex Morgan", email: "alex@acme.co", role: "admin", avatarColor: colorFor("Alex Morgan") },
  { id: "u2", name: "Priya Shah", email: "priya@acme.co", role: "member", avatarColor: colorFor("Priya Shah") },
  { id: "u3", name: "Jordan Lee", email: "jordan@acme.co", role: "member", avatarColor: colorFor("Jordan Lee") },
  { id: "u4", name: "Mei Tanaka", email: "mei@acme.co", role: "member", avatarColor: colorFor("Mei Tanaka") },
];

export const seedProjects: Project[] = [
  { id: "p1", name: "Website Relaunch", description: "Marketing site overhaul for Q3.", memberIds: ["u1", "u2", "u3"], createdAt: offset(-30) },
  { id: "p2", name: "Mobile App v2", description: "Native iOS and Android refresh.", memberIds: ["u1", "u4"], createdAt: offset(-12) },
  { id: "p3", name: "Internal Analytics", description: "Pipeline + dashboards for ops.", memberIds: ["u2", "u3", "u4"], createdAt: offset(-3) },
];

const t = (
  id: string,
  projectId: string,
  title: string,
  status: Task["status"],
  assigneeId: string | null,
  due: number | null,
  description = "",
): Task => ({
  id,
  projectId,
  title,
  description,
  assigneeId,
  status,
  dueDate: due === null ? null : offset(due),
  createdAt: offset(-10),
  activity: [{ id: "a" + id, at: offset(-10), text: "Task created" }],
});

export const seedTasks: Task[] = [
  t("t1", "p1", "Audit existing pages", "done", "u2", -5, "Catalog every page and asset."),
  t("t2", "p1", "Draft new homepage copy", "in_progress", "u3", 2),
  t("t3", "p1", "Design system tokens", "in_progress", "u1", 5),
  t("t4", "p1", "Migrate blog to MDX", "todo", "u2", 9),
  t("t5", "p1", "Lighthouse pass", "todo", null, -1, "Initial perf audit."),
  t("t6", "p2", "Onboarding flow spec", "in_progress", "u4", 4),
  t("t7", "p2", "Push notifications", "todo", "u1", 14),
  t("t8", "p2", "Crash reporting setup", "done", "u4", -8),
  t("t9", "p3", "ETL skeleton", "in_progress", "u3", 1),
  t("t10", "p3", "KPI definitions", "todo", "u2", 7),
  t("t11", "p3", "Weekly digest email", "todo", "u4", -2),
];
