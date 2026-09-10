import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DashboardSummary } from '../../core/models/dashboard.models';
import { DashboardService } from '../../core/services/dashboard.service';

const STATUS_COLOURS: Record<string, string> = {
  Todo: '#94a3b8',
  InProgress: '#6366f1',
  Done: '#22c55e'
};

function statusColour(label: string): string {
  return STATUS_COLOURS[label] ?? '#cbd5e1';
}

interface Card {
  label: string;
  value: number;
  icon: string;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private service = inject(DashboardService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  cards = signal<Card[]>([]);
  statusChart = signal<unknown>(null);
  projectChart = signal<unknown>(null);

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  ngOnInit(): void {
    this.service.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.cards.set([
          { label: 'Projects', value: summary.totalProjects, icon: 'pi pi-briefcase', tone: 'indigo' },
          { label: 'Active projects', value: summary.activeProjects, icon: 'pi pi-play', tone: 'green' },
          { label: 'Tasks', value: summary.totalTasks, icon: 'pi pi-check-square', tone: 'blue' },
          { label: 'Open tasks', value: summary.openTasks, icon: 'pi pi-clock', tone: 'amber' },
          { label: 'Overdue tasks', value: summary.overdueTasks, icon: 'pi pi-exclamation-triangle', tone: 'red' },
          { label: 'Users', value: summary.totalUsers, icon: 'pi pi-users', tone: 'slate' }
        ]);

        this.statusChart.set({
          labels: summary.tasksByStatus.map((point) => point.label),
          datasets: [{
            data: summary.tasksByStatus.map((point) => point.value),
            backgroundColor: summary.tasksByStatus.map((point) => statusColour(point.label))
          }]
        });

        this.projectChart.set({
          labels: summary.tasksPerProject.map((point) => point.label),
          datasets: [{
            label: 'Tasks',
            data: summary.tasksPerProject.map((point) => point.value),
            backgroundColor: '#6366f1',
            borderRadius: 6
          }]
        });

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
