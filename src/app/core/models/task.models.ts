import { PagedQuery } from './api.models';

export type TaskStatus = 'Todo' | 'InProgress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface WorkTask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: number;
  projectName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  commentCount: number;
  attachmentCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface TaskRequest {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: number;
  assigneeId: number | null;
}

export interface TaskQuery extends PagedQuery {
  projectId?: number | null;
  status?: string | null;
  priority?: string | null;
  assigneeId?: number | null;
}

export interface Comment {
  id: number;
  text: string;
  taskId: number;
  authorId: number;
  authorName: string;
  createdAt: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  taskId: number;
  uploadedBy: string;
  createdAt: string;
}
