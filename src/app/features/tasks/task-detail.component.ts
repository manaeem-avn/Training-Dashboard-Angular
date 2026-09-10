import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Attachment, Comment, WorkTask } from '../../core/models/task.models';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css'
})
export class TaskDetailComponent implements OnInit {
  @Input() id!: string;

  private service = inject(TaskService);
  private fb = inject(FormBuilder);
  private toasts = inject(ToastService);
  auth = inject(AuthService);

  loading = signal(true);
  task = signal<WorkTask | null>(null);
  comments = signal<Comment[]>([]);
  attachments = signal<Attachment[]>([]);
  posting = signal(false);
  uploading = signal(false);

  commentForm = this.fb.nonNullable.group({
    text: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(1000)]]
  });

  private get taskId(): number {
    return Number(this.id);
  }

  ngOnInit(): void {
    this.service.getById(this.taskId).subscribe({
      next: (task) => {
        this.task.set(task);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.reloadComments();
    this.reloadAttachments();
  }

  reloadComments(): void {
    this.service.getComments(this.taskId).subscribe((list) => this.comments.set(list));
  }

  reloadAttachments(): void {
    this.service.getAttachments(this.taskId).subscribe((list) => this.attachments.set(list));
  }

  addComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }

    this.posting.set(true);
    this.service.addComment(this.taskId, this.commentForm.getRawValue().text).subscribe({
      next: () => {
        this.posting.set(false);
        this.commentForm.reset({ text: '' });
        this.reloadComments();
      },
      error: () => this.posting.set(false)
    });
  }

  deleteComment(comment: Comment): void {
    if (!confirm('Delete this comment?')) return;
    this.service.deleteComment(this.taskId, comment.id).subscribe(() => this.reloadComments());
  }

  canDelete(comment: Comment): boolean {
    return this.auth.isAdmin() || comment.authorId === this.auth.user()?.id;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.service.upload(this.taskId, file).subscribe({
      next: (attachment) => {
        this.uploading.set(false);
        input.value = '';
        this.toasts.success('File uploaded', attachment.fileName);
        this.reloadAttachments();
      },
      error: () => {
        this.uploading.set(false);
        input.value = '';
      }
    });
  }

  download(attachment: Attachment): void {
    this.service.download(attachment.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.fileName;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  deleteAttachment(attachment: Attachment): void {
    if (!confirm(`Delete "${attachment.fileName}"?`)) return;

    this.service.deleteAttachment(attachment.id).subscribe(() => {
      this.toasts.success('Attachment deleted', attachment.fileName);
      this.reloadAttachments();
    });
  }

  size(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
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
}
