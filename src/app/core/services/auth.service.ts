import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, Timer } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User, TokenPayload } from 'src/app/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = environment.marketPlaceUrl;
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly userKey = 'current_user';
  private readonly tokenExpiryKey = 'token_expiry';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(!!this.getAccessToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private refreshTokenTimeout?: number;

  constructor(private http: HttpClient) {
    this.setupTokenRefresh();
  }

  /**
   * Login with email and password
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError((error) => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError((error) => {
        console.error('Registration failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Social login (Google, Facebook, etc)
   */
  socialLogin(provider: string, token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/${provider}/login`, { token }).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError((error) => {
        console.error(`${provider} login failed:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.api}/auth/logout`, {}).pipe(
      finalize(() => this.clearAuthData())
    );
  }

  /**
   * Refresh access token
   */
  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.api}/auth/refresh`, { refreshToken }).pipe(
      tap((response) => this.handleAuthResponse(response)),
      catchError((error) => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify email
   */
  verifyEmail(token: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.api}/auth/verify-email`, { token });
  }

  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.api}/auth/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.api}/auth/reset-password`, { token, newPassword });
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  /**
   * Get refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.tokenExpiryKey);
    if (!expiry) return true;
    return new Date().getTime() > parseInt(expiry);
  }

  /**
   * Handle auth response and store tokens
   */
  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.accessTokenKey, response.accessToken);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);

    // Calculate expiry time
    const expiryTime = new Date().getTime() + (response.expiresIn * 1000);
    localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());

    // Store user
    localStorage.setItem(this.userKey, JSON.stringify(response.user));

    // Update subjects
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);

    // Setup token refresh
    this.setupTokenRefresh();
  }

  /**
   * Clear all auth data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenExpiryKey);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  /**
   * Get user from localStorage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Setup automatic token refresh
   * Refreshes token 1 minute before expiry
   */
  private setupTokenRefresh(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    const expiry = localStorage.getItem(this.tokenExpiryKey);
    if (!expiry) return;

    const expiryTime = parseInt(expiry);
    const now = new Date().getTime();
    const timeUntilExpiry = expiryTime - now;
    const refreshBeforeExpiry = 60 * 1000; // 1 minute

    if (timeUntilExpiry > refreshBeforeExpiry) {
      this.refreshTokenTimeout = window.setTimeout(
        () => this.refreshAccessToken().subscribe(),
        timeUntilExpiry - refreshBeforeExpiry
      );
    }
  }
}
