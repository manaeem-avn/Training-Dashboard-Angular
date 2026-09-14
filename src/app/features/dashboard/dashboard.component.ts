import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DashboardSummary } from '../../core/models/dashboard.models';
import { DashboardService } from '../../core/services/dashboard.service';
import { ChartComponent } from '../../shared/chart.component';

interface Card {
  label: string;
  value: number;
  tone: string;
}

const STATUS_COLOURS: Record<string, string> = {
  Todo: '#94a3b8',
  InProgress: '#4f46e5',
  Done: '#16a34a'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private service = inject(DashboardService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  cards = signal<Card[]>([]);

  statusLabels: string[] = [];
  statusValues: number[] = [];
  statusColours: string[] = [];

  projectLabels: string[] = [];
  projectValues: number[] = [];

  ngOnInit(): void {
    this.service.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);

        this.cards.set([
          { label: 'Projects', value: summary.totalProjects, tone: 'indigo' },
          { label: 'Active projects', value: summary.activeProjects, tone: 'green' },
          { label: 'Tasks', value: summary.totalTasks, tone: 'blue' },
          { label: 'Open tasks', value: summary.openTasks, tone: 'amber' },
          { label: 'Overdue tasks', value: summary.overdueTasks, tone: 'red' },
          { label: 'Users', value: summary.totalUsers, tone: 'slate' }
        ]);

        this.statusLabels = summary.tasksByStatus.map((p) => p.label);
        this.statusValues = summary.tasksByStatus.map((p) => p.value);
        this.statusColours = summary.tasksByStatus.map((p) => STATUS_COLOURS[p.label] ?? '#cbd5e1');

        this.projectLabels = summary.tasksPerProject.map((p) => p.label);
        this.projectValues = summary.tasksPerProject.map((p) => p.value);

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
