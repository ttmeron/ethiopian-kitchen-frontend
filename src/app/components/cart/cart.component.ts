import { Component,Inject } from '@angular/core';
import { CartItem } from '../../shared/models/cart-item.model';
import { CartService } from '../../services/cart.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { PaymentComponent } from '../payment/payment.component';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { GuestPromptDialogComponent } from '../guest-prompt-dialog/guest-prompt-dialog.component';
import { GuestAuthService } from '../../services/guest-auth.service';
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
    private guestAuthService: GuestAuthService,
    public dialogRef: MatDialogRef<CartComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.cartItems$ = this.cartService.cart$;

    this.cartService.setDeliveryMethod(this.selectedDeliveryOption);

    // Check login and get user info
    this.isLoggedIn = this.authService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.authService.getUser();
      if (user) {
        this.userName = user.userName;
        this.email = user.email;
      } else {
        this.userName = '';
        this.email = '';
      }
   
    }
  }

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
    const dialogRef = this.dialog.open(GuestPromptDialogComponent, {
      width: '400px'
    });

    this.dialogRef.close();

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'login' || result.action === 'register') {
     
        this.dialogRef.close();
      } else if (result.userName && result.email) {
       
        this.userName = result.userName;
        this.email = result.email;
        this.proceedCheckout();
      }
    });

  } else {
    
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.userName;
      this.email = user.email;
    } else {
      // Fallback to sessionStorage
      this.userName = sessionStorage.getItem('userName') || '';
      this.email = sessionStorage.getItem('email') || '';
    }
    this.proceedCheckout();
  }
}

private proceedCheckout(): void {
  const cartItems = this.cartService.getCartItems();
  const isGuest = !this.authService.isLoggedIn();

  console.log('🔍 proceedCheckout - isGuest:', isGuest, 'Cart items:', cartItems);

  // Clean up session storage
  if (isGuest) {
    const guestToken = this.guestAuthService.getGuestToken();
    sessionStorage.setItem('guestEmail', this.email);
    sessionStorage.setItem('guestUserName', this.userName);
    if (guestToken) {
      sessionStorage.setItem('guestToken', guestToken);
    }
  } else {
    sessionStorage.removeItem('guestEmail');
    sessionStorage.removeItem('guestToken');
    sessionStorage.removeItem('guestUserName');
  }

  this.dialogRef.close();

  // Prepare common order data
  const totalAmount = this.cartService.calculateOrderTotalWithTax(cartItems);
  const subtotal = this.cartService.getCartTotal();
  const tax = this.cartService.calculateTax();


  const specialInstructions = this.collectSpecialInstructions(cartItems);
  
  // Map cart items to order items (shared logic)
  const orderItemDTOS = this.mapCartItemsToOrderItems(cartItems);
  
  if (isGuest) {
    // Guest-specific payload
    const guestOrderPayload = {
      guestName: this.userName,
      guestEmail: this.email,
      guestToken: this.guestAuthService.getGuestToken(),
      orderItemDTOS: orderItemDTOS,
      specialInstructions: specialInstructions,
      subtotal: subtotal,
      tax: tax,
      deliveryFee: this.cartService.getDeliveryFee(),
      totalAmount: totalAmount,
      deliveryMethod: this.cartService.getDeliveryMethod()
    };
    
    this.processOrder(guestOrderPayload, true, {
      guestName: this.userName,
      guestEmail: this.email,
      guestToken: this.guestAuthService.getGuestToken()
    });
    
  } else {
    // User-specific payload
    const currentUser = this.authService.getCurrentUser();


  const orderItems = this.mapCartItemsToOrderItemsForUser(cartItems);

    const userOrderPayload = {
    userName: currentUser?.userName || '',
    email: currentUser?.email || '',
    orderItems: orderItems,  
    subtotal: subtotal,
    totalPrice: totalAmount,  
    isGuest: false, 
    deliveryMethod: this.cartService.getDeliveryMethod(),
    specialInstructions: specialInstructions
  };
    
    this.processOrder(userOrderPayload, false, {
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userName: currentUser?.userName || currentUser?.userName
    });
  }
}
private processOrder(orderPayload: any, isGuest: boolean, userData: any): void {
  console.log(`📤 ${isGuest ? 'Guest' : 'User'} OrderPayload created:`, JSON.stringify(orderPayload, null, 2));

  this.orderService.createOrder(orderPayload, isGuest).subscribe({
    next: (order) => {
      console.log(`✅ Order created for ${isGuest ? 'guest' : 'user'}:`, order);
      
      const paymentData: any = {
        totalAmount: Number(order.totalPrice),
        orderId: order.orderId,
        cartItems: this.cartService.getCartItems(),
        isGuest: isGuest,
        deliveryMethod: this.cartService.getDeliveryMethod()
      };
      
      // Add guest or user specific data
      if (isGuest) {
        paymentData.guestName = userData.guestName;
        paymentData.guestEmail = userData.guestEmail;
        paymentData.guestToken = userData.guestToken;
        paymentData.guestOrderItems = orderPayload.orderItemDTOS;
      } else {
        paymentData.userId = userData.userId;
        paymentData.userEmail = userData.userEmail;
        paymentData.userName = userData.userName;
        paymentData.userOrderItems = orderPayload.orderItems || orderPayload.orderItemDTOS;
      }
      
      this.dialog.open(PaymentComponent, {
        data: paymentData
      });
    },
    error: (err) => {
      console.error(`${isGuest ? 'Guest' : 'User'} order creation failed:`, err);
      alert(`Failed to create ${isGuest ? 'guest' : ''} order. Please try again later.`);
    }
  });}

