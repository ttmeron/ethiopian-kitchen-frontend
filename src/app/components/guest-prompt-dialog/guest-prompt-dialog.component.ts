import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthFlowService } from '../../services/auth-flow.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../services/order.service';
import { CartItem } from '../../shared/models/cart-item.model';
import { CartService } from '../../services/cart.service';
import { PaymentComponent } from '../payment/payment.component';
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordDialogComponent } from '../forgot-password-dialog/forgot-password-dialog.component';
import { GuestAuthService } from '../../services/guest-auth.service';
import { GuestPaymentRequest } from '../../shared/models/order.model';
import { RegisterPageComponent } from '../register-page/register-page.component';

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
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    public authFlow: AuthFlowService,
    private router: Router,
    private orderService: OrderService, 
    private dialog: MatDialog, 
    private cartService: CartService,
    private guestAuthService:GuestAuthService){
  console.log('🔧 GuestPromptDialogComponent initialized');
  console.log('📋 Data passed to dialog:', data);}

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
    console.log('New state:', {
      guestMode: this.guestMode, 
      loginMode: this.loginMode
    });
  }
  async confirmGuest(): Promise<void> {
    if (!this.userName || !this.email) {
      this.errorMessage = 'Please provide name and email';
      return;
    }
    if (!this.validateEmail(this.email)) {
    this.errorMessage = 'Please enter a valid email address';
    return;
  }

    if (this.data?.mode === 'viewOrders') {
    sessionStorage.setItem('guestEmail', this.email);
    sessionStorage.setItem('guestUserName', this.userName);

    this.dialogRef.close({
      userName: this.userName,
      email: this.email,
      type: 'guestLogin'
    });
    return;
  }
  
    const cartItems = this.cartService.getCartItems();
    if (!cartItems || cartItems.length === 0) {
      this.errorMessage = 'Please add items to your cart before ordering';
      return;
    }
  

    this.isLoading = true;
    this.errorMessage = null;

    const guestToken = this.guestAuthService.getGuestToken();
       console.log('🔑 Using guestToken:', guestToken);  
    


    const totalAmount = this.cartService.calculateOrderTotalWithTax(cartItems);
    const subtotal = this.cartService.getCartTotal(); 
    const tax = this.cartService.calculateTax()
  
    const guestOrderPayload: GuestPaymentRequest = {
      guestName: this.userName,
      guestEmail: this.email,
      guestToken: guestToken,
     orderItemDTOS: cartItems.map(item => {
  if (item.itemType === 'FOOD' && item.food) {
    return {
      itemType: 'FOOD' as const,
      foodId: item.food!.id,
      foodName: item.food!.name,
      quantity: item.quantity,
      price: Number(this.cartService.calculateItemTotal(item)),

      customIngredients: this.mapIngredients(item.ingredients ?? [])
    };
  }

   const sizeValue = item.size || 'MEDIUM';
   const iceOptionValue = item.iceOption || 'WITH_ICE';    
          

  if (item.itemType === 'DRINK' && item.drink) {
    return {
      itemType: 'DRINK' as const,
      drinkId: item.drink.id,
      drinkName: item.drink.name,
      quantity: item.quantity,
      size: sizeValue,
      iceOption: iceOptionValue,
      price: this.cartService.calculateItemTotal(item),
      customIngredients: []
    };
  }

  throw new Error('Invalid cart item');
}),

      
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
          guestOrder: guestOrderPayload,
          guestToken: guestToken,
          paymentAlreadyInitiated: true
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

  validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
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
  
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '400px',
      data: { email: this.loginEmail }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
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
    this.loginEmail = '';
    this.loginPassword = '';
    this.hidePassword = true;
  }

  goToRegister(): void {
    this.dialogRef.close({ action: 'register' });
     const dialogRef = this.dialog.open(RegisterPageComponent, {
    width: '500px',
    maxWidth: '95vw',
    disableClose:false,
    data: { 
      fromCheckout: true 
    }
  });
  this.dialogRef.close();
  
  dialogRef.afterClosed().subscribe(result => {
    console.log('Register dialog closed with result:', result);
    if (result?.action === 'backToCheckout') {
      this.openCheckoutDialog();
    }
  });
  }


private openCheckoutDialog(): void {
  this.dialog.open(GuestPromptDialogComponent, {
    width: '450px',
    maxWidth: '95vw',
    panelClass: 'guest-prompt-dialog-panel',
    disableClose: false,
    data: { 
      fromCheckout: true
    }
  });
}
  logout(): void {
    sessionStorage.removeItem('guestEmail');
    sessionStorage.removeItem('email');
  }
  closeCheckout(): void {
    this.dialogRef.close();
  }
    isViewOrdersMode(): boolean {
    return this.data?.mode === 'viewOrders';
  }
}