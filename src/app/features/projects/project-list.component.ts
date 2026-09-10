import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Project, ProjectQuery } from '../../core/models/project.models';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { UserService } from '../../core/services/user.service';
import { dateRangeValidator, toIsoDate } from '../shared/form-helpers';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, InputTextareaModule, DropdownModule, CalendarModule, TagModule
  ],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private service = inject(ProjectService);
  private users = inject(UserService);
  private fb = inject(FormBuilder);
  private messages = inject(MessageService);
  private confirm = inject(ConfirmationService);
  auth = inject(AuthService);

  private destroy = new Subject<void>();
  private searchChanged = new Subject<string>();

  rows = signal<Project[]>([]);
  total = signal(0);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = signal(false);
  editingId = signal<number | null>(null);
  owners = signal<AppUser[]>([]);

  statuses = [
    { label: 'Active', value: 'Active' },
    { label: 'On hold', value: 'OnHold' },
    { label: 'Completed', value: 'Completed' }
  ];

  query: ProjectQuery = { page: 1, pageSize: 10, sortBy: 'id', desc: false, search: '', status: null };

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
    status: ['Active', [Validators.required]],
    startDate: [new Date() as Date | null, [Validators.required]],
    endDate: [null as Date | null],
    ownerId: [null as number | null, [Validators.required]]
  }, { validators: dateRangeValidator('startDate', 'endDate') });

  ngOnInit(): void {
    this.users.lookup().subscribe((list) => this.owners.set(list));

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

  onStatusFilter(status: string | null): void {
    this.query = { ...this.query, status, page: 1 };
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
      name: '', description: '', status: 'Active',
      startDate: new Date(), endDate: null, ownerId: null
    });
    this.dialogVisible.set(true);
  }

  openEdit(project: Project): void {
    this.editingId.set(project.id);
    this.form.reset({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: new Date(project.startDate),
      endDate: project.endDate ? new Date(project.endDate) : null,
      ownerId: project.ownerId
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
      name: value.name,
      description: value.description,
      status: value.status,
      startDate: toIsoDate(value.startDate)!,
      endDate: toIsoDate(value.endDate),
      ownerId: value.ownerId!
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
          summary: id ? 'Project updated' : 'Project created',
          detail: payload.name
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  remove(project: Project): void {
    this.confirm.confirm({
      header: 'Delete project',
      message: `Delete "${project.name}" and all of its tasks?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(project.id).subscribe(() => {
          this.messages.add({ severity: 'success', summary: 'Project deleted', detail: project.name });
          this.load();
        });
      }
    });
  }

  severity(status: string): 'success' | 'warning' | 'info' {
    if (status === 'Active') return 'success';
    if (status === 'OnHold') return 'warning';
    return 'info';
  }
}
