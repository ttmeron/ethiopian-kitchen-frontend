import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { CartItem , CreateOrderRequest, OrderItemIngredientRequest, OrderItemRequest } from '../shared/models/cart-item.model';
import { GuestOrderResponse, GuestPaymentRequest, OrderResponse } from '../shared/models/order.model';
import { environment } from '../../environments/environment';
import { ApiAddOn } from '../shared/models/food-response.model';
import { CartService } from './cart.service';
import { PaymentDto, PaymentResponse } from '../shared/models/order.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })

export class OrderService {
  private readonly apiUrl = `${environment.orderApi}`
  private readonly paymentiUrl = `${environment.apiUrl}`

  constructor(private http: HttpClient, 
    private cartService: CartService,
    private authService: AuthService
  ) {}


  private getAuthToken(): string | null {
    return sessionStorage.getItem('authToken') || 
           localStorage.getItem('authToken') || 
           sessionStorage.getItem('token') ||
           localStorage.getItem('token');
  }

  private getTokenSource(): string {
    if (sessionStorage.getItem('authToken')) return 'sessionStorage.authToken';
    if (localStorage.getItem('authToken')) return 'localStorage.authToken';
    if (sessionStorage.getItem('token')) return 'sessionStorage.token';
    if (localStorage.getItem('token')) return 'localStorage.token';
    return 'none';
  }
private getUserInfo(): { userName: string; email: string } {
  console.log('🔍 Searching for user info...');
  
  const authUser = this.authService.getUser();
  if (authUser && authUser.userName && authUser.email) {
    console.log('✅ Found user info from AuthService:', authUser);
    return authUser;
  }
  
  let userName = sessionStorage.getItem('userName') || 
                localStorage.getItem('userName') || '';
  
  let email = sessionStorage.getItem('email') || 
              localStorage.getItem('email') || '';
  
  console.log('🔍 Fallback - Found in storage:', { userName, email });
  
  return { userName, email };
}

