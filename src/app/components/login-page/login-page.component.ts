import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Route, Router } from '@angular/router';
import { AuthFlowService } from '../../services/auth-flow.service';
import { ForgotPasswordDialogComponent } from '../forgot-password-dialog/forgot-password-dialog.component';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule,MatIconModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage: string | null = null;

  hidePassword: boolean = true;

  constructor( 
    private authFlow: AuthFlowService,
    // private passwordResetService: PasswordResetService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
    ){}

    ngOnInit() {
    // Debug router events
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        console.log('🔄 Navigation START:', event.url);
      }
      if (event instanceof NavigationEnd) {
        console.log('✅ Navigation END:', event.url);
      }
      if (event instanceof NavigationCancel) {
        console.log('❌ Navigation CANCELED:', event.url, event.reason);
      }
      if (event instanceof NavigationError) {
        console.log('🚨 Navigation ERROR:', event.url, event.error);
      }
    });
  }


// async onSubmit(): Promise<void> {
//     this.isLoading = true;
//     this.errorMessage = null;
    
//     try {
//       const success = await this.authFlow.login({
//         email: this.email.toLowerCase().trim(),
//         password: this.password
//       });

//       if (success) {
//         // Check if user is admin and redirect accordingly
//         if (this.authService.isAdmin()) {
//           this.router.navigate(['/admin/food-management']); // Direct to food management
//         } else {
//           this.router.navigate(['/']); // Regular user to home
//         }
//       }
//     } catch (error: any) {
//       console.error('Full error:', error);
//       this.errorMessage = error.message;
//     } finally {
//       this.isLoading = false;
//     }
//   }
async onSubmit(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    
    try {
      console.log('🔐 1. Starting login process...');
      
      const success = await this.authFlow.login({
        email: this.email.toLowerCase().trim(),
        password: this.password
      });

      console.log('🔐 2. Login successful:', success);
      
      if (success) {
        // ✅ CRITICAL: Check admin status after login
        console.log('🔐 3. Checking admin status...');
        console.log('🔐 4. isAdmin():', this.authService.isAdmin());
        console.log('🔐 5. getUserRole():', this.authService.getUserRole());
        console.log('🔐 6. Current user:', this.authService.getCurrentUser());
        console.log('🔐 7. sessionStorage role:', sessionStorage.getItem('userRole'));

        if (this.authService.isAdmin()) {
          console.log('🎯 8. ADMIN DETECTED - Redirecting to /admin/foods');
          this.router.navigate(['/admin/food-management']);
        } else {
          console.log('👤 9. REGULAR USER - Redirecting to home');
          this.router.navigate(['/']);
        }
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }
  
    navigateToRegister(): void {
      this.router.navigate(['/register']);
    }
  
    forgotPassword(): void {
      if (!this.email) {
        this.errorMessage = 'Please enter your email first';
        return;
      }
    
      const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
        width: '400px',
        data: { email: this.email }
      });
    
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Show success message on login page
          this.errorMessage = null;
          // You can show a success message here
          console.log('Password reset email sent to:', result);
        }
      });
    }


  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  isLikelyAdminEmail(): boolean {
    return this.email.toLowerCase().includes('admin') || 
           this.email.toLowerCase().endsWith('@yourapp.com');
  }
  }