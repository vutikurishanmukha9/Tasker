export type Role = "admin" | "member";

export type User = {
  id: number;
  username: string;
  email: string;
  role: Role;
  created_at?: string;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  created_by?: User;
  team_members?: User[];
  created_at: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: number;
  title: string;
  description: string;
  project: number;
  project_name?: string;
  assigned_to: number | null;
  assigned_to_username?: string;
  created_by?: number;
  created_by_username?: string;
  status: TaskStatus;
  due_date: string | null;
  is_overdue?: boolean;
  created_at: string;
};

export type DashboardData = {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  tasks_by_status: {
    todo: number;
    in_progress: number;
    done: number;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: any;
  status_code: number;
};

export type PaginatedResponse<T> = ApiResponse<{
  results: T[];
  pagination: {
    count: number;
    page_size: number;
    current_page: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
}>;
