import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly api: string = environment.marketPlaceUrl;
  private categoriesCache$: Observable<Category[]> | null = null;

  constructor(private readonly http: HttpClient) {}

  getData(): Observable<Category[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http.get<Category[]>(`${this.api}categories`).pipe(
        catchError((error: HttpErrorResponse) => {
          this.categoriesCache$ = null; // permitir reintentar
          return this.handleError(error);
        }),
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }

  invalidateCache(): void {
    this.categoriesCache$ = null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = `Error al cargar categorías (${error.status || 'sin conexión'})`;
    console.error(message, error.message);
    return throwError(() => new Error(message));
  }
}
