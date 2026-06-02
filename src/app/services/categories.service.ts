import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Category } from '../models/category.model';

@Injectable({
	providedIn: 'root'
})
export class CategoriesService {
	private readonly api: string = environment.marketPlaceUrl;

	constructor(private readonly http: HttpClient) {}

	getData(): Observable<Category[]> {
		return this.http.get<Category[]>(`${this.api}categories.json`).pipe(
			catchError(this.handleError)
		);
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
