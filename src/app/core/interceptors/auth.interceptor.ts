import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { Observable } from "rxjs";
import { GuestAuthService } from "../../services/guest-auth.service";


@Injectable( {providedIn: 'root'})

export class AuthInterceptor implements HttpInterceptor{

  private readonly BLACKLISTED_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/user/guest'
  ];



    constructor(
      private authService: AuthService,
      private guestAuth: GuestAuthService){}

    intercept(req: HttpRequest<any>, next: HttpHandler): 
Observable<HttpEvent<any>> {
    

        if(this.BLACKLISTED_ENDPOINTS.some(url => req.url.includes(url))){
          return next.handle(req);
        }

        return next.handle(this.authenticateRequest(req));
      }
      private isBlacklisted(url: string): boolean{
        return Array.from(this.BLACKLISTED_ENDPOINTS).some(endpoint =>
          url.includes(endpoint)
          );
      }

      private authenticateRequest(req: HttpRequest<any>): HttpRequest<any> {
        // 1. Check for regular JWT auth first
        const token = this.authService.getToken();
        if (token) {
          return req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
        }
      
        if (this.guestAuth.isGuestAuthenticated()){
          return req.clone({
            setHeaders: {
              'X-Guest-Token': this.guestAuth.currentGuestValue?.token || '',
              'X-Guest-Request': 'true'
            }
          });
        }
        return req;

      }

}