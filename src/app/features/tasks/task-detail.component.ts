import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { Attachment, Comment, WorkTask } from '../../core/models/task.models';
import { AuthService } from '../../core/services/auth.service';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextareaModule, TagModule, ProgressSpinnerModule],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.css'
})
export class TaskDetailComponent implements OnInit {
  @Input() id!: string;

  private service = inject(TaskService);
  private fb = inject(FormBuilder);
  private messages = inject(MessageService);
  private confirm = inject(ConfirmationService);
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
        this.messages.add({ severity: 'success', summary: 'File uploaded', detail: attachment.fileName });
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
    this.confirm.confirm({
      header: 'Delete attachment',
      message: `Delete "${attachment.fileName}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.deleteAttachment(attachment.id).subscribe(() => {
          this.messages.add({ severity: 'success', summary: 'Attachment deleted', detail: attachment.fileName });
          this.reloadAttachments();
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

  size(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }
}
