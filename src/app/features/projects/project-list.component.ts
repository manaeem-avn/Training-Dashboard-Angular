import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { PagedResult } from '../../core/models/api.models';
import { AppUser } from '../../core/models/auth.models';
import { Project, ProjectQuery } from '../../core/models/project.models';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { UserService } from '../../core/services/user.service';
import { ModalComponent } from '../../shared/modal.component';
import { PaginatorComponent } from '../../shared/paginator.component';
import { ToastService } from '../../shared/toast.service';
import { dateRangeValidator, toIsoDate } from '../../shared/form-helpers';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PaginatorComponent],
  templateUrl: './project-list.component.html'
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private service = inject(ProjectService);
  private users = inject(UserService);
  private fb = inject(FormBuilder);
  private toasts = inject(ToastService);
  auth = inject(AuthService);

  private destroy = new Subject<void>();
  private searchChanged = new Subject<string>();

  result = signal<PagedResult<Project> | null>(null);
  loading = signal(false);
  saving = signal(false);
  modalOpen = signal(false);
  editingId = signal<number | null>(null);
  owners = signal<AppUser[]>([]);

  statuses = ['Active', 'OnHold', 'Completed'];

  query: ProjectQuery = { page: 1, pageSize: 10, sortBy: 'id', desc: false, search: '', status: null };

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(1000)]],
    status: ['Active', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: [''],
    ownerId: [null as number | null, [Validators.required]]
  }, { validators: dateRangeValidator('startDate', 'endDate') });

  ngOnInit(): void {
    this.users.lookup().subscribe((list) => this.owners.set(list));

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

  filterStatus(status: string): void {
    this.query = { ...this.query, status: status || null, page: 1 };
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
      name: '', description: '', status: 'Active',
      startDate: toIsoDate(new Date())!, endDate: '', ownerId: null
    });
    this.modalOpen.set(true);
  }

  openEdit(project: Project): void {
    this.editingId.set(project.id);
    this.form.reset({
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.startDate.substring(0, 10),
      endDate: project.endDate ? project.endDate.substring(0, 10) : '',
      ownerId: project.ownerId
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
      name: value.name,
      description: value.description,
      status: value.status,
      startDate: value.startDate,
      endDate: value.endDate || null,
      ownerId: Number(value.ownerId)
    };

    this.saving.set(true);
    const id = this.editingId();
    const request = id ? this.service.update(id, payload) : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toasts.success(id ? 'Project updated' : 'Project created', payload.name);
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  remove(project: Project): void {
    if (!confirm(`Delete "${project.name}" and all of its tasks?`)) return;

    this.service.delete(project.id).subscribe(() => {
      this.toasts.success('Project deleted', project.name);
      this.load();
    });
  }

  badge(status: string): string {
    if (status === 'Active') return 'success';
    if (status === 'OnHold') return 'warning';
    return 'info';
  }
}
