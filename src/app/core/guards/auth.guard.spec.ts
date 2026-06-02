import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('canActivate', () => {
    it('should allow activation when user is authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/protected' } as RouterStateSnapshot
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should deny activation and redirect to login when not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/checkout' } as RouterStateSnapshot
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/checkout' }
      });
    });

    it('should include return URL in navigation query params', () => {
      authService.isAuthenticated.and.returnValue(false);
      const testUrl = '/products/123';

      guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: testUrl } as RouterStateSnapshot
      );

      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: testUrl }
      });
    });

    it('should handle various URLs with return navigation', () => {
      authService.isAuthenticated.and.returnValue(false);
      const urls = ['/admin', '/profile', '/account/settings', '/checkout/review'];

      urls.forEach((url) => {
        guard.canActivate(
          {} as ActivatedRouteSnapshot,
          { url } as RouterStateSnapshot
        );

        expect(router.navigate).toHaveBeenCalledWith(['/login'], {
          queryParams: { returnUrl: url }
        });
      });
    });

    it('should call authService.isAuthenticated', () => {
      authService.isAuthenticated.and.returnValue(true);

      guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/test' } as RouterStateSnapshot
      );

      expect(authService.isAuthenticated).toHaveBeenCalled();
    });

    it('should work with multiple consecutive calls', () => {
      authService.isAuthenticated.and.returnValue(true);

      // First call - authenticated
      let result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/protected1' } as RouterStateSnapshot
      );
      expect(result).toBe(true);

      // Second call - switch to not authenticated
      authService.isAuthenticated.and.returnValue(false);
      result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/protected2' } as RouterStateSnapshot
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/protected2' }
      });
    });
  });
});
