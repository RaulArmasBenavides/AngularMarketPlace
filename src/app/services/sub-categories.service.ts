import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface SubCategory {
	id: number;
	name: string;
	categoryId: number;
	title_list?: string;
	url?: string;
}

@Injectable({
	providedIn: 'root'
})
export class SubCategoriesService {
	private readonly api: string = environment.marketPlaceUrl;
	private subCategoriesCache = new Map<string, Observable<SubCategory[]>>();

	constructor(private readonly http: HttpClient) {}

	/** Subcategorías donde `orderBy` es igual a `equalTo` (p. ej. 'title_list', 'Computers'). */
	getFilterData(orderBy: string, equalTo: string): Observable<SubCategory[]> {
		const cacheKey = `${orderBy}:${equalTo}`;

		if (!this.subCategoriesCache.has(cacheKey)) {
			const params = new HttpParams().set(orderBy, equalTo);
			const request$ = this.http.get<SubCategory[]>(`${this.api}subcategories`, { params }).pipe(
				catchError((error: HttpErrorResponse) => {
					this.subCategoriesCache.delete(cacheKey); // permitir reintentar
					return this.handleError(error);
				}),
				shareReplay(1)
			);
			this.subCategoriesCache.set(cacheKey, request$);
		}

		return this.subCategoriesCache.get(cacheKey)!;
	}

	invalidateCache(orderBy?: string, equalTo?: string): void {
		if (orderBy && equalTo) {
			this.subCategoriesCache.delete(`${orderBy}:${equalTo}`);
		} else {
			this.subCategoriesCache.clear();
		}
	}

	private handleError(error: HttpErrorResponse): Observable<never> {
		const message = `Error al cargar subcategorías (${error.status || 'sin conexión'})`;
		console.error(message, error.message);
		return throwError(() => new Error(message));
	}
}
