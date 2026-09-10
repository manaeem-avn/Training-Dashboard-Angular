import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/api.models';
import { Project, ProjectQuery, ProjectRequest } from '../models/project.models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/projects`;

  search(query: ProjectQuery): Observable<PagedResult<Project>> {
    const params: HttpParams = toParams(query);
    return this.http.get<PagedResult<Project>>(this.url, { params });
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.url}/${id}`);
  }

  create(request: ProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.url, request);
  }

  update(id: number, request: ProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
