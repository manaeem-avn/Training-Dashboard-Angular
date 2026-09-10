import { HttpParams } from '@angular/common/http';

export function toParams(query: object): HttpParams {
  let params = new HttpParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  });

  return params;
}
