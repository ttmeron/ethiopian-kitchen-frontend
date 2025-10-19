import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GuestPromptDialogComponent } from '../components/guest-prompt-dialog/guest-prompt-dialog.component';
import { environment } from '../enviironments/environment';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { CartItem } from '../shared/models/cart-item.model';
import { CartService } from './cart.service';

@Injectable({ providedIn: 'root' })
export class AuthFlowService {

  private baseUrl = environment.authApi; 
  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private http: HttpClient,
    private cartService: CartService
  ) {}

  // Handle login logic
  async login(credentials: { email: string; password: string }): Promise<boolean> {
    try {
      // AuthService.login() already handles token saving, user saving, and role extraction
      const result = await firstValueFrom(
        this.authService.login(credentials)
      );
      
      this.clearGuestData();
      return true;
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }
  // In AuthFlowService
getCartItems(): CartItem[] {
  return this.cartService.getCartItems();
}
  
  clearCart(): void {
    localStorage.removeItem('cartItems');
  }

  // Handle guest user registration
  registerGuest(userName: string, email: string): void {
    sessionStorage.setItem('guestEmail', email);
    sessionStorage.setItem('guestUserName', userName);
  }

  // Clear guest data
  clearGuestData(): void {
    sessionStorage.removeItem('guestEmail');
    sessionStorage.removeItem('guestUserName');
  }

  // Open auth dialog (for mobile/hamburger menu)
  openAuthDialog(): void {
    const dialogRef = this.dialog.open(GuestPromptDialogComponent, {
      width: '90%',
      maxWidth: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.type === 'guest') {
        this.registerGuest(result.userName, result.email);
        this.router.navigate(['/my-orders']);
      } else if (result?.type === 'login') {
        this.router.navigate(['/']);
      }
    });
  }

  // Handle logout
  logout(): void {
    this.authService.logout();
    this.clearGuestData();
  }

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email }).pipe(
      catchError(error => {
        console.error('Password reset failed:', error);
        throw error;
      })
    );
  }

  navigateToOrders(): void {
  const role = this.authService.getUserRole();
  console.log('🧭 Navigating based on role:', role);

  if (role === 'ADMIN') {
    this.router.navigate(['/orders']); // Admin view
  } else if (role === 'USER') {
    this.router.navigate(['/my-orders']); // Logged-in user
  } else {
    // Guest handling
    const guestEmail = sessionStorage.getItem('guestEmail');
    if (guestEmail) {
      this.router.navigate(['/my-orders']);
    } else {
      this.openAuthDialog(); // Opens guest prompt or login dialog
    }
  }
}
}
