import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { PagedQuery } from '../../core/models/api.models';
import { AppUser } from '../../core/models/auth.models';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, PasswordModule, DropdownModule, InputSwitchModule, TagModule
  ],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit, OnDestroy {
  private service = inject(UserService);
  private fb = inject(FormBuilder);
  private messages = inject(MessageService);
  private confirm = inject(ConfirmationService);
  auth = inject(AuthService);

  private destroy = new Subject<void>();
  private searchChanged = new Subject<string>();

  rows = signal<AppUser[]>([]);
  total = signal(0);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = signal(false);
  editingId = signal<number | null>(null);

  roles = [
    { label: 'Admin', value: 'Admin' },
    { label: 'User', value: 'User' }
  ];

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
    this.form.reset({ fullName: '', email: '', role: 'User', isActive: true, password: '' });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.dialogVisible.set(true);
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
        this.dialogVisible.set(false);
        this.messages.add({
          severity: 'success',
          summary: id ? 'User updated' : 'User created',
          detail: payload.email
        });
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  remove(user: AppUser): void {
    this.confirm.confirm({
      header: 'Delete user',
      message: `Delete ${user.fullName}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(user.id).subscribe(() => {
          this.messages.add({ severity: 'success', summary: 'User deleted', detail: user.email });
          this.load();
        });
      }
    });
  }
}
