import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/api.models';
import { Attachment, Comment, TaskQuery, TaskRequest, WorkTask } from '../models/task.models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/tasks`;

  search(query: TaskQuery): Observable<PagedResult<WorkTask>> {
    return this.http.get<PagedResult<WorkTask>>(this.url, { params: toParams(query) });
  }

  getById(id: number): Observable<WorkTask> {
    return this.http.get<WorkTask>(`${this.url}/${id}`);
  }

  create(request: TaskRequest): Observable<WorkTask> {
    return this.http.post<WorkTask>(this.url, request);
  }

  update(id: number, request: TaskRequest): Observable<WorkTask> {
    return this.http.put<WorkTask>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getComments(taskId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.url}/${taskId}/comments`);
  }

  addComment(taskId: number, text: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.url}/${taskId}/comments`, { text });
  }

  deleteComment(taskId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${taskId}/comments/${commentId}`);
  }

  getAttachments(taskId: number): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.url}/${taskId}/attachments`);
  }

  upload(taskId: number, file: File): Observable<Attachment> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Attachment>(`${this.url}/${taskId}/attachments`, form);
  }

  download(attachmentId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    });
  }

  deleteAttachment(attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/attachments/${attachmentId}`);
  }
}
