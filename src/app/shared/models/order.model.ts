import { ApiAddOn } from "./food-response.model";



export enum OrderStatus {
    PREPARING = 'PREPARING',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    PROCESSING = 'PROCESSING',
    CONFIRMED = 'CONFIRMED'



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
    ingredientName?: string; 
    extraCost: number;
    quantity: number;
  }
  
  export interface OrderItem {
    itemType: 'FOOD' | 'DRINK';
    foodId: number;
    foodName: string;
    drinkName: string;
    price: number;
    
    quantity: number;

    size?: string;
    iceOption?: string;
    customIngredients: CustomIngredient[];
    specialInstructions?: string; 
  }
  
  export interface OrderTiming {
    placedTime?: string; 
    estimatedReadyTime?: Date;
    remainingTime: number; 
    timerStatus?: TimerStatus;


  remainingSeconds?: number;
  totalRemainingSeconds?: number;
    
  }
  export interface DeliveryDTO {
    status: string;
    address: string;
  }
  
  export interface OrderResponse extends OrderTiming {
    orderId: number;
    totalPrice: number;
    orderNumber: string;            
    placedTime: string;
    status: OrderStatus; 
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


export type GuestOrderItemDTO =
  | {
      itemType: 'FOOD';
      foodName: string;
      foodId: number;
      quantity: number;
      price: number;
      customIngredients: {
        ingredientId?: number;
        ingredientName: string;
        extraCost: number;
        quantity: number;
      }[];
    }
  | {
      itemType: 'DRINK';
      drinkId: number;
      drinkName: string;
      quantity: number;
      price: number;
      iceOption: string;  
      size: string; 
      customIngredients: [];
    };


export interface GuestPaymentRequest {
  guestName: string;
  guestEmail: string;
  guestToken: string;

  orderItemDTOS: GuestOrderItemDTO[];

  specialInstructions: string;
  totalAmount: number;

  subtotal?: number;
  tax?: number;
  deliveryFee?: number;
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

  