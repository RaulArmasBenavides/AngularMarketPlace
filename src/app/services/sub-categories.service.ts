import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
	providedIn: 'root'
})
export class SubCategoriesService {
	private readonly api: string = environment.marketPlaceUrl;

	constructor(private readonly http: HttpClient) {}
	getFilterData(orderBy: any, equalTo: any) {
		return this.http.get(`${this.api}sub-categories.json?orderBy="${orderBy}"&equalTo="${equalTo}"&print=pretty`);
	}
}
