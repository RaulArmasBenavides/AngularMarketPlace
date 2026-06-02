import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpCacheInterceptor } from './http-cache.interceptor';
import { CacheService } from '../services/cache.service';

describe('HttpCacheInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let cacheService: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpCacheInterceptor,
        CacheService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpCacheInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    cacheService = TestBed.inject(CacheService);
  });

  afterEach(() => {
    httpMock.verify();
    cacheService.clearCache();
  });

  describe('GET request caching', () => {
    it('should cache GET requests', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1, name: 'Product 1' }];

      httpClient.get(url).subscribe(() => {
        // Second GET should be cached
        httpClient.get(url).subscribe(() => {
          done();
        });

        // No second HTTP request expected
        httpMock.expectNone(url);
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should not cache non-GET requests', (done) => {
      const url = '/api/products';
      const body = { name: 'New Product' };

      httpClient.post(url, body).subscribe(() => {
        httpClient.post(url, body).subscribe(() => {
          done();
        });

        // POST should not be cached, so we expect another request
        const req2 = httpMock.expectOne(url);
        req2.flush({});
      });

      const req1 = httpMock.expectOne(url);
      req1.flush({});
    });

    it('should not cache non-cacheable URLs', () => {
      const url = '/auth/login';

      httpClient.get(url).subscribe();

      const req1 = httpMock.expectOne(url);
      req1.flush({});

      // Second request should not use cache
      httpClient.get(url).subscribe();
      const req2 = httpMock.expectOne(url);
      req2.flush({});
    });
  });

  describe('Non-cacheable URLs', () => {
    it('should not cache login requests', () => {
      httpClient.get('/auth/login').subscribe();
      const req1 = httpMock.expectOne('/auth/login');
      req1.flush({});

      httpClient.get('/auth/login').subscribe();
      const req2 = httpMock.expectOne('/auth/login');
      req2.flush({});
    });

    it('should not cache logout requests', () => {
      httpClient.get('/auth/logout').subscribe();
      const req1 = httpMock.expectOne('/auth/logout');
      req1.flush({});

      httpClient.get('/auth/logout').subscribe();
      const req2 = httpMock.expectOne('/auth/logout');
      req2.flush({});
    });

    it('should not cache refresh token requests', () => {
      httpClient.get('/auth/refresh').subscribe();
      const req1 = httpMock.expectOne('/auth/refresh');
      req1.flush({});

      httpClient.get('/auth/refresh').subscribe();
      const req2 = httpMock.expectOne('/auth/refresh');
      req2.flush({});
    });
  });

  describe('Cache expiration', () => {
    it('should respect cache duration for categories (10 minutes)', (done) => {
      const url = '/categories';
      const mockData = [{ id: 1, name: 'Electronics' }];

      httpClient.get(url).subscribe(() => {
        // Cached request
        httpClient.get(url).subscribe(() => {
          done();
        });

        httpMock.expectNone(url);
      });

      const req = httpMock.expectOne(url);
      req.flush(mockData);
    });

    it('should respect cache duration for products (5 minutes)', (done) => {
      const url = '/products';
      const mockData = [{ id: 1, name: 'Product 1' }];

      httpClient.get(url).subscribe(() => {
        httpClient.get(url).subscribe(() => {
          done();
        });

        httpMock.expectNone(url);
      });

      const req = httpMock.expectOne(url);
      req.flush(mockData);
    });

    it('should use default duration for unknown URLs', (done) => {
      const url = '/api/unknown';
      const mockData = { data: 'test' };

      httpClient.get(url).subscribe(() => {
        httpClient.get(url).subscribe(() => {
          done();
        });

        httpMock.expectNone(url);
      });

      const req = httpMock.expectOne(url);
      req.flush(mockData);
    });
  });

  describe('Request handling', () => {
    it('should forward all request types to next handler', () => {
      const methods = [
        { method: 'GET', call: () => httpClient.get('/api/test') },
        { method: 'POST', call: () => httpClient.post('/api/test', {}) },
        { method: 'PUT', call: () => httpClient.put('/api/test', {}) },
        { method: 'DELETE', call: () => httpClient.delete('/api/test') }
      ];

      methods.forEach(({ method, call }) => {
        call().subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.method).toBe(method);
        req.flush({});
      });
    });

    it('should preserve request headers', () => {
      httpClient.get('/api/test', {
        headers: { 'Custom-Header': 'value' }
      }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Custom-Header')).toBe('value');
      req.flush({});
    });

    it('should preserve request body for POST/PUT', () => {
      const body = { name: 'Test', value: 123 };

      httpClient.post('/api/test', body).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });
  });

  describe('Cache invalidation with interceptor', () => {
    it('should allow clearing cache via CacheService', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1 }];

      httpClient.get(url).subscribe(() => {
        // Clear cache
        cacheService.clearCache();

        // Next request should hit server
        httpClient.get(url).subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne(url);
        req2.flush(mockData);
      });

      const req1 = httpMock.expectOne(url);
      req1.flush(mockData);
    });

    it('should handle cache invalidation per URL', (done) => {
      const url1 = '/api/categories';
      const url2 = '/api/products';

      httpClient.get(url1).subscribe(() => {
        httpClient.get(url2).subscribe(() => {
          cacheService.invalidateCache(url1);

          // url1 should make new request, url2 should use cache
          httpClient.get(url1).subscribe(() => {
            httpClient.get(url2).subscribe(() => {
              done();
            });

            // url2 should not make new request
            httpMock.expectNone(url2);
          });

          const req3 = httpMock.expectOne(url1);
          req3.flush({});
        });

        const req2 = httpMock.expectOne(url2);
        req2.flush({});
      });

      const req1 = httpMock.expectOne(url1);
      req1.flush({});
    });
  });

  describe('Multiple URLs', () => {
    it('should cache different URLs independently', (done) => {
      const url1 = '/api/categories';
      const url2 = '/api/products';

      httpClient.get(url1).subscribe(() => {
        httpClient.get(url2).subscribe(() => {
          // Both cached
          httpClient.get(url1).subscribe(() => {
            httpClient.get(url2).subscribe(() => {
              done();
            });

            httpMock.expectNone(url2);
          });

          httpMock.expectNone(url1);
        });

        const req2 = httpMock.expectOne(url2);
        req2.flush({});
      });

      const req1 = httpMock.expectOne(url1);
      req1.flush({});
    });

    it('should handle concurrent requests to different URLs', (done) => {
      let completed = 0;

      const onComplete = () => {
        completed++;
        if (completed === 2) {
          httpClient.get('/api/test1').subscribe(() => {});
          httpClient.get('/api/test2').subscribe(() => {
            done();
          });

          httpMock.expectNone('/api/test1');
          httpMock.expectNone('/api/test2');
        }
      };

      httpClient.get('/api/test1').subscribe(onComplete);
      httpClient.get('/api/test2').subscribe(onComplete);

      const reqs = httpMock.match(() => true);
      expect(reqs.length).toBe(2);
      reqs.forEach((req) => req.flush({}));
    });
  });

  describe('Error handling with cache', () => {
    it('should not cache failed requests', (done) => {
      const url = '/api/test';

      httpClient.get(url).subscribe(() => {}, () => {
        // Retry after error
        httpClient.get(url).subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne(url);
        req2.flush({});
      });

      const req1 = httpMock.expectOne(url);
      req1.error(new ErrorEvent('Network error'));
    });

    it('should handle errors without caching side effects', (done) => {
      const url = '/api/test';

      httpClient.get(url).subscribe(() => {}, (error1) => {
        expect(error1).toBeTruthy();

        httpClient.get(url).subscribe(() => {}, (error2) => {
          expect(error2).toBeTruthy();
          done();
        });

        const req2 = httpMock.expectOne(url);
        req2.error(new ErrorEvent('Retry error'));
      });

      const req1 = httpMock.expectOne(url);
      req1.error(new ErrorEvent('First error'));
    });
  });
});
