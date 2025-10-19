import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap, tap, of, catchError } from 'rxjs';
import { AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CommonModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss'
})
export class RegisterPageComponent {

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  private emailCheck$ = new Subject<string>();
  emailExists = false;

  isCheckingEmail = false;

  hidePassword = true;
  hideConfirmPassword = true;

  showPasswordRequirements = false;

  blurredFields = {
    userName: false,
    email: false,
    password: false,
    confirmPassword: false
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    // Initialize form with validations
    this.registerForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

    // Email availability check
    this.emailCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      tap(() => this.isCheckingEmail = true), // Show loading state
      switchMap(email => {
        if (!email || this.email?.invalid) {
          this.emailExists = false;
          this.isCheckingEmail = false;
          return of(null);
        }
        return this.userService.checkEmailExists(email).pipe(
          catchError(error => {
            console.error('Email check error:', error);
            this.isCheckingEmail = false;
            this.emailExists = false;
            return of(null);
          })
        );
      })
    ).subscribe({
      next: (response) => {
        this.isCheckingEmail = false;
        if (response) {
          this.emailExists = response.exists;
          console.log('Email check - exists:', response.exists);
        }
      },
      error: (err) => {
        this.isCheckingEmail = false;
        this.emailExists = false;
        console.error('Email check failed:', err);
      }
    });
  }

  // Getter methods for easy access to form controls in template
  get userName() { return this.registerForm.get('userName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  shouldShowError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (this.blurredFields[fieldName as keyof typeof this.blurredFields] || field.touched);
  }

  // Handle blur events for each field
  onFieldBlur(fieldName: keyof typeof this.blurredFields) {
    this.blurredFields[fieldName] = true;
    
    // Special handling for email field
    if (fieldName === 'email') {
      this.checkEmail();
    }
  }

  getPasswordRequirements() {
    const value = this.password?.value || '';
    return {
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      hasMinLength: value.length >= 6
    };
  }

  //  Check if all password requirements are met
  get isPasswordValid(): boolean {
    const req = this.getPasswordRequirements();
    return req.hasUpperCase && req.hasLowerCase && req.hasNumber && req.hasSpecialChar && req.hasMinLength;
  }


  checkEmail() {
    const emailControl = this.registerForm.get('email');
    const email = emailControl?.value;
    
    // Only check if email is valid and not empty
    if (email && emailControl?.valid) {
      this.emailCheck$.next(email);
    } else {
      this.emailExists = false; // Reset if email is invalid or empty
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? { passwordStrength: true } : null;
  }

  getPasswordErrors(): string {
    const errors = this.password?.errors;
    if (!errors) return '';

    if (errors['required']) return '* Password is required';
    if (errors['minlength']) return `* Password must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['passwordStrength']) return '* Password must contain uppercase, lowercase, number, and special character';
    
    return '* Invalid password';
  }

  getFieldErrors(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;

    switch (fieldName) {
      case 'userName':
        if (errors['required']) return 'Username is required';
        if (errors['minlength']) return `Username must be at least ${errors['minlength'].requiredLength} characters`;
        break;

      case 'email':
        if (errors['required']) return 'Email is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;

      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        if (this.registerForm.errors?.['passwordMismatch']) return 'Passwords do not match';
        break;
    }

    return '';
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  onSubmit() {
    // Mark all fields as touched to trigger error display
    this.markFormGroupTouched(this.registerForm);
    Object.keys(this.blurredFields).forEach(key => {
      this.blurredFields[key as keyof typeof this.blurredFields] = true;
    });


    this.showPasswordRequirements = false;

    // Check for specific errors and set appropriate messages
    if (this.registerForm.invalid) {
      if (this.emailExists) {
        this.errorMessage = "Email already exists. Please use a different email.";
      } else if (this.registerForm.hasError('passwordMismatch')) {
        this.errorMessage = "Passwords do not match. Please check your password confirmation.";
      } else if (this.password?.hasError('minlength')) {
        this.errorMessage = "Password must be at least 6 characters long.";
      } else if (this.password?.hasError('passwordStrength')) {
        this.errorMessage = "Password must contain uppercase, lowercase, number, and special character.";
      } else if (this.userName?.hasError('required')) {
        this.errorMessage = "Username is required.";
      } else if (this.userName?.hasError('minlength')) {
        this.errorMessage = "Username must be at least 3 characters long.";
      } else if (this.email?.hasError('required')) {
        this.errorMessage = "Email is required.";
      } else if (this.email?.hasError('email')) {
        this.errorMessage = "Please enter a valid email address.";
      } else {
        this.errorMessage = "Please correct the form errors above.";
      }
      return;
    }

    if (this.emailExists) {
      this.errorMessage = "Email already exists. Please use a different email.";
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { userName, email, password, confirmPassword } = this.registerForm.value;

    this.userService.register({ 
      userName, 
      email, 
      password,
      confirmPassword,
      role: 'USER' 
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login'], {
          state: { successMessage: 'Registration successful! Please login.' }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  
  // Add this method to your component class
  onPasswordBlur() {
    this.blurredFields.password = true;
    
    // Only hide requirements if password is valid
    if (this.isPasswordValid) {
      this.showPasswordRequirements = false;
    }
  }

  private getErrorMessage(err: any): string {
    console.log('Registration error:', err);
    
    // First priority: if our real-time check found the email exists
    if (this.emailExists) {
      return 'This email is already registered. Please use a different email.';
    }

    // Second: check the actual error response from the server
    const errorText = JSON.stringify(err).toLowerCase();
    
    // Look for email-related errors in the entire error object
    if (errorText.includes('email') && 
        (errorText.includes('already') || 
         errorText.includes('exists') || 
         errorText.includes('taken') ||
         errorText.includes('duplicate'))) {
      return 'This email is already registered. Please use a different email.';
    }

    // Try to extract specific error message
    if (err.error?.message) {
      return err.error.message;
    }
    
    if (err.message) {
      return err.message;
    }

    return 'Registration failed. Please try again.';
  }
 

  passwordsMatch(): boolean {
    const { password, confirmPassword } = this.registerForm.value;
    return password === confirmPassword;
  }
}