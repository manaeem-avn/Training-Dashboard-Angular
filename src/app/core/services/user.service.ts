import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedQuery, PagedResult } from '../models/api.models';
import { AppUser, UserRequest } from '../models/auth.models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/users`;

  search(query: PagedQuery): Observable<PagedResult<AppUser>> {
    return this.http.get<PagedResult<AppUser>>(this.url, { params: toParams(query) });
  }

  lookup(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(`${this.url}/lookup`);
  }

  create(request: UserRequest): Observable<AppUser> {
    return this.http.post<AppUser>(this.url, request);
  }

  update(id: number, request: UserRequest): Observable<AppUser> {
    return this.http.put<AppUser>(`${this.url}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
