import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error';
  title: string;
  detail: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  toasts = signal<Toast[]>([]);

  success(title: string, detail = ''): void {
    this.show('success', title, detail);
  }

  error(title: string, detail = ''): void {
    this.show('error', title, detail);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(type: 'success' | 'error', title: string, detail: string): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, title, detail }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}
