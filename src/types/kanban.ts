// Type definitions for Kanban board

export type Priority = "Low" | "Medium" | "High";
export type Status = "todo" | "in-progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  deadline: string;
  status: Status;
}

export interface Column {
  id: Status;
  title: string;
  tasks: Task[];
}
