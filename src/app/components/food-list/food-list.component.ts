import { Component, OnInit } from '@angular/core';
import { FoodResponse } from '../../shared/models/food-response.model';
import { FoodService } from '../../services/food.service';
import { CommonModule } from '@angular/common';
import { FoodItemComponent } from '../food-item/food-item.component';
import { HttpErrorResponse } from '@angular/common/http';
@Component({
  selector: 'app-food-list',
  standalone: true,
  imports: [CommonModule,FoodItemComponent],
  templateUrl: './food-list.component.html',
  styleUrl: './food-list.component.scss'
})
export class FoodListComponent implements OnInit {
  allFoods: FoodResponse[] = []; // Store all foods from API
  filteredFoods: FoodResponse[] = []; // Foods filtered by category
  categories: string[] = []; // Will be populated dynamically
  selectedCategory: string = 'All'; // Default category

  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private foodService: FoodService) { }

  ngOnInit(): void {
    this.loadAllFoods();
  }

  loadAllFoods(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.foodService.getAllFoods().subscribe({
      next: (foods) => {
        this.allFoods = foods;
        this.extractCategories();
        this.filterByCategory('All'); // Show all foods by default
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.handleError(err);
        this.isLoading = false;
      }
    });
  }

  extractCategories(): void {
    const allCategories = this.allFoods.map(food => food.category || 'Uncategorized');
    this.categories = ['All', ...new Set(allCategories)];
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    
    if (category === 'All') {
      this.filteredFoods = [...this.allFoods];
    } else {
      this.filteredFoods = this.allFoods.filter(food => 
        food.category === category
      );
    }
  }

  private handleError(error: HttpErrorResponse): void {
    console.error('Error fetching foods:', error);
    this.errorMessage = error.status === 404 
      ? 'Food items not found.' 
      : 'Failed to load food items. Please try again later.';
    this.filteredFoods = [];
  }

  retryLoading(): void {
    this.loadAllFoods();
  }
}