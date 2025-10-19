import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinner,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit{

  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading = false;
  isValidatingToken = true;
  tokenInvalid = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService
  ){}


  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];
    
    if (!this.token) {
      this.tokenInvalid = true;
      this.isValidatingToken = false;
      this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      return;
    }

    this.validateToken();
  }

  validateToken(): void {
    this.passwordResetService.validateResetToken(this.token).subscribe({
      next: (response: any) => {
        if (response.valid) {
          this.isValidatingToken = false;
        } else {
          this.isValidatingToken = false;
          this.tokenInvalid = true;
          this.errorMessage = response.message || 'This reset link has expired or is invalid.';
        }
      },
      error: () => {
        this.isValidatingToken = false;
        this.tokenInvalid = true;
        this.errorMessage = 'Failed to validate reset link. Please try again.';
      }
    });
  }

  onSubmit(): void {
    if (this.passwordsMismatch()) {
      this.errorMessage = 'Passwords do not match';
      return;
    }
  
    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = null;
  
    this.passwordResetService.resetPassword({
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password reset successfully! Redirecting to login...';
        
        setTimeout(() => {
          this.router.navigate(['/login'], {
            state: { message: 'Password reset successful! Please login with your new password.' }
          });
        }, 2000);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
  }

  passwordsMismatch(): boolean {
    return this.newPassword !== this.confirmPassword && this.confirmPassword.length > 0;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 400) {
      return 'Invalid reset token or password requirements not met';
    } else if (error.status === 410) {
      return 'Reset token has expired. Please request a new password reset.';
    } else if (error.status === 404) {
      return 'User not found. Please request a new password reset.';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'Failed to reset password. Please try again.';
    }
  }


}
