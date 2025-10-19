import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FoodResponse, Ingredient } from '../../shared/models/food-response.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../shared/models/cart-item.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-food-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule, 
    MatIconModule],
  templateUrl: './food-modal.component.html',
  styleUrl: './food-modal.component.scss'
})
export class FoodModalComponent {


  defaultImage = '/assets/images/food-placeholder.jpg';
  isAddingToCart = false;

  quantity = 1;
  MAX_INSTRUCTIONS_LENGTH = 150;
  specialInstructions = '';
  totalPrice = 0;
  ingredientsWithSelection: (Ingredient & { selected: boolean })[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { food: FoodResponse },
    private dialogRef: MatDialogRef<FoodModalComponent>,
    private cartService: CartService
    ) {
    this.initializeIngredients();
    this.calculateTotalPrice();
  }


  calculateTotalPrice() {
    const extras = this.ingredientsWithSelection
      .filter(i => i.selected)
      .reduce((sum, i) => sum + i.extraCost, 0);
    this.totalPrice = (this.data.food.price + extras) * this.quantity;
  }

  updateTotalPrice() {
    this.calculateTotalPrice();
  }

  increaseQuantity() {
    this.quantity++;
    this.calculateTotalPrice();
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
      this.calculateTotalPrice();
    }
  }
  async addToOrder() {
    if (!this.isInstructionsValid) return;
    
    this.isAddingToCart = true;
    try {
      const selectedIngredients = this.ingredientsWithSelection
        .filter(i => i.selected)
        .map(ingredient => ({ 
          id: ingredient.id,
          name: ingredient.name, 
          price: ingredient.extraCost,
          extraCost: ingredient.extraCost,
          quantity: 1
        }));
      
      console.log('🔎 Selected ingredients for cart:', selectedIngredients);
  
      const cartItem: CartItem = {
        food: this.data.food,
        quantity: this.quantity,
        ingredients: selectedIngredients,
        specialInstructions: this.specialInstructions,
        totalPrice: this.totalPrice
      };
  
      console.log('🔎 Final CartItem with ingredients:', cartItem);
      
      await this.cartService.addToCart(cartItem);
      this.specialInstructions = '';
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      this.isAddingToCart = false;
    }
  }
  getImageUrl(): string {
    if (!this.data.food?.imagePath) return this.defaultImage;
    if (this.data.food.imagePath.startsWith('http')) return this.data.food.imagePath;
    return `http://localhost:8080/api/images/${this.data.food.imagePath}`;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
  }
  
  private initializeIngredients() {
    console.log('🔎 === INGREDIENT PRICE DEBUG ===');
    console.log('Raw ingredients data from API:', this.data.food.ingredients);
    
    // Detailed inspection of each ingredient
    this.data.food.ingredients?.forEach((ingredient, index) => {
      console.log(`Ingredient ${index}:`);
      console.log('  Name:', ingredient.name);
      console.log('  ID:', ingredient.id);
      console.log('  extraCost:', ingredient.extraCost);
      console.log('  price:', ingredient.price);
      console.log('  Full object:', JSON.stringify(ingredient));
    });
    
    // Ingredients now come with IDs from the API - no mapping needed!
    this.ingredientsWithSelection = this.data.food.ingredients?.map(ingredient => ({
      id: ingredient.id,        // ← Now comes directly from API
      name: ingredient.name,
      price: ingredient.extraCost,
      extraCost: ingredient.extraCost,
      selected: false
    })) || [];
    
    console.log('🔎 Final processed ingredients with API IDs:', this.ingredientsWithSelection);
    
    // Verify the prices one more time
    this.ingredientsWithSelection.forEach(ing => {
      console.log(`✅ ${ing.name}: extraCost = ${ing.extraCost}, price = ${ing.price}`);
    });
    console.log('🔎 === END INGREDIENT DEBUG ===');
  }
  get isInstructionsValid(): boolean {
    return this.specialInstructions.length <= this.MAX_INSTRUCTIONS_LENGTH;
  }
}

