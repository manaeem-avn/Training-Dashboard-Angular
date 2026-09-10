import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { PagedQuery, PagedResult } from '../../core/models/api.models';
import { AppUser } from '../../core/models/auth.models';
import { UserService } from '../../core/services/user.service';
import { ModalComponent } from '../../shared/modal.component';
import { PaginatorComponent } from '../../shared/paginator.component';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PaginatorComponent],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit, OnDestroy {
  private service = inject(UserService);
  private fb = inject(FormBuilder);
  private toasts = inject(ToastService);

  private destroy = new Subject<void>();
  private searchChanged = new Subject<string>();

  result = signal<PagedResult<AppUser> | null>(null);
  loading = signal(false);
  saving = signal(false);
  modalOpen = signal(false);
  editingId = signal<number | null>(null);

  roles = ['Admin', 'User'];

  query: PagedQuery = { page: 1, pageSize: 10, sortBy: 'id', desc: false, search: '' };

  form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['User', [Validators.required]],
    isActive: [true],
    password: ['', [Validators.minLength(6)]]
  });

  ngOnInit(): void {
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
    this.form.reset({ fullName: '', email: '', role: 'User', isActive: true, password: '' });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  openEdit(user: AppUser): void {
    this.editingId.set(user.id);
    this.form.reset({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      password: ''
    });
    this.form.controls.password.setValidators([Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
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
      fullName: value.fullName,
      email: value.email,
      role: value.role,
      isActive: value.isActive,
      password: value.password ? value.password : null
    };

    this.saving.set(true);
    const id = this.editingId();
    const request = id ? this.service.update(id, payload) : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toasts.success(id ? 'User updated' : 'User created', payload.email);
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  remove(user: AppUser): void {
    if (!confirm(`Delete ${user.fullName}?`)) return;

    this.service.delete(user.id).subscribe(() => {
      this.toasts.success('User deleted', user.email);
      this.load();
    });
  }
}
