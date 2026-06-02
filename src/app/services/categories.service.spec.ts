import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoriesService } from './categories.service';
import { Category } from '../models/category.model';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;

  const mockCategories: Category[] = [
    { id: 1, name: 'Electronics', parentId: null },
    { id: 2, name: 'Books', parentId: null }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoriesService]
    });
    service = TestBed.inject(CategoriesService);
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
    it('should fetch categories from API on first call', () => {
      service.getData().subscribe((categories) => {
        expect(categories).toEqual(mockCategories);
      });

      const req = httpMock.expectOne((request) => request.url.includes('categories.json'));
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });

    it('should cache categories and reuse on subsequent calls', (done) => {
      service.getData().subscribe(() => {
        // Second call should use cache
        service.getData().subscribe((cachedCategories) => {
          expect(cachedCategories).toEqual(mockCategories);
          done();
        });

        // No second HTTP request expected
        httpMock.expectNone((request) => request.url.includes('categories.json'));
      });

      const req = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req.flush(mockCategories);
    });

    it('should return the same observable on multiple calls', () => {
      const obs1 = service.getData();
      const obs2 = service.getData();
      const obs3 = service.getData();

      expect(obs1).toBe(obs2);
      expect(obs2).toBe(obs3);

      const req = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req.flush(mockCategories);
    });

    it('should emit cached data to multiple concurrent subscribers', (done) => {
      let emissionCount = 0;

      service.getData().subscribe(() => emissionCount++);
      service.getData().subscribe(() => emissionCount++);
      service.getData().subscribe(() => {
        emissionCount++;
        if (emissionCount === 3) {
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req.flush(mockCategories);
    });

    it('should emit to late subscribers with cached value', (done) => {
      const firstObservable = service.getData();

      firstObservable.subscribe(() => {
        // Late subscriber
        service.getData().subscribe((categories) => {
          expect(categories).toEqual(mockCategories);
          done();
        });
      });

      const req = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req.flush(mockCategories);
    });
  });

  describe('Cache invalidation', () => {
    it('should clear cache when invalidateCache is called', (done) => {
      service.getData().subscribe(() => {
        service.invalidateCache();

        // Next call should fetch fresh data
        service.getData().subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('categories.json'));
        req2.flush(mockCategories);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req1.flush(mockCategories);
    });

    it('should require new HTTP request after invalidation', (done) => {
      let firstRequestDone = false;

      service.getData().subscribe(() => {
        firstRequestDone = true;
        service.invalidateCache();

        service.getData().subscribe(() => {
          expect(firstRequestDone).toBe(true);
          done();
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('categories.json'));
        expect(req2).toBeTruthy();
        req2.flush(mockCategories);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req1.flush(mockCategories);
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors', (done) => {
      service.getData().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req.error(new ErrorEvent('Network error'));
    });

    it('should allow retry after error', (done) => {
      service.getData().subscribe({
        next: () => fail('should have failed'),
        error: () => {
          // Clear error and retry
          service.invalidateCache();

          service.getData().subscribe((categories) => {
            expect(categories).toEqual(mockCategories);
            done();
          });

          const req2 = httpMock.expectOne((request) => request.url.includes('categories.json'));
          req2.flush(mockCategories);
        }
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req1.error(new ErrorEvent('Network error'));
    });
  });

  describe('Multiple subscribers behavior', () => {
    it('should handle rapid successive calls efficiently', (done) => {
      let completedCount = 0;

      const onComplete = () => {
        completedCount++;
        if (completedCount === 5) {
          done();
        }
      };

      service.getData().subscribe({ next: () => {}, complete: onComplete });
      service.getData().subscribe({ next: () => {}, complete: onComplete });
      service.getData().subscribe({ next: () => {}, complete: onComplete });
      service.getData().subscribe({ next: () => {}, complete: onComplete });
      service.getData().subscribe({ next: () => {}, complete: onComplete });

      const req = httpMock.expectOne((request) => request.url.includes('categories.json'));
      req.flush(mockCategories);
    });
  });
});
