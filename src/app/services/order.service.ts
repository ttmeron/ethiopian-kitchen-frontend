import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { CartItem , CreateOrderRequest, OrderItemIngredientRequest } from '../shared/models/cart-item.model';
import { GuestOrderResponse, GuestPaymentRequest, OrderResponse } from '../shared/models/order.model';
import { environment } from '../enviironments/environment';
import { ApiAddOn } from '../shared/models/food-response.model';
import { CartService } from './cart.service';
import { PaymentDto, PaymentResponse } from '../shared/models/order.model';

@Injectable({ providedIn: 'root' })

export class OrderService {
  private readonly apiUrl = environment.orderApi
  private readonly paymentiUrl = environment.apiUrl

  constructor(private http: HttpClient,
    private cartService: CartService) {}


  getOrdersByEmail(email: string): Observable<OrderResponse[]> {
    console.log(`${this.apiUrl}/?email=${email}`)
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/by-email?email=${email}`);
  }
  
  getCurrentUserOrders(): Observable<OrderResponse[]> {
    // Try to get logged-in email, fallback to guest email
    const email = sessionStorage.getItem('email') || sessionStorage.getItem('guestEmail');
    
    if (!email) {
      throw new Error('No email found for current user or guest');
    }
  
    return this.getOrdersByEmail(email);
  }
  

  getProcessingOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/status/PROCESSING`);
  }
  
  getPaidOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/paid`);
  }
  

  markAsReady(orderId: number): Observable<OrderResponse> {
    return this.http.put<OrderResponse>(`${this.apiUrl}/${orderId}/ready`, {});
  }

  public createOrder(
    orderData: CreateOrderRequest | { guestName: string; guestEmail: string; orderItemDTOS: any[] },
    isGuest: boolean
  ): Observable<OrderResponse | GuestOrderResponse> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && !isGuest ? { 'Authorization': `Bearer ${token}` } : {})
    });

    const endpoint = isGuest ? `${this.apiUrl}/guest` : `${this.apiUrl}`;
    return this.http.post<OrderResponse | GuestOrderResponse>(endpoint, orderData, { headers }).pipe(
      catchError(error => {
        console.error('Order failed:', error);
        throw error;
      })
    );
  }
  

trackOrder(trackingToken: string): Observable<OrderResponse> {
  return this.http.get<OrderResponse>(`${this.apiUrl}/track/${trackingToken}`);
}

createOrderFromCart(cartItems: CartItem[]): Observable<OrderResponse | GuestOrderResponse> {
  const isGuest = !localStorage.getItem('authToken');

  const userName = sessionStorage.getItem('guestUserName') || sessionStorage.getItem('userName') || '';
  const email = sessionStorage.getItem('guestEmail') || sessionStorage.getItem('email') || '';

  const itemsInCart = this.cartService.getCartItems();
  const subtotal = this.cartService.calculateOrderSubtotal(cartItems);
  const tax = this.cartService.TAX_RATE;

  const deliveryFee = this.cartService.getDeliveryFee();
  const totalAmount = subtotal + tax + deliveryFee;


  console.log('🔎 Cart items before mapping:', cartItems);
  console.log('🔎 Ingredients in first item:', cartItems[0]?.ingredients);

  const orderItems = cartItems.map(item => {
    const mappedItem = {
      foodId: item.food.id,
      foodName: item.food.name,
      price: this.cartService.calculateItemTotal(item),
      quantity: item.quantity,
      customIngredients: this.mapIngredients(item.ingredients || []),
      addOns: this.mapAddOns(item.addOns || []),
      specialInstructions: item.specialInstructions
    };
    
    console.log('🔎 Mapped order item:', mappedItem);
    console.log('🔎 Custom ingredients in mapped item:', mappedItem.customIngredients);
    
    return mappedItem;
  });


  const payload: CreateOrderRequest = {
    userName,
    email,
    orderItems:orderItems,
    subtotal,
    totalPrice: totalAmount
    // isGuest // ✅ pass along for backend mapping if needed
  };

  console.log("🔎 Order payload being sent to backend:", JSON.stringify(payload, null, 2));


  return this.createOrder(payload, isGuest);
}

saveGuestOrder(guestOrder: GuestPaymentRequest): Observable<GuestOrderResponse> {
  return this.http.post<GuestOrderResponse>(`${this.apiUrl}/guest`, guestOrder).pipe(
    catchError(error => {
      console.error('Saving guest order failed:', error);
      throw error;
    })
  );
}

private mapIngredients(ingredients: any[]): OrderItemIngredientRequest[] {
  return ingredients.map(ing => ({
    ingredientId: ing.id,
    extraCost: ing.extraCost || 0,
    quantity: ing.quantity || 1
  }));
}

private mapAddOns(addOns: ApiAddOn[]): any[] {
  return addOns.map(addOn => ({
    addOnId: addOn.id,
    name: addOn.name,
    price: addOn.price,
    extraCost: addOn.extraCost || 0
  }));
}


createPayment(orderId: number, paymentData: PaymentDto): Observable<PaymentResponse> {
  return this.http.post<PaymentResponse>(`${this.apiUrl}/${orderId}/pay`, paymentData).pipe(
    catchError(error => {
      console.error('Payment failed:', error);
      throw error;
    })
  );
}
createGuestOrderAfterPayment(order: GuestPaymentRequest, paymentIntentId: string) {
  return this.http.post<any>(
    `${this.paymentiUrl}/payments/guest/after-payment?paymentIntentId=${paymentIntentId}`,
    order
  );
}
confirmPayment(
  paymentIntentId: string, 
  email: string, 
  name: string, 
  guestOrder: GuestPaymentRequest
): Observable<GuestOrderResponse> {
  const request = {
    paymentIntentId: paymentIntentId,
    email: email,
    userName: name,
    guestOrderDTO: guestOrder  // ← Send the entire guestOrder object
  };

  return this.http.post<GuestOrderResponse>(`${this.paymentiUrl}/payments/confirm`, request);
}

// confirmPayment(
//   paymentIntentId: string, 
//   email: string, 
//   name: string, 
//   guestOrder: GuestPaymentRequest
// ): Observable<GuestOrderResponse> {
//   return this.http.post<GuestOrderResponse>(`${this.paymentiUrl}/payments/confirm`, {
//     paymentIntentId,
//     email,
//     userName: name,
//     guestOrderDTO: guestOrder
//   });
// }

confirmUserPayment(orderId: number, paymentIntentId: string): Observable<OrderResponse> {
  return this.http.put<OrderResponse>(`${this.apiUrl}/${orderId}/pay`, { paymentIntentId });
}

initiateUserPayment(orderId: number, totalAmount: number): Observable<PaymentResponse> {
  return this.http.post<PaymentResponse>(`${this.apiUrl}/initiate`, {orderId, amount: totalAmount }).pipe(
    catchError(error => {
      console.error('Payment initiation failed:', error);
      throw error;
    })
  );
}

initiateGuestPayment(guestOrder: GuestPaymentRequest): Observable<PaymentResponse> {
  return this.http.post<PaymentResponse>(`${this.paymentiUrl}/payments/initiate`, guestOrder).pipe(
    catchError(error => {
      console.error('Guest payment initiation failed:', error);
      throw error;
    })
  );
}

payForOrder(orderId: number, paymentData: PaymentDto): Observable<PaymentResponse> {
  return this.http.post<PaymentResponse>(`${this.apiUrl}/${orderId}/pay`, paymentData).pipe(
    catchError(error => {
      console.error('Payment failed:', error);
      throw error;
    })
  );
}


}

