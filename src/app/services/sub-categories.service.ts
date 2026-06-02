import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MockDataService } from '../core/services/mock-data.service';

export interface SubCategory {
	id: number;
	name: string;
	categoryId: number;
}

@Injectable({
	providedIn: 'root'
})
export class SubCategoriesService {
	private readonly api: string = environment.marketPlaceUrl;
	private subCategoriesCache = new Map<string, Observable<SubCategory[]>>();

	constructor(
		private readonly http: HttpClient,
		private readonly mockDataService: MockDataService
	) {}

	getFilterData(orderBy: string, equalTo: string): Observable<SubCategory[]> {
		const cacheKey = `${orderBy}:${equalTo}`;

		// ✅ Caché basado en parámetros
		if (!this.subCategoriesCache.has(cacheKey)) {
			// 🎯 Primero intenta mock data (local JSON)
			// Si no existe, fallback a backend
			const request$ = this.mockDataService.getFilteredSubCategories(orderBy, equalTo).pipe(
				catchError((mockError) => {
					console.log('Mock data not available, trying backend:', mockError.message);
					// Si mock data no existe, intenta backend
					return this.http.get<SubCategory[]>(
						`${this.api}sub-categories.json?orderBy="${orderBy}"&equalTo="${equalTo}"&print=pretty`
					).pipe(
						catchError((backendError) => {
							console.error('Backend unavailable:', backendError.message);
							return this.handleError(backendError);
						})
					);
				}),
				shareReplay(1) // ✅ Cachea la respuesta
			);
			this.subCategoriesCache.set(cacheKey, request$);
		}

		return this.subCategoriesCache.get(cacheKey)!;
	}

	// ✅ Invalidar caché específico por parámetro
	invalidateCache(orderBy?: string, equalTo?: string): void {
		if (orderBy && equalTo) {
			const cacheKey = `${orderBy}:${equalTo}`;
			this.subCategoriesCache.delete(cacheKey);
		} else {
			// Limpiar todo el caché
			this.subCategoriesCache.clear();
		}
	}

	private handleError(error: HttpErrorResponse): Observable<never> {
		let errorMessage = 'An error occurred while fetching sub-categories';
		if (error.error instanceof ErrorEvent) {
			errorMessage = error.error.message;
		} else {
			errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
		}
		console.error(errorMessage);
		return throwError(() => new Error(errorMessage));
	}
}
