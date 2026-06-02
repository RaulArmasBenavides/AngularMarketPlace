import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductsService } from './products.service';
import { Product } from '../models/product.model';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  const mockProducts: Product[] = [
    { id: 1, name: 'Product 1', price: 100 },
    { id: 2, name: 'Product 2', price: 200 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductsService]
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.invalidateCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getData with shareReplay caching', () => {
    it('should fetch products from API on first call', () => {
      service.getData().subscribe((products) => {
        expect(products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne((request) => request.url.includes('products.json'));
      expect(req.request.method).toBe('GET');
      req.flush(mockProducts);
    });

    it('should cache products and reuse on subsequent calls', (done) => {
      let callCount = 0;

      // First call - should make HTTP request
      service.getData().subscribe((products) => {
        expect(products).toEqual(mockProducts);
        callCount++;

        // Second call - should use cache (no new HTTP request)
        service.getData().subscribe((cachedProducts) => {
          expect(cachedProducts).toEqual(mockProducts);
          callCount++;

          // Verify only one HTTP request was made
          expect(callCount).toBe(2); // Both subscriptions completed
          done();
        });

        // No second HTTP request expected
        httpMock.expectNone((request) => request.url.includes('products.json'));
      });

      const req = httpMock.expectOne((request) => request.url.includes('products.json'));
      req.flush(mockProducts);
    });

    it('should share the same observable among multiple subscribers', (done) => {
      const firstSub = service.getData();
      const secondSub = service.getData();

      expect(firstSub).toBe(secondSub);

      let emissionCount = 0;

      firstSub.subscribe(() => {
        emissionCount++;
      });

      secondSub.subscribe(() => {
        emissionCount++;
        if (emissionCount === 2) {
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('products.json'));
      req.flush(mockProducts);
    });

    it('should emit cached data immediately to late subscribers', (done) => {
      service.getData().subscribe(() => {
        // Late subscriber should get cached data immediately
        service.getData().subscribe((products) => {
          expect(products).toEqual(mockProducts);
          done();
        });
      });

      const req = httpMock.expectOne((request) => request.url.includes('products.json'));
      req.flush(mockProducts);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate cache when invalidateCache is called', (done) => {
      service.getData().subscribe(() => {
        // Invalidate cache
        service.invalidateCache();

        // Next call should fetch new data
        service.getData().subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('products.json'));
        req2.flush(mockProducts);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('products.json'));
      req1.flush(mockProducts);
    });

    it('should make new request after cache invalidation', (done) => {
      let requestCount = 0;

      service.getData().subscribe(() => {
        requestCount++;
        service.invalidateCache();

        service.getData().subscribe(() => {
          requestCount++;
          expect(requestCount).toBe(2);
          done();
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('products.json'));
        req2.flush(mockProducts);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('products.json'));
      req1.flush(mockProducts);
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors gracefully', (done) => {
      service.getData().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('products.json'));
      req.error(new ErrorEvent('Network error'));
    });

    it('should not cache failed requests', (done) => {
      service.getData().subscribe({
        next: () => fail('should have failed'),
        error: () => {
          service.invalidateCache();

          // Next call should attempt new request
          service.getData().subscribe({
            next: (products) => {
              expect(products).toEqual(mockProducts);
              done();
            },
            error: () => fail('second request should succeed')
          });

          const req2 = httpMock.expectOne((request) => request.url.includes('products.json'));
          req2.flush(mockProducts);
        }
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('products.json'));
      req1.error(new ErrorEvent('Network error'));
    });
  });
});
