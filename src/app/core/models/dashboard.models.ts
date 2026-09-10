export interface ChartPoint {
  label: string;
  value: number;
}

export interface DashboardSummary {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  openTasks: number;
  overdueTasks: number;
  totalUsers: number;
  tasksByStatus: ChartPoint[];
  tasksByPriority: ChartPoint[];
  tasksPerProject: ChartPoint[];
}