private mapCartItemsToOrderItems(cartItems: CartItem[]): any[] {
  return cartItems.map(item => {
    if (item.itemType === 'FOOD' && item.food) {
      return {
        itemType: 'FOOD',  
        foodId: item.food.id,  
        foodName: item.food.name,
        quantity: item.quantity,
        price: Number(this.cartService.calculateItemTotal(item)),
        pecialInstructions: item.specialInstructions,
        customIngredients: item.ingredients
              ?.filter(ing => ing.id != null)
              .map(ing => ({
                ingredientId: ing.id,
                ingredientName: ing.name,
                extraCost: ing.extraCost,
                quantity: 1
              })) || []
      };
    }

    if (item.itemType === 'DRINK' && item.drink) {
      const sizeValue = item.size || 'MEDIUM';
      const iceOptionValue = item.iceOption || 'WITH_ICE';    
      
      return {
        itemType: 'DRINK',  
        drinkId: item.drink.id,
        drinkName: item.drink.name,
        quantity: item.quantity,
        price: this.cartService.calculateItemTotal(item),
        size: sizeValue,      
        iceOption: iceOptionValue,
        specialInstructions: item.specialInstructionsDrink,
        customIngredients: []  
      };
    }
    
    console.error('Invalid cart item:', item);
    throw new Error(`Invalid cart item type: ${item.itemType}`);
  });
}
private mapCartItemsToOrderItemsForUser(cartItems: CartItem[]): any[] {
  return cartItems.map(item => {
    if (item.itemType === 'FOOD' && item.food) {
      return {
        itemType: 'FOOD',  
        foodId: item.food.id,  
        foodName: item.food.name,
        quantity: item.quantity,
        price: Number(this.cartService.calculateItemTotal(item)),
        customIngredients: item.ingredients
              ?.filter(ing => ing.id != null)
              .map(ing => ({
                ingredientId: ing.id,
                ingredientName: ing.name,
                extraCost: ing.extraCost,
                quantity: 1
              })) || []
      };
    }

    if (item.itemType === 'DRINK' && item.drink) {
      const sizeValue = item.size || 'MEDIUM';
      const iceOptionValue = item.iceOption || 'WITH_ICE';    
      
      return {
        itemType: 'DRINK',  
        drinkId: item.drink.id,
        drinkName: item.drink.name,
        quantity: item.quantity,
        price: this.cartService.calculateItemTotal(item),
        size: sizeValue,      
        iceOption: iceOptionValue,
        customIngredients: []  
      };
    }
    
    console.error('Invalid cart item:', item);
    throw new Error(`Invalid cart item type: ${item.itemType}`);
  });
}

private collectSpecialInstructions(cartItems: CartItem[]): string {
  const instructions: string[] = [];
  
  cartItems.forEach(item => {
    if (item.specialInstructions && item.specialInstructions.trim()) {
      instructions.push(`${item.food?.name || 'Food item'}: ${item.specialInstructions.trim()}`);
    }
    if (item.specialInstructionsDrink && item.specialInstructionsDrink.trim()) {
      instructions.push(`${item.drink?.name || item.drinkName || 'Drink item'}: ${item.specialInstructionsDrink.trim()}`);
    }
  });
  
  return instructions.join('\n\n');
}
}