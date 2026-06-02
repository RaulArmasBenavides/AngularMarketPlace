import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Mock Data Service
 * Provides data from JSON files in assets/data/
 * Perfect for development without a backend server
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly baseUrl = '/assets/data';

  constructor(private readonly http: HttpClient) {}

  /**
   * Load products from mock JSON
   */
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products.json`);
  }

  /**
   * Load categories from mock JSON
   */
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories.json`);
  }

  /**
   * Load subcategories from mock JSON
   */
  getSubCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subcategories.json`);
  }

  /**
   * Get subcategories filtered by parameter
   * Useful for replicating Firebase query behavior
   */
  getFilteredSubCategories(filterKey: string, filterValue: string): Observable<any[]> {
    return new Observable((observer) => {
      this.getSubCategories().subscribe({
        next: (data: any[]) => {
          const filtered = data.filter((item) => item[filterKey] === filterValue);
          observer.next(filtered);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }
}
