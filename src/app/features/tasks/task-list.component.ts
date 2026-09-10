import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppUser } from '../../core/models/auth.models';
import { Project } from '../../core/models/project.models';
import { TaskQuery, WorkTask } from '../../core/models/task.models';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { toIsoDate } from '../shared/form-helpers';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink, TableModule, ButtonModule, DialogModule,
    InputTextModule, InputTextareaModule, DropdownModule, CalendarModule, TagModule
  ],
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit, OnDestroy {
  private service = inject(TaskService);
  private projects = inject(ProjectService);
  private users = inject(UserService);
  private fb = inject(FormBuilder);
  private messages = inject(MessageService);
  private confirm = inject(ConfirmationService);
  auth = inject(AuthService);

  private destroy = new Subject<void>();
  private searchChanged = new Subject<string>();

  rows = signal<WorkTask[]>([]);
  total = signal(0);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = signal(false);
  editingId = signal<number | null>(null);
  projectOptions = signal<Project[]>([]);
  userOptions = signal<AppUser[]>([]);

  statuses = [
    { label: 'To do', value: 'Todo' },
    { label: 'In progress', value: 'InProgress' },
    { label: 'Done', value: 'Done' }
  ];

  priorities = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' }
  ];

  query: TaskQuery = { page: 1, pageSize: 10, sortBy: 'id', desc: false, search: '' };

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    status: ['Todo', [Validators.required]],
    priority: ['Medium', [Validators.required]],
    dueDate: [null as Date | null],
    projectId: [null as number | null, [Validators.required]],
    assigneeId: [null as number | null]
  });

  ngOnInit(): void {
    this.projects.search({ page: 1, pageSize: 50 }).subscribe((result) => this.projectOptions.set(result.items));
    this.users.lookup().subscribe((list) => this.userOptions.set(list));

    this.searchChanged.pipe(debounceTime(350), takeUntil(this.destroy)).subscribe((term) => {
      this.query = { ...this.query, search: term, page: 1 };
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const size = event.rows ?? 10;
    this.query = {
      ...this.query,
      page: Math.floor((event.first ?? 0) / size) + 1,
      pageSize: size,
      sortBy: (event.sortField as string) ?? 'id',
      desc: event.sortOrder === -1
    };
    this.load();
  }

  onSearch(term: string): void {
    this.searchChanged.next(term);
  }

  filter(key: 'status' | 'priority' | 'projectId' | 'assigneeId', value: unknown): void {
    this.query = { ...this.query, [key]: value ?? null, page: 1 };
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.search(this.query).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.total.set(result.totalItems);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '', description: '', status: 'Todo', priority: 'Medium',
      dueDate: null, projectId: this.query.projectId ?? null, assigneeId: null
    });
    this.dialogVisible.set(true);
  }

  openEdit(task: WorkTask): void {
    this.editingId.set(task.id);
    this.form.reset({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      projectId: task.projectId,
      assigneeId: task.assigneeId
    });
    this.dialogVisible.set(true);
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
      dueDate: toIsoDate(value.dueDate),
      projectId: value.projectId!,
      assigneeId: value.assigneeId
    };

    this.saving.set(true);
    const id = this.editingId();
    const request = id ? this.service.update(id, payload) : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.messages.add({
          severity: 'success',
          summary: id ? 'Task updated' : 'Task created',
          detail: payload.title
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  remove(task: WorkTask): void {
    this.confirm.confirm({
      header: 'Delete task',
      message: `Delete "${task.title}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(task.id).subscribe(() => {
          this.messages.add({ severity: 'success', summary: 'Task deleted', detail: task.title });
          this.load();
        });
      }
    });
  }

  statusSeverity(status: string): 'success' | 'info' | 'secondary' {
    if (status === 'Done') return 'success';
    if (status === 'InProgress') return 'info';
    return 'secondary';
  }

  prioritySeverity(priority: string): 'danger' | 'warning' | 'success' {
    if (priority === 'High') return 'danger';
    if (priority === 'Medium') return 'warning';
    return 'success';
  }

  isOverdue(task: WorkTask): boolean {
    return task.status !== 'Done' && !!task.dueDate && new Date(task.dueDate) < new Date();
  }
}
