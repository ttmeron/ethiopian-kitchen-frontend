import { ChangeDetectorRef, Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CartComponent } from '../cart/cart.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AuthFlowService } from '../../services/auth-flow.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,RouterModule,FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

  isCartOpen = false;
  isMenuOpen = false;
  isLoggedIn = false;
  isAdmin = false;



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

  ngOnInit(){

    this.isAdmin = this.authService.isAdmin();

    this.isLoggedIn = this.authService.isLoggedIn();

    this.authService.getAuthState().subscribe(state => {
      this.isLoggedIn = state;

      if(this.isMenuOpen){
        this.cd.detectChanges();
      }

      console.log('Auth state changed:',state)
    })
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
    event.preventDefault(); // Prevent default navigation
    event.stopPropagation(); // Stop event bubbling
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
      data: {} // optional: pass any data if needed
    });
  }
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  logout(): void {
    this.authService.logout(); 
  }

  async handleGuestAccess(){
    this.toggleMenu();

    const email = await this.showEmailPrompt();

    if(email){
      sessionStorage.setItem('guestEmail',email);

      this.router.navigate(['/my-orders']);

      this.cd.detectChanges();
    }
  }

  private showEmailPrompt():Promise<string |null>{
    return new Promise(resolve =>{
      const email = prompt('please enter yur email to view orders:');
      resolve(email?.trim() || null);
    });
  }

}
