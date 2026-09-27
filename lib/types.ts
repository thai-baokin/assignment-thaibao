export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  teamId?: string | null;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
}
