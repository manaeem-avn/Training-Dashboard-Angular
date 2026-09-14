import { Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import Chart, { ChartConfiguration, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas #canvas [style.height.px]="height"></canvas>`,
  styles: [`:host { display: block; }`]
})
export class ChartComponent implements OnChanges, OnDestroy {
  @Input() type: ChartType = 'bar';
  @Input() labels: string[] = [];
  @Input() values: number[] = [];
  @Input() colors: string[] = [];
  @Input() height = 260;

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngOnChanges(): void {
    this.chart?.destroy();

    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels: this.labels,
        datasets: [{
          label: 'Tasks',
          data: this.values,
          backgroundColor: this.colors.length ? this.colors : '#4f46e5',
          borderRadius: this.type === 'bar' ? 6 : 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: this.type !== 'bar', position: 'bottom' }
        },
        scales: this.type === 'bar'
          ? { y: { beginAtZero: true, ticks: { precision: 0 } } }
          : {}
      }
    };

    this.chart = new Chart(this.canvas.nativeElement, config);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
