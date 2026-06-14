import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('🛡️ EmployeeGuard checking...');
    console.log('🛡️ isAuthenticated():', this.authService.isAuthenticated());
    console.log('🛡️ isEmployee():', this.authService.isEmployee());
    console.log('🛡️ isAdmin():', this.authService.isAdmin());
    console.log('🛡️ getUserRole():', this.authService.getUserRole());

    if (this.authService.isAuthenticated() && 
        (this.authService.isEmployee() || this.authService.isAdmin())) {
      console.log('🛡️ Employee/Admin access granted');
      return true;
    } else {
      console.log('🛡️ Access denied - redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}