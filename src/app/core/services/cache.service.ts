import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface CacheConfig {
  duration?: number; // Duración en milisegundos, 0 = sin expiración
  cacheable?: boolean; // Si se debe cachear
}

interface CacheEntry {
  data: any;
  timestamp: number;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultDuration = 5 * 60 * 1000; // 5 minutos

  constructor(private http: HttpClient) {
    this.startCacheCleanup();
  }

  /**
   * Obtiene del caché o hace request
   */
  get<T>(url: string, config: CacheConfig = {}): Observable<T> {
    const { duration = this.defaultDuration, cacheable = true } = config;

    if (!cacheable) {
      return this.http.get<T>(url);
    }

    // Verificar caché válido
    const cached = this.getFromCache<T>(url);
    if (cached !== null) {
      return of(cached);
    }

    // Request y cachear
    return this.http.get<T>(url).pipe(
      tap((data) => this.setInCache(url, data, duration)),
      shareReplay(1)
    );
  }

  /**
   * POST sin caché (por defecto)
   */
  post<T>(url: string, body: any, config: CacheConfig = {}): Observable<T> {
    return this.http.post<T>(url, body).pipe(
      tap((data) => {
        if (config.cacheable) {
          this.setInCache(url, data, config.duration);
        }
      })
    );
  }

  /**
   * PUT sin caché (por defecto)
   */
  put<T>(url: string, body: any, config: CacheConfig = {}): Observable<T> {
    return this.http.put<T>(url, body).pipe(
      tap((data) => {
        if (config.cacheable) {
          this.setInCache(url, data, config.duration);
        }
      })
    );
  }

  /**
   * DELETE - invalida caché relacionado
   */
  delete<T>(url: string, relatedCacheKeys?: string[]): Observable<T> {
    return this.http.delete<T>(url).pipe(
      tap(() => {
        this.invalidateCache(url);
        if (relatedCacheKeys) {
          relatedCacheKeys.forEach((key) => this.invalidateCache(key));
        }
      })
    );
  }

  /**
   * Invalida caché específico
   */
  invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalida todo el caché
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtiene del caché si está válido
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar expiración
    if (entry.duration && Date.now() - entry.timestamp > entry.duration) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda en caché
   */
  private setInCache(key: string, data: any, duration?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    });
  }

  /**
   * Limpieza automática de caché expirado
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();

      this.cache.forEach((entry, key) => {
        if (entry.duration && now - entry.timestamp > entry.duration) {
          this.cache.delete(key);
        }
      });
    }, 60000); // Cada minuto
  }

  /**
   * Obtiene estadísticas del caché
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
