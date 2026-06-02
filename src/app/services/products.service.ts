import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Product } from '../models/product.model';
import { MockDataService } from '../core/services/mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly api: string = environment.marketPlaceUrl;
  private productsCache$: Observable<Product[]> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly mockDataService: MockDataService
  ) {}

  getData(): Observable<Product[]> {
    // ✅ Caché automático - solo 1 request aunque se subscribe múltiples veces
    if (!this.productsCache$) {
      // 🎯 Primero intenta mock data (local JSON)
      // Si no existe, fallback a backend
      this.productsCache$ = this.mockDataService.getProducts().pipe(
        catchError((mockError) => {
          console.log('Mock data not available, trying backend:', mockError.message);
          // Si mock data no existe, intenta backend
          return this.http.get<Product[]>(`${this.api}products.json`).pipe(
            catchError((backendError) => {
              console.error('Backend unavailable:', backendError.message);
              return this.handleError(backendError);
            })
          );
        }),
        shareReplay(1) // ✅ Cachea la última emisión
      );
    }
    return this.productsCache$;
  }

  // ✅ Método para invalidar caché cuando sea necesario
  invalidateCache(): void {
    this.productsCache$ = null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred while fetching products';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
