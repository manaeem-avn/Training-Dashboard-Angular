export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export interface PagedQuery {
  search?: string;
  sortBy?: string;
  desc?: boolean;
  page?: number;
  pageSize?: number;
}
