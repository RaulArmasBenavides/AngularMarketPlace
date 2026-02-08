import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';



@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  private readonly api: string = environment.marketPlaceUrl;

  constructor(private readonly http: HttpClient) { }

  getData(){

   return this.http.get(`${this.api}products.json`);

	}
}
