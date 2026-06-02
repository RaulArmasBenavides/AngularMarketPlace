import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

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

	constructor(private readonly http: HttpClient) {}

	getFilterData(orderBy: string, equalTo: string): Observable<SubCategory[]> {
		return this.http.get<SubCategory[]>(
			`${this.api}sub-categories.json?orderBy="${orderBy}"&equalTo="${equalTo}"&print=pretty`
		).pipe(
			catchError(this.handleError)
		);
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
