import { Component , Inject, OnInit,ElementRef, ViewChild} from '@angular/core';

import { loadStripe } from '@stripe/stripe-js';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CartItem } from '../../shared/models/cart-item.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule} from '@angular/common'; 
import {  Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

import { ReactiveFormsModule, FormsModule, } from '@angular/forms';
import { environment } from '../../enviironments/environment';
import { MatSelectModule } from '@angular/material/select';
import { OrderService } from '../../services/order.service';
import { firstValueFrom } from 'rxjs';


import { GuestPaymentRequest } from '../../shared/models/order.model';
import { CartService } from '../../services/cart.service';
import {  MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GuestAuthService } from '../../services/guest-auth.service';

export interface PaymentDialogData {
  totalAmount: number;
  orderId: number;
  cartItems?: CartItem[];
  isGuest?: boolean;
  guestName: string;
  guestEmail: string;
  guestOrderItems?: any[]; 
  guestOrder?: GuestPaymentRequest; 
  specialInstructions?: string;
  clientSecret?: string;
  guestToken?: string; 

  paymentAlreadyInitiated?: boolean;
  
}


@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCheckboxModule,  
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent implements OnInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  private stripePromise = loadStripe(environment.stripePublishableKey);
  stripe!: Stripe | null;
  elements!: StripeElements;
  card!: StripeCardElement;

  paymentForm!: FormGroup;
  isProcessing = false;
  errorMessage: string | null = null;
  totalAmount: number = 0;
  loading: boolean = false;

  paymentData = {
    name: '',
    email: '',
    remember: false
  };

  paymentMethods: string[] = ['Credit Card', 'PayPal', 'Cash'];
  clientSecret!: string;
  paymentTitle: string = 'Choose Payment Method'; 

  constructor(
    private cartService: CartService,
    private fb: FormBuilder,
    private orderService: OrderService,
    private guestAuthService: GuestAuthService,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData, 
    private dialogRef: MatDialogRef<PaymentComponent>
  ) {}

  async ngOnInit() {
    this.totalAmount = this.data.totalAmount;
    this.paymentForm = this.fb.group({
      paymentMethod: ['', Validators.required],  
      cardName: [''],
      rememberCard: [false]   
    });

    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(value => {
      this.paymentTitle = value ? 'Payment Details' : 'Choose Payment Method';
    });

    this.stripe = await this.stripePromise;
    if (!this.stripe) {
      console.error('Stripe failed to initialize');
      return;
    }

    this.elements = this.stripe.elements();
  }

  onPaymentMethodChange() {
    const selectedMethod = this.paymentForm.get('paymentMethod')?.value;
    
    if (selectedMethod !== 'Credit Card') {
      this.errorMessage = null;
    }
    
    if (selectedMethod !== 'Credit Card') {
      this.paymentForm.get('cardName')?.clearValidators();
    } else {
      this.paymentForm.get('cardName')?.setValidators([Validators.required]);
    }
    this.paymentForm.get('cardName')?.updateValueAndValidity();
    
    if (selectedMethod === 'Credit Card') {
      setTimeout(() => {
        this.initializeStripeCardElement();
      }, 100); 
    } else if (this.card) {
      this.card.unmount();
      this.card = null as any;
    }
  }

  private initializeStripeCardElement() {
    if (!this.stripe || !this.cardElementRef) {
      console.error('Stripe or card element reference not available');
      return;
    }

    if (this.card) {
      this.card.unmount();
    }

    this.card = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a',
        },
      },
    });

    this.card.mount(this.cardElementRef.nativeElement);

    this.card.on('change', (event) => {
      if (event.error) {
        this.errorMessage = event.error.message;
      } else {
        this.errorMessage = null;
      }
    });

    this.card.on('ready', () => {
      console.log('Stripe card element ready');
    });
  }

  getPaymentTitle(): string {
    const selectedMethod = this.paymentForm?.get('paymentMethod')?.value;
    
    if (!selectedMethod) {
      return 'Choose Payment Method';
    } else {
      return 'Payment Details';
    }
  }

  onSubmit() {
    if (this.paymentForm.valid) {
      this.confirmPayment();
    } else {
      this.errorMessage = 'Please fill in all required fields.';
      Object.keys(this.paymentForm.controls).forEach(key => {
        this.paymentForm.get(key)?.markAsTouched();
      });
    }
  }


  async confirmPayment() {
  console.log(' DEBUG: this.data.cartItems:', this.data.cartItems);
  
  const freshCartItems = this.cartService.getCartItems();
  console.log(' DEBUG: Fresh cart items from service:', freshCartItems);
  
  if (freshCartItems) {
    freshCartItems.forEach((item, index) => {
      console.log(`Fresh cart item ${index}:`, {
        itemType: item.itemType,
        drinkName: item.drink?.name,
        size: item.size,
        iceOption: item.iceOption,
        hasSize: 'size' in item,
        hasIceOption: 'iceOption' in item,
        allProperties: Object.keys(item)
      });
    });
  }

  if (!this.paymentForm.valid) return;
  if (!this.stripe || !this.card) {
    this.errorMessage = 'Stripe is not initialized.';
    return;
  }

  this.isProcessing = true;
  this.errorMessage = null;

  try {
    let clientSecret: string;

    if (this.data.isGuest) {
      if (this.data.clientSecret) {
        clientSecret = this.data.clientSecret;
        console.log('🔄 Using pre-initiated payment intent from guest dialog');
      } else {
        if (!freshCartItems || freshCartItems.length === 0) return;

        const subtotal = this.cartService.calculateOrderSubtotal(freshCartItems);
        const tax = this.cartService.calculateTax();
        const deliveryFee = this.cartService.getDeliveryFee();
        const totalAmount = subtotal + tax + deliveryFee;

        const guestToken = this.data.guestToken || this.guestAuthService.getGuestToken();
        console.log(' Payment using guestToken:', guestToken);

        const guestPaymentPayload: GuestPaymentRequest = {
          guestName: this.data.guestName || 'Guest',
          guestEmail: this.data.guestEmail || '',
          guestToken: guestToken,
          orderItemDTOS: freshCartItems.map(item => {  
            if (item.itemType === 'FOOD' && item.food) {
              return {
                itemType: 'FOOD' as const,
                foodId: item.food.id,
                foodName: item.food.name,
                price: this.cartService.calculateItemTotal(item) ?? 0,
                quantity: item.quantity,
                customIngredients: this.mapIngredients(item.ingredients ?? [])
              };
            }
            
            if (item.itemType === 'DRINK' && item.drink) {
              console.log('🧃 Adding drink to guest payload from fresh cart:', {
                drinkId: item.drink.id,
                size: item.size,
                iceOption: item.iceOption,
                hasSize: 'size' in item,
                hasIceOption: 'iceOption' in item,
                fullItem: item
              });
              
              const sizeValue = item.size || 'MEDIUM';
              const iceOptionValue = item.iceOption || 'WITH_ICE';
              
              return {
                itemType: 'DRINK' as const,
                drinkId: item.drink.id,
                drinkName: item.drink.name,
                price: this.cartService.calculateItemTotal(item) ?? 0,
                quantity: item.quantity,
                size: sizeValue,
                iceOption: iceOptionValue,
                customIngredients: []
              };
            }
            
            console.error('Invalid cart item:', item);
            return null;
          }).filter(item => item !== null) as any[],

          totalAmount,
          specialInstructions: this.data.specialInstructions || ''
        };

        console.log('GuestPaymentPayload created:', JSON.stringify(guestPaymentPayload, null, 2));
        
        const paymentResponse = await firstValueFrom(
          this.orderService.initiateGuestPayment(guestPaymentPayload)
        );

        clientSecret = paymentResponse.clientSecret;
      }

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            name: this.paymentForm.get('cardName')?.value || this.data.guestName || 'Guest',
            email: this.data.guestEmail
          }
        }
      });

      if (result.error) {
        this.errorMessage = result.error.message || null;
        return;
      }

      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
       
        const guestPaymentPayload: GuestPaymentRequest = {
          guestName: this.data.guestName || 'Guest',
          guestEmail: this.data.guestEmail || '',
          guestToken: this.data.guestToken || this.guestAuthService.getGuestToken(),
          orderItemDTOS: freshCartItems.map(item => {  
            if (item.itemType === 'FOOD' && item.food) {
              return {
                itemType: 'FOOD' as const,
                foodId: item.food.id,
                foodName: item.food.name,
                quantity: item.quantity,
                price: this.cartService.calculateItemTotal(item) ?? 0,
                customIngredients: item.ingredients
                    ?.filter(ing => ing.id != null)
                    .map(ing => ({
                      ingredientId: ing.id!,
                      ingredientName: ing.name,
                      extraCost: ing.extraCost,
                      quantity: 1
                    })) || []
              };
            }

            if (item.itemType === 'DRINK' && item.drink) {
              console.log('🧃 Final drink item for confirmation from fresh cart:', {
                drinkId: item.drink.id,
                size: item.size,
                iceOption: item.iceOption,
                fullItem: item
              });
              
              const sizeValue = item.size || 'MEDIUM';
              const iceOptionValue = item.iceOption || 'WITH_ICE';
              
              return {
                itemType: 'DRINK' as const,
                drinkId: item.drink.id,
                drinkName: item.drink.name,
                quantity: item.quantity,
                price: this.cartService.calculateItemTotal(item) ?? 0,
                size: sizeValue,         
                iceOption: iceOptionValue,
                customIngredients: []
              };
            }

            console.error('Invalid cart item:', item);
            return null;
          }).filter(item => item !== null) as any[],

          totalAmount: this.data.totalAmount,
          specialInstructions: this.data.specialInstructions || ''
        };

        console.log('📤 Final GuestPaymentPayload for confirmation:', JSON.stringify(guestPaymentPayload, null, 2));
        
        const savedOrder = await firstValueFrom(
          this.orderService.confirmPayment(
            result.paymentIntent.id,
            this.data.guestEmail || '',
            this.data.guestName || 'Guest',
            guestPaymentPayload
          )
        );

        console.log('Guest order saved:', savedOrder);
        this.cartService.clearCart();
        localStorage.removeItem('guestEmail');
        localStorage.removeItem('guestName');
        sessionStorage.removeItem('guestEmail');
        sessionStorage.removeItem('guestName');
        this.dialogRef.close({ success: true, order: savedOrder });
      }

    } else {
      const paymentResponse = await firstValueFrom(
        this.orderService.initiateUserPayment(this.data.orderId, this.data.totalAmount)
      );

      clientSecret = paymentResponse.clientSecret;

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            name: this.paymentForm.get('cardName')?.value || 'User'
          }
        }
      });

      if (result.error) {
        this.errorMessage = result.error.message ?? null;
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        const savedOrder = await firstValueFrom(
          this.orderService.confirmUserPayment(this.data.orderId, result.paymentIntent.id)
        );

        console.log('User order saved:', savedOrder);
        this.cartService.clearCart();
        this.dialogRef.close({ success: true, order: savedOrder });
      }
    }

  } catch (err: any) {
    console.error('Error during payment flow:', err);
    this.errorMessage = err?.message || 'Payment failed';
  } finally {
    this.isProcessing = false;
  }
}
  private mapIngredients(ingredients: any[]): any[] {
    return ingredients.map(ing => ({
      ingredientId: ing.id,
      extraCost: ing.extraCost || 0,
      quantity: ing.quantity || 1
    }));
  }


  closeDialog(): void {
    this.dialogRef.close();
  }
  
  cancel() {
    this.dialogRef.close({ success: false });
  }
}