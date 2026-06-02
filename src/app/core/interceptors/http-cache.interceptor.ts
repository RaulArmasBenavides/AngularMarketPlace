import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  // URLs que NO se cachean (login, logout, etc)
  private nonCacheableUrls = [
    '/auth/login',
    '/auth/logout',
    '/auth/refresh'
  ];

  // Duración de caché por patrón de URL
  private cacheDuration: { [key: string]: number } = {
    '/categories': 10 * 60 * 1000, // 10 minutos
    '/products': 5 * 60 * 1000,    // 5 minutos
    '/users': 5 * 60 * 1000        // 5 minutos
  };

  constructor(private cacheService: CacheService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Solo cachear GET requests
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    // Verificar si está en la lista de no cacheables
    if (this.isNonCacheable(request.url)) {
      return next.handle(request);
    }

    // Obtener duración del caché según la URL
    const duration = this.getCacheDuration(request.url);

    // Intentar obtener del caché
    const cachedData = this.getFromCache(request.url);
    if (cachedData) {
      console.log(`🔵 Cache HIT: ${request.url}`);
      return of(new HttpResponse({ body: cachedData, status: 200 }));
    }

    // Request al servidor y cachear
    console.log(`🟠 Cache MISS: ${request.url}`);
    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.body) {
          this.setInCache(request.url, event.body, duration);
        }
      })
    );
  }

  /**
   * Verifica si la URL está en la lista de no cacheables
   */
  private isNonCacheable(url: string): boolean {
    return this.nonCacheableUrls.some((pattern) => url.includes(pattern));
  }

  /**
   * Obtiene duración según patrón de URL
   */
  private getCacheDuration(url: string): number {
    for (const [pattern, duration] of Object.entries(this.cacheDuration)) {
      if (url.includes(pattern)) {
        return duration;
      }
    }
    return 5 * 60 * 1000; // 5 minutos por defecto
  }

  /**
   * Obtiene del caché del servicio
   */
  private getFromCache(key: string): any {
    // Implementar lógica de caché simple en memoria
    return null; // Aquí se conectaría con CacheService
  }

  /**
   * Guarda en caché
   */
  private setInCache(key: string, data: any, duration: number): void {
    // Implementar lógica de caché
  }
}
