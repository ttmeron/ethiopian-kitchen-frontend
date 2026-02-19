import { Component, Input, Output,EventEmitter } from '@angular/core';
import { FoodResponse } from '../../shared/models/food-response.model';
import { CommonModule } from '@angular/common';
import { FoodModalComponent } from '../food-modal/food-modal.component';

import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-food-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './food-item.component.html',
  styleUrl: './food-item.component.scss'
})
export class FoodItemComponent {
  @Input() food!: FoodResponse;

  @Output() foodSelected = new EventEmitter<FoodResponse>();


  defaultImage = 'assets/default-food.png';

  constructor(
    private dialog: MatDialog) { }

  getImageUrl(): string {
    if (!this.food?.imagePath) return this.defaultImage;
    if (this.food.imagePath.startsWith('http')) return this.food.imagePath;
    return `http://localhost:8080/api/images/${this.food.imagePath}`;
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
  }
  onCardClick(): void {
    this.dialog.open(FoodModalComponent, {
      width: '500px',  
      data: { food: this.food },
      panelClass: 'custom-dialog-container' 
    });
  }
}

