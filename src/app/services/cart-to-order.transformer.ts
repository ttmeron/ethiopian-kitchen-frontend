import { CartItem,CreateOrderRequest,OrderItemRequest,OrderItemIngredientRequest} from "../shared/models/cart-item.model";
// import {
//   CreateOrderRequest,
//   OrderItemRequest,
//   OrderItemIngredientRequest
// } from '../../shared/models/car.model';

export class CartToOrderTransformer {
  // Main method to transform cart items into backend order request
  transformCartToOrder(cartItems: CartItem[]): CreateOrderRequest {
    return {
      orderItems: cartItems.map(item => ({
        foodId: item.food.id,
        foodName: item.food.name,
        price: item.food.price,
        quantity: item.quantity,
        customIngredients: this.transformIngredients(item.ingredients)
      })),
      totalAmount: this.calculateTotal(cartItems),
      userName: this.getCurrentUser().name,
      email: this.getCurrentUser().email
    };
  }

  // ✅ Place this helper method below the main one
  private transformIngredients(
    ingredients?: CartItem['ingredients']
  ): OrderItemIngredientRequest[] {
    return ingredients?.map(ing => {
      if (ing.id == null) {
        throw new Error("Ingredient ID is required");
      }
      return {
        ingredientId: ing.id,
        extraCost: ing.extraCost,
        quantity: ing.quantity || 1
      };
    }) || [];
  }

  // Dummy placeholder methods – implement based on your app logic
  private calculateTotal(cartItems: CartItem[]): number {
    return cartItems.reduce((total, item) =>
      total + item.quantity * item.food.price, 0);
  }

  private getCurrentUser() {
    // Replace this with your actual user retrieval logic (e.g., from auth service)
    return {
      name: 'Test User',
      email: 'test@example.com'
    };
  }
}
