import { SoftDrink } from "../../services/SoftDrink.service";
import { FoodResponse } from "./food-response.model";


export interface CartItem {
  id: number;
  itemType: 'FOOD' | 'DRINK';
  quantity: number;

  food?: FoodResponse;
  ingredients?: { id: number; name: string; quantity?: number; extraCost: number }[];
  specialInstructions?: string;

  drink?: SoftDrink;
  drinkName?: string;
  price?: number;
  unitPrice?: number;
  size?: string;
  iceOption?: string;
  specialInstructionsDrink?: string;

  totalPrice?: number; 
  addOns?: ApiAddOn[];
}

 



export interface ApiAddOn {
  id: number;
  name: string;
  price: number;
  extraCost?: number; 
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
  itemType: 'FOOD' | 'DRINK';
  foodId: number;
  foodName: string;
  price: number;
  quantity: number;
  customIngredients: CustomIngredient[];
  addOns?: ApiAddOn[];
  specialInstructions?: string; 

  size?: string;
  iceOption?: string;
}

export interface CustomIngredient {
  ingredientId: number;
  extraCost: number;
  quantity: number;
}


export type OrderItemRequest =
  | {
      itemType: 'FOOD';
      foodId: number;
      foodName: string;
      quantity: number;
      price: number;
      customIngredients: OrderItemIngredientRequest[];
      addOns?: AddOnRequest[];
      specialInstructions?: string;
    }
  | {
      itemType: 'DRINK';
      drinkId: number;
      drinkName: string;
      quantity: number;
      price: number;
      size?: string;
      iceOption?: string;
      addOns?: AddOnRequest[];
      specialInstructions?: string;
    };


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
    isGuest:boolean;
  }