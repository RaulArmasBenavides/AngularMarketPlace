import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Category } from '../models/category.model';
import { MockDataService } from '../core/services/mock-data.service';

@Injectable({
	providedIn: 'root'
})
export class CategoriesService {
	private readonly api: string = environment.marketPlaceUrl;
	private categoriesCache$: Observable<Category[]> | null = null;

	constructor(
		private readonly http: HttpClient,
		private readonly mockDataService: MockDataService
	) {}

	getData(): Observable<Category[]> {
		// ✅ Caché automático - shareReplay(1) reutiliza la última respuesta
		if (!this.categoriesCache$) {
			// 🎯 Primero intenta mock data (local JSON)
			// Si no existe, fallback a backend
			this.categoriesCache$ = this.mockDataService.getCategories().pipe(
				catchError((mockError) => {
					console.log('Mock data not available, trying backend:', mockError.message);
					// Si mock data no existe, intenta backend
					return this.http.get<Category[]>(`${this.api}categories.json`).pipe(
						catchError((backendError) => {
							console.error('Backend unavailable:', backendError.message);
							return this.handleError(backendError);
						})
					);
				}),
				shareReplay(1) // ✅ Cachea y comparte la respuesta
			);
		}
		return this.categoriesCache$;
	}

	// ✅ Invalidar caché cuando se actualicen categorías
	invalidateCache(): void {
		this.categoriesCache$ = null;
	}

	private handleError(error: HttpErrorResponse): Observable<never> {
		let errorMessage = 'An error occurred while fetching categories';
		if (error.error instanceof ErrorEvent) {
			errorMessage = error.error.message;
		} else {
			errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
		}
		console.error(errorMessage);
		return throwError(() => new Error(errorMessage));
	}
}
