import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpErrorInterceptor } from './http-error.interceptor';
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../services/notification.service';

describe('HttpErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let loadingService: jasmine.SpyObj<LoadingService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['show', 'hide']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showError',
      'showSuccess',
      'showWarning',
      'showInfo'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpErrorInterceptor,
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpErrorInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Loading state management', () => {
    it('should show loading indicator on request', () => {
      httpClient.get('/api/test').subscribe(() => {}, () => {});

      expect(loadingService.show).toHaveBeenCalled();

      const req = httpMock.expectOne('/api/test');
      req.flush({});
    });

    it('should hide loading indicator on successful response', (done) => {
      httpClient.get('/api/test').subscribe(() => {
        expect(loadingService.hide).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ data: 'success' });
    });

    it('should hide loading indicator on error', (done) => {
      httpClient.get('/api/test').subscribe(() => {}, () => {
        expect(loadingService.hide).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ErrorEvent('Network error'));
    });

    it('should call hide even if error is thrown', (done) => {
      httpClient.get('/api/test').subscribe(() => {}, () => {
        expect(loadingService.hide).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'));
    });
  });

  describe('Error handling', () => {
    it('should handle server error responses (4xx/5xx)', (done) => {
      httpClient.get('/api/test').subscribe(() => {}, (error) => {
        expect(error.status).toBe(404);
        expect(notificationService.showError).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors', (done) => {
      httpClient.get('/api/test').subscribe(() => {}, (error) => {
        expect(notificationService.showError).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ErrorEvent('Network error', {
        message: 'Connection refused'
      }));
    });

    it('should show error notification on HTTP error', (done) => {
      httpClient.get('/api/test').subscribe(() => {}, () => {
        expect(notificationService.showError).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should not show error notification on success', (done) => {
      httpClient.get('/api/test').subscribe(() => {
        expect(notificationService.showError).not.toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ data: 'success' });
    });
  });

  describe('Error message formatting', () => {
    it('should format client-side errors correctly', (done) => {
      httpClient.get('/api/test').subscribe(() => {}, () => {
        const callArgs = notificationService.showError.calls.mostRecent().args[0];
        expect(callArgs).toContain('Error:');
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ErrorEvent('Client error', {
        message: 'Something went wrong'
      }));
    });

    it('should format server-side errors correctly', (done) => {
      httpClient.get('/api/test').subscribe(() => {}, () => {
        const callArgs = notificationService.showError.calls.mostRecent().args[0];
        expect(callArgs).toContain('Error Code: 500');
        done();
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle various HTTP status codes', (done) => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];
      let completed = 0;

      statusCodes.forEach((status) => {
        httpClient.get(`/api/test-${status}`).subscribe(() => {}, () => {
          completed++;
          if (completed === statusCodes.length) {
            expect(notificationService.showError).toHaveBeenCalledTimes(statusCodes.length);
            done();
          }
        });

        const req = httpMock.expectOne(`/api/test-${status}`);
        req.flush('Error', { status, statusText: `Error ${status}` });
      });
    });
  });

  describe('Error propagation', () => {
    it('should propagate error to subscriber', (done) => {
      httpClient.get('/api/test').subscribe(
        () => fail('should have errored'),
        (error: HttpErrorResponse) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne('/api/test');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should allow error handling in subscriber', (done) => {
      let errorHandled = false;

      httpClient.get('/api/test').subscribe(
        () => fail('should have errored'),
        (error) => {
          errorHandled = true;
          expect(error).toBeTruthy();
          done();
        }
      );

      const req = httpMock.expectOne('/api/test');
      req.error(new ErrorEvent('Network error'));
    });

    it('should maintain error details for downstream handling', (done) => {
      httpClient.get('/api/test').subscribe(
        () => fail('should have errored'),
        (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
          done();
        }
      );

      const req = httpMock.expectOne('/api/test');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Multiple requests', () => {
    it('should handle multiple concurrent requests with errors', (done) => {
      let completed = 0;

      httpClient.get('/api/test1').subscribe(() => {}, () => {
        completed++;
        if (completed === 2) done();
      });

      httpClient.get('/api/test2').subscribe(() => {}, () => {
        completed++;
        if (completed === 2) done();
      });

      const reqs = httpMock.match(() => true);
      expect(reqs.length).toBe(2);

      reqs.forEach((req) => {
        expect(loadingService.show).toHaveBeenCalled();
        req.error(new ErrorEvent('Network error'));
      });

      expect(loadingService.hide).toHaveBeenCalledTimes(2);
    });

    it('should handle mix of successful and failed requests', (done) => {
      let completed = 0;

      httpClient.get('/api/success').subscribe(() => {
        completed++;
        if (completed === 2) {
          expect(notificationService.showError).toHaveBeenCalledTimes(1);
          done();
        }
      });

      httpClient.get('/api/error').subscribe(() => {}, () => {
        completed++;
        if (completed === 2) {
          expect(notificationService.showError).toHaveBeenCalledTimes(1);
          done();
        }
      });

      const reqs = httpMock.match(() => true);
      reqs[0].flush({ data: 'success' });
      reqs[1].error(new ErrorEvent('Network error'));
    });
  });
});
