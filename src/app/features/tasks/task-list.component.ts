import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { PagedResult } from '../../core/models/api.models';
import { AppUser } from '../../core/models/auth.models';
import { Project } from '../../core/models/project.models';
import { TaskQuery, WorkTask } from '../../core/models/task.models';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { ModalComponent } from '../../shared/modal.component';
import { PaginatorComponent } from '../../shared/paginator.component';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ModalComponent, PaginatorComponent],
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit, OnDestroy {
  private service = inject(TaskService);
  private projects = inject(ProjectService);
  private users = inject(UserService);
  private fb = inject(FormBuilder);
  private toasts = inject(ToastService);
  auth = inject(AuthService);

  private destroy = new Subject<void>();
  private searchChanged = new Subject<string>();

  result = signal<PagedResult<WorkTask> | null>(null);
  loading = signal(false);
  saving = signal(false);
  modalOpen = signal(false);
  editingId = signal<number | null>(null);
  projectOptions = signal<Project[]>([]);
  userOptions = signal<AppUser[]>([]);

  statuses = ['Todo', 'InProgress', 'Done'];
  priorities = ['Low', 'Medium', 'High'];

  query: TaskQuery = { page: 1, pageSize: 10, sortBy: 'id', desc: false, search: '' };

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    status: ['Todo', [Validators.required]],
    priority: ['Medium', [Validators.required]],
    dueDate: [''],
    projectId: [null as number | null, [Validators.required]],
    assigneeId: [null as number | null]
  });

  ngOnInit(): void {
    this.projects.search({ page: 1, pageSize: 50 }).subscribe((r) => this.projectOptions.set(r.items));
    this.users.lookup().subscribe((list) => this.userOptions.set(list));

    this.searchChanged.pipe(debounceTime(350), takeUntil(this.destroy)).subscribe((term) => {
      this.query = { ...this.query, search: term, page: 1 };
      this.load();
    });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  onSearch(term: string): void {
    this.searchChanged.next(term);
  }

  filter(key: 'status' | 'priority' | 'projectId', value: string): void {
    const parsed = key === 'projectId' ? (value ? Number(value) : null) : (value || null);
    this.query = { ...this.query, [key]: parsed, page: 1 };
    this.load();
  }

  sort(column: string): void {
    const desc = this.query.sortBy === column ? !this.query.desc : false;
    this.query = { ...this.query, sortBy: column, desc, page: 1 };
    this.load();
  }

  sortIcon(column: string): string {
    if (this.query.sortBy !== column) return '';
    return this.query.desc ? ' ▼' : ' ▲';
  }

  goToPage(page: number): void {
    this.query = { ...this.query, page };
    this.load();
  }

  changeSize(pageSize: number): void {
    this.query = { ...this.query, pageSize, page: 1 };
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.search(this.query).subscribe({
      next: (result) => {
        this.result.set(result);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '', description: '', status: 'Todo', priority: 'Medium',
      dueDate: '', projectId: this.query.projectId ?? null, assigneeId: null
    });
    this.modalOpen.set(true);
  }

  openEdit(task: WorkTask): void {
    this.editingId.set(task.id);
    this.form.reset({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
      projectId: task.projectId,
      assigneeId: task.assigneeId
    });
    this.modalOpen.set(true);
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      description: value.description,
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate || null,
      projectId: Number(value.projectId),
      assigneeId: value.assigneeId ? Number(value.assigneeId) : null
    };

    this.saving.set(true);
    const id = this.editingId();
    const request = id ? this.service.update(id, payload) : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toasts.success(id ? 'Task updated' : 'Task created', payload.title);
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  remove(task: WorkTask): void {
    if (!confirm(`Delete "${task.title}"?`)) return;

    this.service.delete(task.id).subscribe(() => {
      this.toasts.success('Task deleted', task.title);
      this.load();
    });
  }

  statusBadge(status: string): string {
    if (status === 'Done') return 'success';
    if (status === 'InProgress') return 'info';
    return 'neutral';
  }

  priorityBadge(priority: string): string {
    if (priority === 'High') return 'danger';
    if (priority === 'Medium') return 'warning';
    return 'success';
  }

  isOverdue(task: WorkTask): boolean {
    return task.status !== 'Done' && !!task.dueDate && new Date(task.dueDate) < new Date();
  }
}
