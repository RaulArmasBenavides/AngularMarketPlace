import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly api: string = environment.marketPlaceUrl;
  private productsCache$: Observable<Product[]> | null = null;

  constructor(private readonly http: HttpClient) {}

  getData(): Observable<Product[]> {
    // Caché: una sola petición aunque haya varias suscripciones
    if (!this.productsCache$) {
      this.productsCache$ = this.http.get<Product[]>(`${this.api}products`).pipe(
        catchError((error: HttpErrorResponse) => {
          this.productsCache$ = null; // permitir reintentar
          return this.handleError(error);
        }),
        shareReplay(1)
      );
    }
    return this.productsCache$;
  }

  invalidateCache(): void {
    this.productsCache$ = null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = `Error al cargar productos (${error.status || 'sin conexión'})`;
    console.error(message, error.message);
    return throwError(() => new Error(message));
  }
}
