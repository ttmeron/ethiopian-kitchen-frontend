import { ChangeDetectorRef, Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CartComponent } from '../cart/cart.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router,RouterLink } from '@angular/router';
import { AuthFlowService } from '../../services/auth-flow.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {


   businessHours = [
    { day: 'Monday', hours: '11:00 AM - 9:00 PM' },
    { day: 'Tuesday', hours: '11:00 AM - 9:00 PM' },
    { day: 'Wednesday', hours: '11:00 AM - 9:00 PM' },
    { day: 'Thursday', hours: '11:00 AM - 10:00 PM' },
    { day: 'Friday', hours: '11:00 AM - 11:00 PM' },
    { day: 'Saturday', hours: '10:00 AM - 11:00 PM' },
    { day: 'Sunday', hours: '10:00 AM - 8:00 PM' }
  ];
  
  isHoursOpen = false;
  isCartOpen = false;
  isMenuOpen = false;
  isLoggedIn = false;
  isAdmin = false;
  isAdminMenuOpen = false; 


  get guestEmail(): string | null {
    return sessionStorage.getItem('guestEmail');
  }
  get showLogoutLink(): boolean {
    return this.authService.isAuthenticated();
  }

  constructor(
  public cartService: CartService,
  private dialog: MatDialog,
  public authService: AuthService,
  private router: Router,
  private cd: ChangeDetectorRef,
  public authFlow: AuthFlowService) { }

  ngOnInit() {
    // Initial check
    this.checkAuthState();
    
    // Subscribe to auth state changes
    this.authService.getAuthState().subscribe(state => {
      this.isLoggedIn = state;
      this.checkAuthState();
      this.cd.detectChanges();
      console.log('🔔 Auth state changed - isLoggedIn:', state);
    });
    
    this.authService.getUserState().subscribe(user => {
      console.log('👤 User state changed:', user);
      this.isAdmin = this.authService.isAdmin();
      this.cd.detectChanges();
      console.log('🔔 Admin status updated:', this.isAdmin);
    });
  }
   checkAuthState(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.isAdmin = this.authService.isAdmin();
    console.log('🔍 Auth check - isLoggedIn:', this.isLoggedIn, 'isAdmin:', this.isAdmin);
  }

  navigateToOrders(): void {
  this.toggleMenu();
  if (this.authService.isAuthenticated()) {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/orders']); 
    } else {
      this.router.navigate(['/my-orders']);
    }
  } else {
    this.authFlow.openGuestOrdersDialog();
  }
}
 toggleHoursMenu(): void {
    this.isHoursOpen = !this.isHoursOpen;
  }

  handleAuthAction(): void{
    this.toggleMenu();

    if( this.authService.isLoggedIn()){
      this.authFlow.logout();
    }else{
      if(window.innerWidth < 168){
        this.authFlow.openAuthDialog();
      }else{
        this.router.navigate(['/login']);
      }
    }
  }

  handleLogout(event: Event) {
    event.preventDefault(); 
    event.stopPropagation(); 
    this.authService.logout();
    this.isAdmin = false;
    this.toggleMenu(); 
  }


  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
  }

  
  openCart(): void {
    this.dialog.open(CartComponent, {
      width: '400px',
      data: {} 
    });
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isAdminMenuOpen = false;
    }
  }
   toggleAdminMenu() {
    this.isAdminMenuOpen = !this.isAdminMenuOpen;
  }

   handleAdminLinkClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isAdminMenuOpen = false;
     this.isMenuOpen = false; 
    
    const target = (event.target as HTMLAnchorElement);
    const href = target.getAttribute('href') || target.getAttribute('routerLink');
    
    if (href) {
      this.router.navigate([href]);
    }
  }
  logout(): void {
    this.authService.logout(); 
  }

  async handleGuestAccess() {
  this.toggleMenu();
  this.authFlow.openGuestOrdersDialog();

}

  private showEmailPrompt():Promise<string |null>{
    return new Promise(resolve =>{
      const email = prompt('please enter yur email to view orders:');
      resolve(email?.trim() || null);
    });
  }

}
