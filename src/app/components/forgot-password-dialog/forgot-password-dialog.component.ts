import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PasswordResetService } from '../../services/password-reset.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinner,
    MatIconModule
  ],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrl: './forgot-password-dialog.component.scss'
})
export class ForgotPasswordDialogComponent {

  email: string;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;


  constructor(
    public dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data:{ email: string },
    private passwordRestService: PasswordResetService
  ){
    this.email = data.email || '';
  }

  onSubmit(): void{

    if(!this.email){
      this.errorMessage = 'please enter your email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.passwordRestService.forgotPassword(this.email).subscribe({
      next:() => {
        this.isLoading = false;
        this.successMessage = 'Password reset link has been sent to your email';
        setTimeout(() => {
          this.dialogRef.close(true);
        }, 3000);
      },
      error: (error) =>{
        this.isLoading =false;
        this.errorMessage = this.getErrorMessage(error);
      }
    });
      
    }

    onCancel(): void{
      this.dialogRef.close(false);
    }

    private getErrorMessage(error: any): string{
      if(error.status === 404){
        return 'No account found wiht this email address';
      }else if(error.status ===429){
        return ' Too many reset attempts. Please try again later.';
      }else if(error.error?.message){
        return error.error.message;
      }else {
        return 'Failed to send reset email. Please try again.';
      }
    }

  }

