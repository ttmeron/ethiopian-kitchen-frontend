import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {

     console.log('🛡️ AdminGuard checking...');
    console.log('🛡️ isAdmin():', this.authService.isAdmin());
    console.log('🛡️ getUserRole():', this.authService.getUserRole());
    

    if (this.authService.isAdmin()) {

      console.log('🛡️ Admin access granted');
      return true;
    } else {
      console.log('🛡️ Admin access denied - redirecting to home');
      this.router.navigate(['/']);
      return false;
    }
  }
}