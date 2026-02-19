import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { PaymentComponent } from './components/payment/payment.component';
import { NgIf } from '@angular/common'; 
import { CartService } from './services/cart.service';
import { GuestAuthService } from './services/guest-auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
  HeaderComponent,PaymentComponent, NgIf ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ethiopian-kitchen-frontend';

  isModalOpen = false;
  currentUrl: string = '';

  private authRoutes = [
    '/register',
    '/login',
    '/forgot-password',
    '/reset-password'
  ];

  constructor(
    private router: Router,
    private cartService: CartService,
    private guestAuthService: GuestAuthService
  ) {
    this.handleNavigation();

     this.currentUrl = this.router.url;
  }

  shouldShowHeader(): boolean {
    const isAuthRoute = this.authRoutes.some(route => 
      this.currentUrl.includes(route)
    );
    
    const isRegisterPage = this.currentUrl.includes('/register');
    
    return !isAuthRoute && !isRegisterPage;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  private handleNavigation() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;

        const keepGuestSessionOn = ['/checkout', '/payment', '/guest-order', '/guest-checkout'];

        const shouldKeepSession = keepGuestSessionOn.some(route =>
          currentUrl.includes(route)
        );

        if (!shouldKeepSession) {
          console.log('🧹 Clearing guest session and cart...');
          this.clearGuestSession();
        }
      });
  }
  

  private clearGuestSession() {
    this.cartService.clearCart();
    sessionStorage.removeItem('guestEmail');
    sessionStorage.removeItem('guestUserName');
    sessionStorage.removeItem('guestToken');
    sessionStorage.removeItem('current_guest');
  }
}