  getOrdersByEmail(email: string): Observable<OrderResponse[]> {
    console.log(`${this.apiUrl}/?email=${email}`)
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/by-email?email=${email}`);
  }
  
  getCurrentUserOrders(): Observable<OrderResponse[]> {
    const email = sessionStorage.getItem('email') || sessionStorage.getItem('guestEmail');
    
    if (!email) {
      throw new Error('No email found for current user or guest');
    }
  
    return this.getOrdersByEmail(email);
  }
  
getProcessingOrders(): Observable<OrderResponse[]> {
  const token = this.getAuthToken();
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.get<OrderResponse[]>(`${this.apiUrl}/status/CONFIRMED`, { headers });
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

    console.log('🚨 ===== HTTP REQUEST DEBUG START =====');
    console.log('📡 ENDPOINT:', isGuest ? `${this.apiUrl}/guest` : `${this.apiUrl}`);
    console.log('📡 IS GUEST:', isGuest);
    
    console.log('📦 ORDER DATA OBJECT:', orderData);
    console.log('📦 ORDER DATA TYPE:', typeof orderData);
    console.log('📦 ORDER DATA CONSTRUCTOR:', orderData.constructor.name);

    if ('orderItems' in orderData) {
        console.log('📋 Detected as CreateOrderRequest');
        console.log('📋 Order items count:', orderData.orderItems?.length || 0);
        
        if (orderData.orderItems) {
            orderData.orderItems.forEach((item: any, index: number) => {
                console.log(`📦 Item ${index}:`, {
                    itemType: item.itemType,
                    drinkId: item.drinkId,
                    drinkName: item.drinkName,
                    size: item.size,
                    iceOption: item.iceOption,
                    hasSize: 'size' in item,
                    hasIceOption: 'iceOption' in item,
                    sizeValue: item.size,
                    iceOptionValue: item.iceOption,
                    fullItem: item
                });
            });
        }
    } else if ('orderItemDTOS' in orderData) {
        console.log('📋 Detected as GuestOrderDTO-like object');
        console.log('📋 Order item DTOs count:', orderData.orderItemDTOS?.length || 0);
        
        if (orderData.orderItemDTOS) {
            orderData.orderItemDTOS.forEach((item: any, index: number) => {
                console.log(`📦 DTO Item ${index}:`, {
                    itemType: item.itemType,
                    drinkId: item.drinkId,
                    drinkName: item.drinkName,
                    size: item.size,
                    iceOption: item.iceOption,
                    hasSize: 'size' in item,
                    hasIceOption: 'iceOption' in item,
                    sizeValue: item.size,
                    iceOptionValue: item.iceOption,
                    fullItem: item
                });
            });
        }
    }
    
    console.log('📦 FULL ORDER DATA (JSON):', JSON.stringify(orderData, null, 2));
    console.log('🚨 ===== HTTP REQUEST DEBUG END =====');

    

    const token = this.getAuthToken();

   console.log('🔍 CRITICAL - createOrder validation:', {
        tokenExists: !!token,
        isGuestParameter: isGuest,
        
        dataType: orderData.constructor.name,
        hasUserName: !!(orderData as any).userName,
        hasEmail: !!(orderData as any).email,
        hasIsGuestField: 'isGuest' in orderData,
        isGuestFieldValue: (orderData as any).isGuest,
        
        userName: (orderData as any).userName,
        email: (orderData as any).email,
        userNameLength: (orderData as any).userName?.length || 0,
        emailLength: (orderData as any).email?.length || 0,
        
        userNameValid: (orderData as any).userName && (orderData as any).userName.trim().length > 0,
        emailValid: (orderData as any).email && (orderData as any).email.includes('@')
    });
    
     console.log('🔍 OrderService - createOrder called:', {
    isGuest,
    tokenAvailable: !!token,
    tokenSource: this.getTokenSource(),
    orderData
  });

     let headers = new HttpHeaders({
    'Content-Type': 'application/json'
    });

  if (token && !isGuest) {
    headers = headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ Adding Authorization header for user');
  } else {
    console.log('⚠️ No Authorization header (guest or no token)');
  }
  console.log('🔍 Headers being sent:', {
    'Content-Type': headers.get('Content-Type'),
    'Authorization': headers.get('Authorization')
  });

  const endpoint = isGuest ? `${this.apiUrl}/guest` : `${this.apiUrl}`;
  console.log('🔍 Making POST to:', endpoint);
    
    return this.http.post<OrderResponse | GuestOrderResponse>(endpoint, orderData, { headers }).pipe(
       catchError(error => {
      console.error('❌ Order creation failed:', error);
      if (error.status === 400) {
        console.error('❌ 400 Bad Request Details:');
        console.error('❌ Error Response:', error.error);
        console.error('❌ Full error:', error);
      } else if (error.status === 401 || error.status === 403) {
        console.error('❌ Authentication failed. Token might be expired or invalid.');
      }
      throw error;
    })
    );
  }
  

trackOrder(trackingToken: string): Observable<OrderResponse> {
  return this.http.get<OrderResponse>(`${this.apiUrl}/track/${trackingToken}`);
}


createOrderFromCart(cartItems: CartItem[]): Observable<OrderResponse | GuestOrderResponse> {

  console.log('🔍 CART ITEMS IN createOrderFromCart:', cartItems);
  
  const token = this.getAuthToken();
  const { userName, email } = this.getUserInfo();


   const isGuestOrder = !token || !userName || !email;;


 console.log('🔍 Order type determined:', {
    isGuest: isGuestOrder,
    reason: !token ? 'No token' : (!userName || !email ? 'Missing user info' : 'Valid user')
  });
  
  const subtotal = this.cartService.calculateOrderSubtotal(cartItems);
  const tax = this.cartService.TAX_RATE;

  const deliveryFee = this.cartService.getDeliveryFee();
  const totalAmount = subtotal + tax + deliveryFee;


  console.log('🔎 Cart items before mapping:', cartItems);
  console.log('🔎 Ingredients in first item:', cartItems[0]?.ingredients);

  console.log('🔍 CART ITEMS TO BE MAPPED:');
  cartItems.forEach((item, index) => {
    console.log(`Item ${index}:`, {
      itemType: item.itemType,
      foodId: item.food?.id,
      drinkId: item.drink?.id,
      size: item.size,           
      iceOption: item.iceOption,            
      hasSize: 'size' in item,
      hasIce: 'ice' in item,
      sizeValue: item.size,
      iceValue: item.iceOption,
      fullItem: item
    });
  });

  const orderItems: OrderItemRequest[] = cartItems.map(item => {
    console.log('🔍 Processing cart item:', {
    type: item.itemType,
    drinkName: item.drink?.name,
    size: item.size,
    ice: item.iceOption,
    fullItem: item
  });

  if (item.itemType === 'FOOD' && item.food) {
    return {
      itemType: 'FOOD',

      foodId: item.food.id,
      foodName: item.food.name,
      quantity: item.quantity,
      price: this.cartService.calculateItemTotal(item),
      customIngredients: this.mapIngredients(item.ingredients ?? []),
      addOns: this.mapAddOns(item.addOns ?? []),
      specialInstructions: item.specialInstructions
    };
  }

  if (item.itemType === 'DRINK' && item.drink) {

     console.log('🧃 MAPPING DRINK - Checking values:', {
    sizeFromCart: item.size,
    iceFromCart: item.iceOption,
    hasSize: !!item.size,
    hasIce: !!item.iceOption
  });

  if (!item.size || !item.iceOption) {
    console.error('❌ DRINK MISSING REQUIRED FIELDS:', {
      size: item.size,
      ice: item.iceOption,
      fullItem: item
    });
    throw new Error(`Drink "${item.drinkName}" is missing size or ice selection`);
  }
    return {
      itemType: 'DRINK',
      drinkId: item.drink.id,
      drinkName: item.drinkName ?? item.drink.name, 
      quantity: item.quantity,
      price: this.cartService.calculateItemTotal(item),
      size: item.size,
      iceOption: item.iceOption,
      specialInstructions: item.specialInstructionsDrink,
      customIngredients: [],
      addOns: this.mapAddOns(item.addOns ?? [])
    };
    
    
  }

  throw new Error('Invalid cart item');
});

console.log('🔍 MAPPED ORDER ITEMS:', JSON.stringify(orderItems, null, 2));


  const payload: CreateOrderRequest = {
  
    userName: userName || '',
    email: email || '',
    orderItems: orderItems,
    subtotal,
    totalPrice: totalAmount,
    isGuest: isGuestOrder
    
  };

  
  if (token && (!userName || !email)) {
    console.error('🚨 CONFLICT: Has token but missing user info!');
    console.error('Token:', token);
    console.error('User info:', { userName, email });
  }
  

   console.log('📤 FINAL PAYLOAD BEING SENT:', JSON.stringify(payload, null, 2));

  return this.createOrder(payload as CreateOrderRequest, isGuestOrder);

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
    guestOrderDTO: guestOrder 
  };

  return this.http.post<GuestOrderResponse>(`${this.paymentiUrl}/payments/confirm`, request);
}


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
   console.log('🚨 ===== INITIATE GUEST PAYMENT DEBUG =====');
   console.log('🔍 Calling endpoint:', `${this.paymentiUrl}/payments/initiate`);

   console.log('📦 GuestOrder object:', guestOrder);
   console.log('📦 GuestOrder orderItemDTOS count:', guestOrder.orderItemDTOS?.length || 0);

    if (guestOrder.orderItemDTOS) {
        guestOrder.orderItemDTOS.forEach((item: any, index: number) => {
            console.log(`📦 Guest DTO Item ${index}:`, {
                  itemType: item.itemType,
                  foodId: item.foodId,        
                  drinkId: item.drinkId,      
                  size: item.size,            
                  iceOption: item.iceOption, 
                  hasFoodId: 'foodId' in item,
                  hasDrinkId: 'drinkId' in item,
                  hasSize: 'size' in item,
                  hasIceOption: 'iceOption' in item,
            });
        });
    }
    
    console.log('📦 GuestOrder (JSON):', JSON.stringify(guestOrder, null, 2));
    console.log('🚨 ===== END DEBUG =====');


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

