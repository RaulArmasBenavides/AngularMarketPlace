import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PublicGuard } from './public.guard';
import { AuthService } from '../services/auth.service';

describe('PublicGuard', () => {
  let guard: PublicGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        PublicGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(PublicGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('canActivate', () => {
    it('should allow activation when user is not authenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot
      );

      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should deny activation and redirect to home when authenticated', () => {
      authService.isAuthenticated.and.returnValue(true);

      const result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot
      );

      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should allow access to public routes for unauthenticated users', () => {
      authService.isAuthenticated.and.returnValue(false);

      const publicRoutes = ['/login', '/register', '/forgot-password'];

      publicRoutes.forEach((url) => {
        const result = guard.canActivate(
          {} as ActivatedRouteSnapshot,
          { url } as RouterStateSnapshot
        );

        expect(result).toBe(true);
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    it('should prevent authenticated users from accessing public routes', () => {
      authService.isAuthenticated.and.returnValue(true);

      guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot
      );

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should call authService.isAuthenticated', () => {
      authService.isAuthenticated.and.returnValue(false);

      guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot
      );

      expect(authService.isAuthenticated).toHaveBeenCalled();
    });

    it('should work with multiple consecutive calls', () => {
      // First call - not authenticated
      authService.isAuthenticated.and.returnValue(false);
      let result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot
      );
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();

      // Second call - authenticated
      authService.isAuthenticated.and.returnValue(true);
      result = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/register' } as RouterStateSnapshot
      );
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should be inverse of AuthGuard logic', () => {
      // When AuthGuard allows (authenticated), PublicGuard should deny
      authService.isAuthenticated.and.returnValue(true);
      const publicResult = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot
      );
      expect(publicResult).toBe(false);

      // When AuthGuard denies (not authenticated), PublicGuard should allow
      authService.isAuthenticated.and.returnValue(false);
      const result2 = guard.canActivate(
        {} as ActivatedRouteSnapshot,
        { url: '/login' } as RouterStateSnapshot
      );
      expect(result2).toBe(true);
    });
  });
});
