import { FoodResponse } from "./food-response.model";


export interface CartItem {
  food: FoodResponse;
  quantity: number;
  ingredients?:{
    id: number; 
    name: string;
    quantity?: number;
    extraCost: number;
  }[];
  specialInstructions?: string;
  totalPrice?: number;
  addOns?: ApiAddOn[]
  
}
export interface ApiAddOn {
  id: number;
  name: string;
  price: number;
  extraCost?: number; // Optional in API response
  category?: string;
}
  
export interface OrderResponse {
  orderId: number;
  totalPrice: number;
  status: string;
  userName: string;
  email: string;
  orderItems: OrderItem[];
  deliveryDTO: {
    status: string;
  };
}


export interface OrderItem {
  foodId: number;
  foodName: string;
  price: number;
  quantity: number;
  customIngredients: CustomIngredient[];
  addOns?: ApiAddOn[];
  specialInstructions?: string; 
}

export interface CustomIngredient {
  ingredientId: number;
  extraCost: number;
  quantity: number;
}

export interface OrderItemRequest {
  foodId: number;
  foodName: string;
  price: number;
  quantity: number;
  customIngredients: CustomIngredientRequest[];
}
export interface OrderItemRequest {
  foodId: number;
  foodName: string;
  price: number;
  quantity: number;
  customIngredients: OrderItemIngredientRequest[];
  addOns?: AddOnRequest[];
  specialInstructions?: string;
}
export interface AddOnRequest {
  addOnId: number;
  name: string;
  price: number;
  extraCost?: number;
}

export interface CustomIngredientRequest {
  ingredientId: number;
  extraCost: number;
  quantity: number;
}

export interface OrderItemIngredientRequest {
    ingredientId: number;  
    extraCost: number;     
    quantity: number;     
  }

  export interface CreateOrderRequest {
    email: string;
    userName: string;
    orderItems: OrderItemRequest[];
    subtotal: number; 
    specialInstructions?: string;
    totalPrice: number;
    isGuestOrder?: boolean;
  }