import { PagedQuery } from './api.models';

export type ProjectStatus = 'Active' | 'OnHold' | 'Completed';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string | null;
  ownerId: number;
  ownerName: string;
  taskCount: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface ProjectRequest {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string | null;
  ownerId: number;
}

export interface ProjectQuery extends PagedQuery {
  status?: string | null;
  ownerId?: number | null;
}
