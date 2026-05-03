export type Role = "admin" | "member";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  activity: { id: string; at: string; text: string }[];
};
