import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpRequestInterceptor } from './http-request.interceptor';
import { AuthService } from '../services/auth.service';

describe('HttpRequestInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpRequestInterceptor,
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpRequestInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token injection', () => {
    it('should add Authorization header when token is present', () => {
      const token = 'test-token-123';
      authService.getToken.and.returnValue(token);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush({});
    });

    it('should not add Authorization header when token is null', () => {
      authService.getToken.and.returnValue(null);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not add Authorization header when token is undefined', () => {
      authService.getToken.and.returnValue(undefined);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not add Authorization header when token is empty string', () => {
      authService.getToken.and.returnValue('');

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should use correct Bearer token format', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      authService.getToken.and.returnValue(token);

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush({});
    });
  });

  describe('Request forwarding', () => {
    it('should forward request to next handler', () => {
      authService.getToken.and.returnValue('token');

      const data = { id: 1, name: 'Test' };
      httpClient.get('/api/test').subscribe((response) => {
        expect(response).toEqual(data);
      });

      const req = httpMock.expectOne('/api/test');
      req.flush(data);
    });

    it('should preserve request method', () => {
      authService.getToken.and.returnValue('token');

      httpClient.post('/api/test', { data: 'test' }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should preserve request body', () => {
      authService.getToken.and.returnValue('token');
      const body = { name: 'Test', value: 123 };

      httpClient.post('/api/test', body).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });

    it('should preserve other request headers', () => {
      authService.getToken.and.returnValue('token');

      httpClient.get('/api/test', {
        headers: { 'Custom-Header': 'custom-value' }
      }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Custom-Header')).toBe('custom-value');
      expect(req.request.headers.get('Authorization')).toBe('Bearer token');
      req.flush({});
    });
  });

  describe('Multiple requests', () => {
    it('should add token to all requests when token is available', () => {
      const token = 'test-token';
      authService.getToken.and.returnValue(token);

      httpClient.get('/api/users').subscribe();
      httpClient.get('/api/products').subscribe();
      httpClient.post('/api/orders', {}).subscribe();

      const reqs = httpMock.match(() => true);
      expect(reqs.length).toBe(3);

      reqs.forEach((req) => {
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
        req.flush({});
      });
    });

    it('should update token across requests when token changes', () => {
      authService.getToken.and.returnValue('token-v1');

      httpClient.get('/api/test1').subscribe();
      const req1 = httpMock.expectOne('/api/test1');
      expect(req1.request.headers.get('Authorization')).toBe('Bearer token-v1');
      req1.flush({});

      // Token changes
      authService.getToken.and.returnValue('token-v2');

      httpClient.get('/api/test2').subscribe();
      const req2 = httpMock.expectOne('/api/test2');
      expect(req2.request.headers.get('Authorization')).toBe('Bearer token-v2');
      req2.flush({});
    });
  });

  describe('Different HTTP methods', () => {
    const httpMethods = [
      { method: 'GET', call: () => httpClient.get('/api/test') },
      { method: 'POST', call: () => httpClient.post('/api/test', {}) },
      { method: 'PUT', call: () => httpClient.put('/api/test', {}) },
      { method: 'DELETE', call: () => httpClient.delete('/api/test') },
      { method: 'PATCH', call: () => httpClient.patch('/api/test', {}) }
    ];

    httpMethods.forEach(({ method, call }) => {
      it(`should add token to ${method} requests`, () => {
        const token = 'test-token';
        authService.getToken.and.returnValue(token);

        call().subscribe();

        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
        req.flush({});
      });
    });
  });
});
