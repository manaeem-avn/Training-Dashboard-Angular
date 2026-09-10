import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PagedResult } from '../core/models/api.models';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="paginator" *ngIf="page">
      <span class="muted">
        Showing {{ first }} to {{ last }} of {{ page.totalItems }} {{ label }}
      </span>

      <span class="spacer"></span>

      <label class="size">
        Rows
        <select [value]="page.pageSize" (change)="sizeChange.emit(+$any($event.target).value)">
          <option [value]="5">5</option>
          <option [value]="10">10</option>
          <option [value]="25">25</option>
        </select>
      </label>

      <button type="button" class="btn btn-secondary" [disabled]="!page.hasPrevious"
              (click)="pageChange.emit(page.page - 1)">Previous</button>
      <span class="current">Page {{ page.page }} of {{ page.totalPages || 1 }}</span>
      <button type="button" class="btn btn-secondary" [disabled]="!page.hasNext"
              (click)="pageChange.emit(page.page + 1)">Next</button>
    </div>
  `,
  styles: [`
    .paginator {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
      padding: 0.75rem 0.85rem;
      border-top: 1px solid var(--border);
    }
    .spacer { flex: 1 1 auto; }
    .size { font-size: 0.8rem; color: var(--muted); display: flex; align-items: center; gap: 0.35rem; }
    .size select { padding: 0.25rem 0.4rem; border: 1px solid var(--border); border-radius: 4px; font-family: inherit; }
    .current { font-size: 0.82rem; }
    .btn { padding: 0.35rem 0.7rem; font-size: 0.8rem; }
  `]
})
export class PaginatorComponent {
  @Input() page: PagedResult<unknown> | null = null;
  @Input() label = 'items';
  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();

  get first(): number {
    if (!this.page || this.page.totalItems === 0) return 0;
    return (this.page.page - 1) * this.page.pageSize + 1;
  }

  get last(): number {
    if (!this.page) return 0;
    return Math.min(this.page.page * this.page.pageSize, this.page.totalItems);
  }
}
