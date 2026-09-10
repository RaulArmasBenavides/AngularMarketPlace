import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AnalyticsService } from './analytics.service';
import { Router } from '@angular/router';

@Injectable()
export class TrackingInterceptor implements HttpInterceptor {
  constructor(private analyticsService: AnalyticsService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // Track page route changes
          if (this.router.url) {
            this.analyticsService.trackPageView(this.router.url, document.title);
          }
        }
      })
    );
  }
}
