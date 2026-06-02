import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubCategoriesService, SubCategory } from './sub-categories.service';

describe('SubCategoriesService', () => {
  let service: SubCategoriesService;
  let httpMock: HttpTestingController;

  const mockSubCategories: SubCategory[] = [
    { id: 1, name: 'Laptops', categoryId: 1 },
    { id: 2, name: 'Phones', categoryId: 1 }
  ];

  const mockSubCategoriesBooks: SubCategory[] = [
    { id: 3, name: 'Fiction', categoryId: 2 },
    { id: 4, name: 'Non-Fiction', categoryId: 2 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubCategoriesService]
    });
    service = TestBed.inject(SubCategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.invalidateCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFilterData with parameterized caching', () => {
    it('should fetch sub-categories for specific parameters', () => {
      const orderBy = 'categoryId';
      const equalTo = '1';

      service.getFilterData(orderBy, equalTo).subscribe((data) => {
        expect(data).toEqual(mockSubCategories);
      });

      const req = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      expect(req.request.method).toBe('GET');
      req.flush(mockSubCategories);
    });

    it('should cache results per parameter combination', (done) => {
      const orderBy = 'categoryId';
      const equalTo1 = '1';
      const equalTo2 = '2';

      service.getFilterData(orderBy, equalTo1).subscribe(() => {
        // Second call with same parameters should use cache
        service.getFilterData(orderBy, equalTo1).subscribe(() => {
          // Call with different parameters should make new request
          service.getFilterData(orderBy, equalTo2).subscribe(() => {
            done();
          });

          const req2 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
          req2.flush(mockSubCategoriesBooks);
        });

        // No request for cached parameters
        httpMock.expectNone((request) => request.url.includes('sub-categories.json'));
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req1.flush(mockSubCategories);
    });

    it('should return same observable for identical parameters', () => {
      const obs1 = service.getFilterData('categoryId', '1');
      const obs2 = service.getFilterData('categoryId', '1');

      expect(obs1).toBe(obs2);

      const req = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req.flush(mockSubCategories);
    });

    it('should return different observables for different parameters', (done) => {
      const obs1 = service.getFilterData('categoryId', '1');
      const obs2 = service.getFilterData('categoryId', '2');

      expect(obs1).not.toBe(obs2);

      service.getFilterData('categoryId', '1').subscribe(() => {
        service.getFilterData('categoryId', '2').subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
        req2.flush(mockSubCategoriesBooks);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req1.flush(mockSubCategories);
    });

    it('should handle multiple parameter combinations independently', (done) => {
      service.getFilterData('categoryId', '1').subscribe(() => {
        service.getFilterData('categoryId', '2').subscribe(() => {
          service.getFilterData('categoryId', '3').subscribe(() => {
            done();
          });

          const req3 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
          req3.flush(mockSubCategoriesBooks);
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
        req2.flush(mockSubCategoriesBooks);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req1.flush(mockSubCategories);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate specific cache by parameters', (done) => {
      const orderBy = 'categoryId';
      const equalTo = '1';

      service.getFilterData(orderBy, equalTo).subscribe(() => {
        service.invalidateCache(orderBy, equalTo);

        // Next call should fetch fresh data
        service.getFilterData(orderBy, equalTo).subscribe(() => {
          done();
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
        req2.flush(mockSubCategories);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req1.flush(mockSubCategories);
    });

    it('should clear all cache when no parameters provided', (done) => {
      service.getFilterData('categoryId', '1').subscribe(() => {
        service.getFilterData('categoryId', '2').subscribe(() => {
          service.invalidateCache(); // Clear all

          service.getFilterData('categoryId', '1').subscribe(() => {
            done();
          });

          const req3 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
          req3.flush(mockSubCategories);
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
        req2.flush(mockSubCategoriesBooks);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req1.flush(mockSubCategories);
    });

    it('should only invalidate specific cache without affecting others', (done) => {
      service.getFilterData('categoryId', '1').subscribe(() => {
        service.getFilterData('categoryId', '2').subscribe(() => {
          service.invalidateCache('categoryId', '1'); // Only invalidate first

          // First should make new request
          service.getFilterData('categoryId', '1').subscribe(() => {
            // Second should use cache
            service.getFilterData('categoryId', '2').subscribe(() => {
              done();
            });

            // No request for cached second parameter
            httpMock.expectNone((request) => request.url.includes('sub-categories.json'));
          });

          const req3 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
          req3.flush(mockSubCategories);
        });

        const req2 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
        req2.flush(mockSubCategoriesBooks);
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req1.flush(mockSubCategories);
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors', (done) => {
      service.getFilterData('categoryId', '1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req.error(new ErrorEvent('Network error'));
    });

    it('should allow retry after error', (done) => {
      const orderBy = 'categoryId';
      const equalTo = '1';

      service.getFilterData(orderBy, equalTo).subscribe({
        next: () => fail('should have failed'),
        error: () => {
          service.invalidateCache(orderBy, equalTo);

          service.getFilterData(orderBy, equalTo).subscribe((data) => {
            expect(data).toEqual(mockSubCategories);
            done();
          });

          const req2 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
          req2.flush(mockSubCategories);
        }
      });

      const req1 = httpMock.expectOne((request) => request.url.includes('sub-categories.json'));
      req1.error(new ErrorEvent('Network error'));
    });
  });
});
