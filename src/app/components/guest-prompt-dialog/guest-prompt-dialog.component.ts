import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { AuthFlowService } from '../../services/auth-flow.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../services/order.service';
import { CartItem } from '../../shared/models/cart-item.model';
import { CartService } from '../../services/cart.service';
import { PaymentComponent } from '../payment/payment.component';
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordDialogComponent } from '../forgot-password-dialog/forgot-password-dialog.component';

@Component({
  selector: 'app-guest-prompt-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule,MatIconModule],
  
  templateUrl: './guest-prompt-dialog.component.html',
  styleUrl: './guest-prompt-dialog.component.scss'
})
export class GuestPromptDialogComponent {
 
    userName: string ='';
    email: string =  '';
    loginEmail: string =  '';
    loginPassword: string =  '';
    hidePassword: boolean = true;

    guestMode: boolean = false;
    loginMode: boolean = false;
    isLoading: boolean = false;
    errorMessage: string | null = null;
    totalAmount: number = 0; 

    cartItems: CartItem[] = []; 

  constructor(private dialogRef: MatDialogRef<GuestPromptDialogComponent>, 
    public authFlow: AuthFlowService,
    private router: Router,
    private orderService: OrderService, 
    private dialog: MatDialog, 
    private cartService: CartService){}

    private mapIngredients(ingredients: any[]): any[] {
      return ingredients.map(ing => ({
        ingredientId: ing.id,
        extraCost: ing.extraCost || 0,
        quantity: ing.quantity || 1
      }));
    }

  

  continueAsGuest(): void {
    console.log('continueAsGuest() triggered'); 
    this.guestMode = true;
    this.loginMode = false;
    this.errorMessage = null;
    console.log('New state:', { // Debug 2
      guestMode: this.guestMode, 
      loginMode: this.loginMode
    });
  }
  async confirmGuest(): Promise<void> {
    if (!this.userName || !this.email) {
      this.errorMessage = 'Please provide name and email';
      return;
    }
  
    const cartItems = this.cartService.getCartItems();
    if (!cartItems || cartItems.length === 0) {
      this.errorMessage = 'Please add items to your cart before ordering';
      return;
    }
  

    this.isLoading = true;
    this.errorMessage = null;
    


    // Calculate total using service
    const totalAmount = this.cartService.calculateOrderTotalWithTax(cartItems);
    const subtotal = this.cartService.getCartTotal(); // includes base price + add-ons
    const tax = this.cartService.calculateTax()
  
    const guestOrderPayload = {
      guestName: this.userName,
      guestEmail: this.email,
      orderItemDTOS: cartItems.map(item => ({
        foodName: item.food.name,
        quantity: item.quantity,
        price: this.cartService.calculateItemTotal(item),
        
        customIngredients: item.ingredients
            ?.filter(ing => ing.id != null)
            .map(ing => ({
              ingredientId: ing.id,
              ingredientName: ing.name,
              extraCost: ing.extraCost,
              quantity: 1
            })) || []
            
      })),
      
      specialInstructions: '', 
      subtotal: subtotal,
      tax: tax,
      deliveryFee: this.cartService.getDeliveryFee(),
      totalAmount: totalAmount
      
    };


  this.totalAmount = guestOrderPayload.totalAmount;

  console.log("total amount from gurest-orompt:",totalAmount);

  this.orderService.initiateGuestPayment(guestOrderPayload).subscribe({
    next: (paymentResponse) => {
      this.dialog.open(PaymentComponent, {
        data: {
          clientSecret: paymentResponse.clientSecret,
          paymentId: paymentResponse.paymentId,
          status: paymentResponse.status,
          cartItems,
          totalAmount: this.totalAmount,
          isGuest: true,
          guestName: this.userName,         
          guestEmail: this.email,           
          specialInstructions: '',   
          guestOrder: guestOrderPayload
        }
      });

      this.dialogRef.close();
    
    },
      error: (err) => {
        console.error('Payment intent creation failed:', err);
        this.errorMessage = 'Could not initialize payment.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
  
  cancelgust(): void {
    this.guestMode = false;
    this.userName = '';
    this.email = '';
    this.errorMessage = null;
  }
  showLoginForm(): void {
    this.loginMode = true;
    this.guestMode = false;
    this.errorMessage = null;
  }

  async submitLogin(): Promise<void> {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Please provide email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      await this.authFlow.login({
        email: this.loginEmail,
        password: this.loginPassword
      });
      this.dialogRef.close({ type: 'login' });
    } catch (error: any) {
      this.errorMessage = error.message; 
    } finally {
      this.isLoading = false;
    }
  }

  forgotPassword(): void {
    if (!this.loginEmail) {
      this.errorMessage = 'Please enter your email first';
      return;
    }
  
    // Use dialog approach (same as LoginPageComponent)
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '400px',
      data: { email: this.loginEmail }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        // Show success message in the dialog itself
        this.errorMessage = null;
      } else if (result === 'error') {
        this.errorMessage = 'Failed to send reset email';
      }
    });
  }
  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  cancelLogin(): void {
    this.loginMode = false;
    this.errorMessage = null;
  }

  goToRegister(): void {
    this.dialogRef.close({ action: 'register' });
    this.router.navigate(['/register']);
  }

  logout(): void {
    sessionStorage.removeItem('guestEmail');
    sessionStorage.removeItem('email');
  }
  closeCheckout(): void {
    this.dialogRef.close();
  }
  
}