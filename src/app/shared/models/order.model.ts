import { ApiAddOn } from "./food-response.model";



export enum OrderStatus {
    PREPARING = 'PREPARING',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    PROCESSING = 'PROCESSING'


  } 
  export enum paymentStatus{

    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    COMPLETED = 'COMPLETED',
    REFUNDED = 'REFUNDED'
    

  }  
  
  export enum TimerStatus {
    NORMAL = 'normal',
    WARNING = 'warning',
    READY = 'ready'
  }
  
  export interface CustomIngredient {
    ingredientId?: number;
    ingredientName?: string; // Added for display purposes
    extraCost: number;
    quantity: number;
  }
  
  export interface OrderItem {
    foodId: number;
    foodName: string;
    price: number;
    quantity: number;
    customIngredients: CustomIngredient[];
    specialInstructions?: string; 
  }
  
  export interface OrderTiming {
    placedTime?: string; // ISO string
    estimatedReadyTime?: Date;
    remainingTime?: number; // in minutes
    timerStatus?: TimerStatus;
    
  }
  export interface DeliveryDTO {
    status: string;
    address: string;
  }
  
  export interface OrderResponse extends OrderTiming {
    orderId: number;
    totalPrice: number;
    orderNumber: string;            // ✅ Add this
    placedTime: string;
    status: OrderStatus; // Changed to enum
    userName: string;
    email: string;
    orderItems: OrderItem[];
    deliveryDTO?: DeliveryDTO;
  }

  export interface GuestOrderResponse extends OrderResponse {
    trackingToken: string;
    guestCredentials?: {
      email: string;
  }

}

export interface GuestPaymentRequest {
  guestName: string;
  guestEmail: string;
  orderItemDTOS: {
    foodName: string;
    quantity: number;
    price: number;
    customIngredients: {
      ingredientId?: number;
      ingredientName: string;
      extraCost: number;
      quantity: number;
    }[];
  }[];
  specialInstructions: string;
  totalAmount: number;
}

  export interface GuestOrderRequest {
    guestEmail: string;
    guestName: string;
    orderItems: OrderItem[];
    specialInstructions?: string;
    isGuestOrder: boolean;
    deliveryDTO?: DeliveryDTO; 
  }
  export interface PaymentDto {
    orderId: number;
    paymentMethod: string;
    guestEmail?: string;
    guestName?: string;
  }

  export interface PaymentResponse {
    paymentId: string;
    clientSecret: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    amount: number;
    orderId: number;
  }

  