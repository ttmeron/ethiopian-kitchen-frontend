import { Component,Inject } from '@angular/core';

import { CartItem } from '../../shared/models/cart-item.model';
import { CartService } from '../../services/cart.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OrderItemRequest, CreateOrderRequest, } from '../../shared/models/cart-item.model';


import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';


import { MatRadioModule } from '@angular/material/radio';
import { PaymentComponent } from '../payment/payment.component';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { GuestPromptDialogComponent } from '../guest-prompt-dialog/guest-prompt-dialog.component';
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule, 
    MatInputModule ,
    MatDividerModule],
    
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {
  cartItems$: Observable<CartItem[]>;
  selectedDeliveryOption: 'delivery' | 'pickup' = 'pickup';
  userName: string = '';
  email: string = '';
  isLoggedIn: boolean = false;
  

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private dialog: MatDialog,
    private authService: AuthService,
    public dialogRef: MatDialogRef<CartComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.cartItems$ = this.cartService.cart$;

    this.cartService.setDeliveryMethod(this.selectedDeliveryOption);

    // ✅ Check login and get user info
    this.isLoggedIn = this.authService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.authService.getUser();
      if (user) {
        this.userName = user.userName;
        this.email = user.email;
      } else {
        // fallback logic, or leave undefined
        this.userName = '';
        this.email = '';
      }
    }
  }
  // cartItems$ = this.cartService.cart$;
  
  // Calculate total price including ingredients
  getItemTotal(item: CartItem): number {
    return this.cartService.calculateItemTotal(item);
  }
  increaseQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item, item.quantity - 1);
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item);
  }

  getCartTotal(): number {
    return this.cartService.getCartTotal();
  }
  getBasePriceTotal(item: CartItem): number{
    return this.cartService.calculateBasePrice(item);
  }

  getTax(): number {
    return this.cartService.calculateTax();
  }
  
  getTotalWithTax(): number {
    return this.cartService.getTotalWithTax();
  }
  closeDialog(): void {
    this.dialogRef.close();
  }


  toggleDeliveryOption(option: 'delivery' | 'pickup'): void {
    this.selectedDeliveryOption = option;
    this.cartService.setDeliveryMethod(option);
  }


  checkout(): void {
    if (!this.isLoggedIn) {
      // User not logged in - open guest prompt dialog for guest info / login / register
      const dialogRef = this.dialog.open(GuestPromptDialogComponent, {
        width: '400px'
      });

      this.dialogRef.close();

      dialogRef.afterClosed().subscribe(result => {
        if (!result) {
          // Dialog closed without any action
          return;
        }

        if (result.action === 'login') {
          // User chose to login
          this.dialogRef.close();
          // Navigate to login page or open login dialog
          // Example:
          // this.router.navigate(['/login']);
        } else if (result.action === 'register') {
          // User chose to register
          this.dialogRef.close();
          // Navigate to register page or open register dialog
          // Example:
          // this.router.navigate(['/register']);
        } else if (result.userName && result.email) {
          // Guest user entered name and email - save and proceed
          this.userName = result.userName;
          this.email = result.email;
          this.proceedCheckout();
        } else {
          // Invalid or no data - do nothing or show message if desired
          console.warn('Invalid data from guest prompt dialog:', result);
        }
      });

    } else {
      // Logged in user - proceed directly
      this.proceedCheckout();
    }
  }

 private proceedCheckout(): void {
  const cartItems = this.cartService.getCartItems();

  // Save guest email for future convenience
  localStorage.setItem('guestEmail', this.email);

  // Close the cart dialog
  this.dialogRef.close();

  const isGuest = !this.authService.isLoggedIn();


  if (isGuest) {

  const totalAmount = this.cartService.calculateOrderTotalWithTax(cartItems); 
    // Build guest order payload according to GuestOrderDTO
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
      specialInstructions: '', // optional
      totalAmount: totalAmount,
      deliveryMethod: this.cartService.getDeliveryMethod()


    };
    
    console.log("total amount",totalAmount);

    console.log('guestOrderPayload', guestOrderPayload);

    this.orderService.createOrder(guestOrderPayload, true).subscribe({
      next: (order) => {
        this.dialog.open(PaymentComponent, {
          data: {
            totalAmount: Number(order.totalPrice),
            orderId: order.orderId,
            cartItems: cartItems,
            isGuest: true,
            guestName: this.userName,
            guestEmail: this.email,
            guestOrderItems: guestOrderPayload.orderItemDTOS,
            deliveryMethod: this.cartService.getDeliveryMethod()
          }
        });
      },
      error: (err) => {
        console.error('Guest order creation failed:', err);
        alert('Failed to create guest order. Please try again later.');
      }
    });

  } else {
    // Normal logged-in user flow
    const orderRequest = {
      orderItems: cartItems.map(item => ({
        foodId: item.food.id,
        foodName: item.food.name,
        price: this.cartService.calculateItemTotal(item), 
        quantity: item.quantity,
        customIngredients: item.ingredients
          ?.filter(ing => ing.id !== undefined && ing.id !== null)
          .map(ing => ({
            ingredientId: ing.id as number,
            extraCost: ing.extraCost,
            quantity: 1
          })) || []
      })),
      subtotal: this.cartService.calculateOrderSubtotal(cartItems),
      totalPrice: this.cartService.calculateOrderTotalWithTax(cartItems),
      userName: this.userName,
      email: this.email,
      deliveryMethod: this.cartService.getDeliveryMethod()
    };

    this.orderService.createOrder(orderRequest,false).subscribe({
      next: (order) => {
        this.dialog.open(PaymentComponent, {
          data: {
            totalAmount: orderRequest.totalPrice,
            orderId: order.orderId,
            cartItems: cartItems
          }
        });
      },
      error: (err) => {
        console.error('Order creation failed:', err);
        alert('Failed to create order. Please try again later.');
      }
    });
  }
}

}