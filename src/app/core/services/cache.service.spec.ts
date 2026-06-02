import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CacheService]
    });
    service = TestBed.inject(CacheService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  describe('GET with caching', () => {
    it('should cache GET requests by default', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1, name: 'Product 1' }];

      service.get(url).subscribe((data) => {
        expect(data).toEqual(mockData);

        // Second call should use cache
        service.get(url).subscribe((cachedData) => {
          expect(cachedData).toEqual(mockData);
          done();
        });

        // Verify no second HTTP request was made
        httpMock.expectNone(url);
      });

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });

    it('should not cache when cacheable is false', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1, name: 'Product 1' }];

      service.get(url, { cacheable: false }).subscribe(() => {
        service.get(url, { cacheable: false }).subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne(url);
        req2.flush(mockData);
      });

      const req1 = httpMock.expectOne(url);
      req1.flush(mockData);
    });

    it('should expire cache after specified duration', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1, name: 'Product 1' }];
      const duration = 100; // 100ms

      service.get(url, { duration }).subscribe(() => {
        // Wait for cache to expire
        setTimeout(() => {
          service.get(url, { duration }).subscribe(() => {
            done();
          });

          // Should make a new request
          const req2 = httpMock.expectOne(url);
          req2.flush(mockData);
        }, 150);
      });

      const req1 = httpMock.expectOne(url);
      req1.flush(mockData);
    });

    it('should use default duration when not specified', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1, name: 'Product 1' }];

      service.get(url).subscribe(() => {
        // Cache should still be valid
        service.get(url).subscribe(() => {
          expect(true).toBe(true);
          done();
        });

        httpMock.expectNone(url);
      });

      const req = httpMock.expectOne(url);
      req.flush(mockData);
    });
  });

  describe('POST method', () => {
    it('should make POST request without caching by default', (done) => {
      const url = '/api/products';
      const body = { name: 'New Product' };
      const mockResponse = { id: 1, ...body };

      service.post(url, body).subscribe(() => {
        service.post(url, body).subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne(url);
        req2.flush(mockResponse);
      });

      const req1 = httpMock.expectOne(url);
      expect(req1.request.method).toBe('POST');
      expect(req1.request.body).toEqual(body);
      req1.flush(mockResponse);
    });

    it('should cache POST response when cacheable is true', (done) => {
      const url = '/api/products';
      const body = { name: 'New Product' };
      const mockResponse = { id: 1, ...body };

      service.post(url, body, { cacheable: true }).subscribe(() => {
        service.get(url).subscribe((data) => {
          expect(data).toEqual(mockResponse);
          done();
        });

        httpMock.expectNone(url);
      });

      const req = httpMock.expectOne(url);
      req.flush(mockResponse);
    });
  });

  describe('PUT method', () => {
    it('should make PUT request without caching by default', (done) => {
      const url = '/api/products/1';
      const body = { name: 'Updated Product' };
      const mockResponse = { id: 1, ...body };

      service.put(url, body).subscribe(() => {
        service.put(url, body).subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne(url);
        req2.flush(mockResponse);
      });

      const req1 = httpMock.expectOne(url);
      expect(req1.request.method).toBe('PUT');
      req1.flush(mockResponse);
    });
  });

  describe('DELETE method', () => {
    it('should invalidate cache on DELETE', (done) => {
      const url = '/api/products/1';
      const getUrl = '/api/products';
      const mockData = [{ id: 1, name: 'Product 1' }];

      // First, cache some data
      service.get(getUrl).subscribe(() => {
        // Delete should invalidate the cache
        service.delete(url).subscribe(() => {
          service.invalidateCache(getUrl);

          // Next get should fetch fresh data
          service.get(getUrl).subscribe(() => {
            done();
          });

          const req3 = httpMock.expectOne(getUrl);
          req3.flush(mockData);
        });

        const req2 = httpMock.expectOne(url);
        expect(req2.request.method).toBe('DELETE');
        req2.flush({});
      });

      const req1 = httpMock.expectOne(getUrl);
      req1.flush(mockData);
    });

    it('should invalidate related cache keys', (done) => {
      const deleteUrl = '/api/products/1';
      const listUrl = '/api/products';
      const mockData = [{ id: 1 }];

      service.get(listUrl).subscribe(() => {
        service.delete(deleteUrl, [listUrl]).subscribe(() => {
          // Cache should be invalidated
          service.get(listUrl).subscribe(() => {
            done();
          });

          const req3 = httpMock.expectOne(listUrl);
          req3.flush(mockData);
        });

        const req2 = httpMock.expectOne(deleteUrl);
        req2.flush({});
      });

      const req1 = httpMock.expectOne(listUrl);
      req1.flush(mockData);
    });
  });

  describe('Cache management', () => {
    it('should invalidate specific cache', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1 }];

      service.get(url).subscribe(() => {
        service.invalidateCache(url);

        service.get(url).subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne(url);
        req2.flush(mockData);
      });

      const req1 = httpMock.expectOne(url);
      req1.flush(mockData);
    });

    it('should clear all cache', (done) => {
      const url1 = '/api/products';
      const url2 = '/api/categories';
      const mockData = [{ id: 1 }];

      service.get(url1).subscribe(() => {
        service.get(url2).subscribe(() => {
          service.clearCache();

          service.get(url1).subscribe(() => {
            done();
          });

          const req3 = httpMock.expectOne(url1);
          req3.flush(mockData);
        });

        const req2 = httpMock.expectOne(url2);
        req2.flush(mockData);
      });

      const req1 = httpMock.expectOne(url1);
      req1.flush(mockData);
    });

    it('should return cache statistics', () => {
      const url1 = '/api/products';
      const url2 = '/api/categories';
      const mockData = [{ id: 1 }];

      service.get(url1).subscribe();
      const req1 = httpMock.expectOne(url1);
      req1.flush(mockData);

      service.get(url2).subscribe();
      const req2 = httpMock.expectOne(url2);
      req2.flush(mockData);

      const stats = service.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain(url1);
      expect(stats.keys).toContain(url2);
    });
  });

  describe('Cache cleanup', () => {
    it('should auto-cleanup expired entries', (done) => {
      const url = '/api/products';
      const mockData = [{ id: 1 }];
      const duration = 50; // 50ms

      service.get(url, { duration }).subscribe(() => {
        const statsBefore = service.getCacheStats();
        expect(statsBefore.size).toBe(1);

        setTimeout(() => {
          // Manually trigger cleanup check
          service.invalidateCache(url);

          const statsAfter = service.getCacheStats();
          expect(statsAfter.size).toBe(0);
          done();
        }, 100);
      });

      const req = httpMock.expectOne(url);
      req.flush(mockData);
    });
  });
});
