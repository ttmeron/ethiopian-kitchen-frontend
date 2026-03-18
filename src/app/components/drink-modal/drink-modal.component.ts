import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { SoftDrink } from '../../services/SoftDrink.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-drink-modal',
  standalone:true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './drink-modal.component.html',
  styleUrl: './drink-modal.component.scss'
})
export class DrinkModalComponent implements OnInit{

   private baseUrl = environment.apiUrl;
  drink: any;
  selectedSize: string = 'MEDIUM';
  selectedIceLevel: string = 'NORMAL';
  quantity: number = 1;
  specialInstructions: string = '';
  totalPrice: number = 0;
  isAddingToCart: boolean = false;

  MAX_INSTRUCTIONS_LENGTH = 150;
  defaultImage = 'assets/default-image.jpg';


  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {drink: SoftDrink},
    private dialogRef: MatDialogRef<DrinkModalComponent>,
    private cartService: CartService
  ){
    this.drink = data.drink;
  }

  ngOnInit(): void {
  console.log('DRINK OBJECT (Modal):', this.drink);

  console.log('🔍 Drink object properties:', {
    id: this.drink.id,
    name: this.drink.name,
    dbSize: this.drink.size,          
    dbIceOption: this.drink.iceOption, 
    price: this.drink.price
  });


  this.selectedSize = 'MEDIUM';
  this.selectedIceLevel = 'NORMAL'

  this.calculateTotalPrice();
}


  getImageUrl(): string {
    if (!this.drink?.imagePath) return this.defaultImage;
    if (this.drink.imagePath.startsWith('http')) return this.drink.imagePath;
    return `${this.baseUrl}/images/${this.drink.imagePath}`;
  }

    handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.defaultImage; 
  }

  calculateTotalPrice(): void {

    let basePrice = this.drink.price || 0;
    
    let sizeCost = 0;
    switch (this.selectedSize) {
    case 'SMALL':
      sizeCost = 0; 
      break;
    case 'MEDIUM':
      sizeCost = 1; 
      break;
    case 'LARGE':
      sizeCost = 2; 
      break;
    default:
      sizeCost = 0;
    }
    
    this.totalPrice = (basePrice + sizeCost) * this.quantity;
  console.log('💰 Price calculation:', {
    basePrice,
    selectedSize: this.selectedSize,
    sizeCost,
    quantity: this.quantity,
    totalPrice: this.totalPrice
  });
  }

  updateTotalPrice(): void {
    this.calculateTotalPrice();
  }

  increaseQuantity(): void {
    this.quantity++;
    this.calculateTotalPrice();
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.calculateTotalPrice();
    }
  }

   get isInstructionsValid(): boolean {
    return this.specialInstructions.length <= this.MAX_INSTRUCTIONS_LENGTH;
  }

 async addToOrder(): Promise<void> {
  if (!this.isInstructionsValid) return;

  console.log('🎯 FINAL VALUES BEFORE ADDING TO CART:', {
    drinkId: this.drink.id,
    drinkName: this.drink.name,
    userSelectedSize: this.selectedSize,
    userSelectedIce: this.selectedIceLevel,
    quantity: this.quantity,
    
    // Compare with database values
    dbSize: this.drink.size,
    dbIceOption: this.drink.iceOption,
    
    // Check they're different
    sizeIsDifferent: this.selectedSize !== this.drink.size,
    iceIsDifferent: this.selectedIceLevel !== this.drink.iceOption
  });

  if (!this.selectedSize) {
    console.error('❌ Size not selected! Radio group might be hidden.');
    // Show error to user
    alert('Please select a size');
    return;
  }
  
  if (!this.selectedIceLevel) {
    console.error('❌ Ice level not selected! Radio group might be hidden.');
    alert('Please select an ice level');
    return;
  }

  this.isAddingToCart = true;

  try {
    this.cartService.addDrinkToCart(
      this.drink,
      this.quantity,
      this.selectedSize,
      this.selectedIceLevel,
      this.specialInstructions
    );

    this.dialogRef.close(true);
  } catch (error) {
    console.error('Error adding drink to cart:', error);
  } finally {
    this.isAddingToCart = false;
  }
}


}
