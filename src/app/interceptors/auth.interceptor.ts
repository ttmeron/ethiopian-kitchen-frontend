
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request and add the authorization header
    const authReq = this.addTokenToRequest(req);
    
    return next.handle(authReq);
  }

  private addTokenToRequest(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getToken();
    
    if (token && this.isAdminEndpoint(req.url)) {
      return req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return req;
  }

  private isAdminEndpoint(url: string): boolean {
    // Check if the URL contains admin paths
    return url.includes('/admin/');
  }
}