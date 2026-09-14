import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../models/api.models';
import { ToastService } from '../../shared/toast.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toasts = inject(ToastService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        toasts.error(title(error.status), describe(error));
      }
      return throwError(() => error);
    })
  );
};

function title(status: number): string {
  if (status === 0) return 'Cannot reach the API';
  if (status === 403) return 'Not allowed';
  if (status === 404) return 'Not found';
  if (status >= 500) return 'Server error';
  return 'Request failed';
}

function describe(error: HttpErrorResponse): string {
  if (error.status === 0) return 'The API is not responding. Check that it is running.';

  const body = error.error as ApiError | undefined;

  if (body?.errors) {
    return Object.values(body.errors).flat().join(' ');
  }

  return body?.message ?? error.message;
}
