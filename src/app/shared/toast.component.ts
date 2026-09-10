import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      <div class="toast" *ngFor="let toast of service.toasts()" [class.error]="toast.type === 'error'">
        <div>
          <strong>{{ toast.title }}</strong>
          <p *ngIf="toast.detail">{{ toast.detail }}</p>
        </div>
        <button type="button" (click)="service.dismiss(toast.id)" aria-label="Dismiss">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 340px;
    }
    .toast {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #14532d;
      border-radius: 8px;
      padding: 0.7rem 0.85rem;
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
    }
    .toast.error {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #7f1d1d;
    }
    .toast strong { font-size: 0.86rem; }
    .toast p { margin: 0.15rem 0 0; font-size: 0.8rem; }
    .toast button {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 1.1rem;
      line-height: 1;
      cursor: pointer;
      color: inherit;
    }
  `]
})
export class ToastComponent {
  service = inject(ToastService);
}
