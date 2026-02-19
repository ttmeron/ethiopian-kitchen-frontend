import { Injectable, } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../shared/models/cart-item.model';
import { CartComponent } from '../components/cart/cart.component';
import { SoftDrink } from './SoftDrink.service';

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

   private generateCartItemId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  constructor(private dialog: MatDialog) {
    this.loadInitialCart();

  } 
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

   private persistCart(items: CartItem[]): void {
    try {
     console.log('💾 Saving cart to sessionStorage:', items);
      sessionStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
      const saved = sessionStorage.getItem(this.CART_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }

addToCart(newItem: CartItem): void {

  if (newItem.itemType !== 'FOOD') {
    console.error('❌ addToCart() received a DRINK item. Use addDrinkToCart() instead.');
    return;
  }

  console.log('🔎 addToCart called with FOOD item:', {
    food: newItem.food!.name, 
    quantity: newItem.quantity,
    ingredients: newItem.ingredients,
    ingredientsCount: newItem.ingredients?.length || 0,
    specialInstructions: newItem.specialInstructions
  });

  const currentCart = this.cartSubject.value;

  const existingItemIndex = currentCart.findIndex(cartItem => {
    if (cartItem.itemType !== 'FOOD') return false;  

    const sameFood = cartItem.food?.id === newItem.food?.id;
    const sameIng = JSON.stringify(cartItem.ingredients) === JSON.stringify(newItem.ingredients);
    const sameInstructions = cartItem.specialInstructions === newItem.specialInstructions;

    return sameFood && sameIng && sameInstructions;
  });

  if (existingItemIndex !== -1) {
    currentCart[existingItemIndex].quantity += newItem.quantity;
  } else {
    const cartItemWithId: CartItem = {
      ...newItem,
      id: this.generateCartItemId(),
      itemType: 'FOOD'
    };
    currentCart.push(cartItemWithId);
  }

  this.cartSubject.next([...currentCart]);
  this.persistCart(currentCart);

  console.log('=== END CART DEBUG ===');
}

  getDrinkItems(): CartItem[] {
  return this.cartSubject.value.filter(item => item.itemType === 'DRINK');
}


  addDrinkToCart(drink: SoftDrink, quantity: number, size?: string, iceOption?: string, specialInstructions?: string): void {
    console.log('🍹 addDrinkToCart called:', {
      drink: drink.name,
      quantity: quantity,
      size: size,
      iceOption: iceOption,
      specialInstructions: specialInstructions
    });
    
    const currentCart = this.cartSubject.value;

    let sizeCost = 0;
    if (size === 'MEDIUM') {
      sizeCost = 1;
    } else if (size === 'LARGE') {
      sizeCost = 2;
    }
    
    const basePrice = drink.price || 0;
    const pricePerUnit = basePrice + sizeCost;
    const totalPrice = pricePerUnit * quantity;

   const newCartItem: CartItem = {
      id: this.generateCartItemId(),
      itemType: 'DRINK' as const,
      drink: drink,
      drinkName: drink.name,
      price: totalPrice, 
      unitPrice: pricePerUnit, 
      quantity: quantity,
      size: size,
      iceOption: iceOption,
      specialInstructionsDrink: specialInstructions
    };
   console.log('🚨 New cart item created:', {
    ...newCartItem,
    size: newCartItem.size,
    iceOption: newCartItem.iceOption
  });

   const existingItemIndex = currentCart.findIndex(cartItem => {
  if (cartItem.itemType !== 'DRINK') return false;  

  const isSameDrink = cartItem.drink?.id === drink.id;
  const sameSize = cartItem.size === size;
  const sameIce = cartItem.iceOption === iceOption;
  const sameInstructions = cartItem.specialInstructionsDrink === specialInstructions;

  return isSameDrink && sameSize && sameIce && sameInstructions;
});

  
    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push(newCartItem);
    }
    
    this.cartSubject.next([...currentCart]);
    this.persistCart(currentCart);
    
    console.log('🍹 Drink added to cart. Total items:', currentCart.length);
  
  }

  getCartItems(): CartItem[] {
    return this.cartSubject.value;
  }

  removeFromCart(item: CartItem): void {
  const currentCart = this.cartSubject.value.filter(cartItem => {
    if (item.itemType === 'DRINK') {
      return !(
        cartItem.itemType === 'DRINK' &&
        cartItem.drink?.id === item.drink?.id &&
        cartItem.size === item.size &&
        cartItem.iceOption === item.iceOption &&
        cartItem.specialInstructionsDrink === item.specialInstructionsDrink
      );
    }

    if (item.itemType === 'FOOD') {
      return !(
        cartItem.itemType === 'FOOD' &&
        cartItem.food?.id === item.food?.id &&
        this.areIngredientsEqual(cartItem.ingredients || [], item.ingredients || [])
      );
    }

    return true;
  });

  this.cartSubject.next([...currentCart]);
}


updateQuantity(item: CartItem, quantity: number): void {
  const currentCart = this.cartSubject.value;

  let index = -1;

  if (item.itemType === 'DRINK') {
   
    index = currentCart.findIndex(cartItem =>
      cartItem.itemType === 'DRINK' &&
      cartItem.drink?.id === item.drink?.id &&
      cartItem.size === item.size &&
      cartItem.iceOption === item.iceOption &&
      cartItem.specialInstructionsDrink === item.specialInstructionsDrink
    );
  } else {
   
    index = currentCart.findIndex(cartItem =>
      cartItem.itemType === 'FOOD' &&
      cartItem.food?.id === item.food?.id &&
      this.areIngredientsEqual(cartItem.ingredients || [], item.ingredients || [])
    );
  }

  if (index !== -1) {
    currentCart[index].quantity = quantity;
    this.cartSubject.next([...currentCart]);
  }
}


  clearCart(): void {
    this.cartSubject.next([]);
    localStorage.removeItem('cart');
  }

  private updateCart(items: CartItem[]): void {
    this.cartSubject.next(items);
    this.persistCart(items);
  }
 calculateBasePrice(item: CartItem): number {
  if (item.itemType === 'FOOD') {
    
    const baseFoodPrice = item.food?.price || 0;

    
    const ingredientsTotal = item.ingredients?.reduce((sum, ing) => {
      const quantity = ing.quantity || 1;
      return sum + (ing.extraCost * quantity);
    }, 0) || 0;

    return (baseFoodPrice + ingredientsTotal) * item.quantity;
  } else if (item.itemType === 'DRINK') {
    return (item.unitPrice || item.price || 0) * item.quantity;
  }

  return 0; 
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
    return this.getDeliveryMethod() === 'delivery' ? this.deliveryFee : 0;
  }
  calculateOrderTotalWithTax(items: CartItem[]): number {
    const subtotal = this.calculateOrderSubtotal(items);
    const tax = subtotal * this.TAX_RATE;
    const deliveryFee = this.getDeliveryFee();
    
    return subtotal + tax + deliveryFee;
  }


calculateItemTotal(item: CartItem): number {
  console.log('💰 CALCULATING ITEM TOTAL FOR:', {
    name: item.drinkName || item.food?.name,
    type: item.itemType,
    size: item.size,
    quantity: item.quantity
  });

  if (item.price && item.price > 0) {
    console.log('💰 Using pre-calculated price:', item.price);
    return item.price;
  }

  let total = 0;

  if (item.itemType === 'FOOD' && item.food) {
    total = item.food.price * item.quantity;

    if (item.ingredients) {
      const ingredientCost = item.ingredients.reduce(
        (sum, ing) => sum + (ing.extraCost ?? 0) * (ing.quantity || 1),
        0
      );
      total += ingredientCost;
    }
  }

  if (item.itemType === 'DRINK' && item.drink) {
    const basePrice = item.drink.price || 0;
    let sizeCost = 0;
    
    if (item.size === 'MEDIUM') sizeCost = 1;
    if (item.size === 'LARGE') sizeCost = 2;
    
    const pricePerUnit = basePrice + sizeCost;
    total = pricePerUnit * item.quantity;
    
    console.log('💰 Drink calculation:', {
      basePrice,
      sizeCost,
      pricePerUnit,
      quantity: item.quantity,
      total
    });
  }

  console.log('💰 FINAL TOTAL:', total);
  return total;
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
    this.cartSubject.next([...this.cartSubject.value]); 
  }
  
  private areIngredientsEqual(
    ing1: {name: string, extraCost: number}[] = [], 
    ing2: {name: string, extraCost: number}[] = []
  ): boolean {
    if (ing1.length === 0 && ing2.length === 0) return true;
    
    const sorted1 = [...ing1].sort((a, b) => 
      a.name.localeCompare(b.name) || a.extraCost - b.extraCost
    );
    const sorted2 = [...ing2].sort((a, b) => 
      a.name.localeCompare(b.name) || a.extraCost - b.extraCost
    );
  
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