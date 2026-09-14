import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backdrop" *ngIf="open" (click)="close.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <header>
          <h3>{{ title }}</h3>
          <button type="button" (click)="close.emit()" aria-label="Close">&times;</button>
        </header>
        <div class="body">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      display: grid;
      place-items: center;
      z-index: 50;
      padding: 1rem;
    }
    .modal {
      background: #fff;
      border-radius: 10px;
      width: 100%;
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.3);
    }
    header {
      display: flex;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
    }
    header h3 { font-size: 1rem; margin: 0; }
    header button {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 1.4rem;
      line-height: 1;
      cursor: pointer;
      color: var(--muted);
    }
    .body { padding: 1.25rem; }
  `]
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}
