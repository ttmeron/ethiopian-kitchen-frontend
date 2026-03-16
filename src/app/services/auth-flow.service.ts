import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GuestPromptDialogComponent } from '../components/guest-prompt-dialog/guest-prompt-dialog.component';
import { environment } from '../../environments/environment';
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

  async login(credentials: { email: string; password: string }): Promise<boolean> {
  
    try {
      const response = await firstValueFrom(this.authService.login(credentials));

      if (response && response.token) {
        localStorage.setItem('email', credentials.email);
        console.log('✅ Token stored in localStorage');
        return true;
      }

      console.warn('⚠️ No token received in login response');
      return false;
    } catch (err) {
      console.error('❌ Login failed:', err);
      throw err;
    }
  }
  
getCartItems(): CartItem[] {
  return this.cartService.getCartItems();
}
  
  clearCart(): void {
    localStorage.removeItem('cartItems');
  }


  openGuestOrdersDialog(): void {
  const dialogRef = this.dialog.open(GuestPromptDialogComponent, {
    width: '400px',
    data: { mode: 'viewOrders' }, 
    disableClose: false
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result?.type === 'guestLogin') {
      console.log('🎯 Guest logged in for order viewing:', result.email);
      this.router.navigate(['/my-orders']);
    }
  });
}

  registerGuest(userName: string, email: string): void {
    sessionStorage.setItem('guestEmail', email);
    sessionStorage.setItem('guestUserName', userName);
  }

  clearGuestData(): void {
    sessionStorage.removeItem('guestEmail');
    sessionStorage.removeItem('guestUserName');
  }

  openAuthDialog(): void {
    const dialogRef = this.dialog.open(GuestPromptDialogComponent, {
      width: '90%',
      maxWidth: '400px',
    data: { mode: 'viewOrders'}
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
    this.router.navigate(['/admin/orders']); 
  } else if (role === 'USER') {
    this.router.navigate(['/my-orders']); 
  } else {
    const guestEmail = sessionStorage.getItem('guestEmail');
    if (guestEmail) {
      this.router.navigate(['/my-orders']);
    } else {
      this.openAuthDialog(); 
    }
  }
}
}


