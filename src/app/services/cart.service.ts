import { Injectable, } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../shared/models/cart-item.model';
import { CartComponent } from '../components/cart/cart.component';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  public readonly TAX_RATE = 0.08; 
  private readonly CART_STORAGE_KEY = 'cart';
  private deliveryFee = 3.99; 
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();
  private deliveryMethodSubject = new BehaviorSubject<'delivery' | 'pickup'>('pickup'); 

  constructor(private dialog: MatDialog) {
    this.loadInitialCart();

  } 
  // Initialize cart from localStorage
  private loadInitialCart(): void {
    try {
      const savedCart = localStorage.getItem(this.CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          this.cartSubject.next(parsedCart);
        } else {
          console.warn('Invalid cart data in storage, resetting cart');
          this.clearCart();
        }
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
      this.clearCart();
    }
  }

   // Helper method to persist cart state
   private persistCart(items: CartItem[]): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }


  addToCart(newItem: CartItem): void {

    console.log('🔎 addToCart called with newItem:', {
      food: newItem.food.name,
      quantity: newItem.quantity,
      ingredients: newItem.ingredients,  // This will now show IDs instead of undefined
      ingredientsCount: newItem.ingredients?.length || 0,
      specialInstructions: newItem.specialInstructions
    });
    
    const currentCart = this.cartSubject.value;
    
    // Strict comparison - must match ALL properties to merge
    const existingItemIndex = currentCart.findIndex(cartItem => {
      const isMatch = 
        cartItem.food.id === newItem.food.id &&
        JSON.stringify(cartItem.ingredients) === JSON.stringify(newItem.ingredients) &&
        cartItem.specialInstructions === newItem.specialInstructions;
      
      console.log('🔎 Comparing items - isMatch:', isMatch);
      console.log('🔎 Existing item ingredients:', cartItem.ingredients);
      console.log('🔎 New item ingredients:', newItem.ingredients);
      
      return isMatch;
    });
  
    if (existingItemIndex !== -1) {
      // Only increment if EXACT match found
      currentCart[existingItemIndex].quantity += newItem.quantity;
    } else {
      // Add as new item if not found
      currentCart.push({...newItem});
    }
    
    this.cartSubject.next([...currentCart]);
    this.persistCart(currentCart);

    console.log('🔎 Final cart has', currentCart.length, 'items');
    currentCart.forEach((item, index) => {
      console.log(`Item ${index}: ${item.food.name} (x${item.quantity})`);
    console.log('  Ingredients:', item.ingredients);
    console.log('  Ingredients count:', item.ingredients?.length || 0);
    console.log('  Special instructions:', item.specialInstructions);
  });

  console.log('=== END CART DEBUG ===');
  }

  getCartItems(): CartItem[] {
    return this.cartSubject.value;
  }

  removeFromCart(item: CartItem): void {
    const currentCart = this.cartSubject.value.filter(cartItem => 
      !(cartItem.food.id === item.food.id && 
        this.areIngredientsEqual(cartItem.ingredients || [], item.ingredients || []))
    );
    this.cartSubject.next([...currentCart]);
  }
  updateQuantity(item: CartItem, quantity: number): void {
    const currentCart = this.cartSubject.value;
    const index = currentCart.findIndex(cartItem => 
      cartItem.food.id === item.food.id && 
      this.areIngredientsEqual(cartItem.ingredients || [], item.ingredients || [])
    );
    
    if (index !== -1) {
      currentCart[index].quantity = quantity;
      this.cartSubject.next([...currentCart]);
    }
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }

  private updateCart(items: CartItem[]): void {
    this.cartSubject.next(items);
    this.persistCart(items);
  }
  calculateBasePrice(item: CartItem): number {
    return item.food.price * item.quantity;
  }
  getCartTotal(): number {
    return this.cartSubject.value.reduce(
      (total, item) => total + this.calculateItemTotal(item), 
      0
    );
  }
  calculateOrderSubtotal(items: CartItem[]): number {
    return items.reduce(
      (total, item) => total + this.calculateItemTotal(item), 
      0
    );
  }

  setDeliveryMethod(method: 'delivery' | 'pickup'): void {
    this.deliveryMethodSubject.next(method);
  }

  getDeliveryMethod(): 'delivery' | 'pickup' {
    return this.deliveryMethodSubject.value;
  }
  getDeliveryFee(): number {
    // Only charge delivery fee if delivery method is selected
    return this.getDeliveryMethod() === 'delivery' ? this.deliveryFee : 0;
  }
  calculateOrderTotalWithTax(items: CartItem[]): number {
    const subtotal = this.calculateOrderSubtotal(items);
    const tax = subtotal * this.TAX_RATE;
    const deliveryFee = this.getDeliveryFee();
    
    return subtotal + tax + deliveryFee;
  }


  calculateItemTotal(item: CartItem): number {
    // Calculate ingredients total - multiply extraCost by ingredient quantity
    const ingredientsTotal = item.ingredients?.reduce((sum, ing) => {
      const ingredientQuantity = ing.quantity || 1;
      return sum + (ing.extraCost * ingredientQuantity);
    }, 0) || 0;
    
    // Return (base food price + total ingredients cost) multiplied by item quantity
    return (item.food.price + ingredientsTotal) * item.quantity;
  }

  calculateTax(): number {
    return this.getCartTotal() * this.TAX_RATE;
  }
  

  getTotalWithTax(): number {
    const subtotal = this.getCartTotal();
    const tax = this.calculateTax();
    const deliveryFee = this.getDeliveryFee();
    return subtotal + tax + deliveryFee;
  }
  
  
  setDeliveryFee(fee: number): void {
    this.deliveryFee = fee;
    this.cartSubject.next([...this.cartSubject.value]); // Trigger update
  }
  
  private areIngredientsEqual(
    ing1: {name: string, extraCost: number}[] = [], 
    ing2: {name: string, extraCost: number}[] = []
  ): boolean {
    // If both are empty, consider them equal
    if (ing1.length === 0 && ing2.length === 0) return true;
    
    // Create copies and sort
    const sorted1 = [...ing1].sort((a, b) => 
      a.name.localeCompare(b.name) || a.extraCost - b.extraCost
    );
    const sorted2 = [...ing2].sort((a, b) => 
      a.name.localeCompare(b.name) || a.extraCost - b.extraCost
    );
  
    // Compare each property
    return sorted1.length === sorted2.length &&
      sorted1.every((ing, i) => 
        ing.name === sorted2[i].name && 
        ing.extraCost === sorted2[i].extraCost
      );
  }
  openCartDialog(): void {
    this.dialog.open(CartComponent, {
      width: '500px',
      maxHeight: '90vh',
      panelClass: 'cart-dialog-container'
    });
  }

}