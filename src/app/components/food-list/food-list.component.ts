import { Component, OnInit } from '@angular/core';
import { FoodResponse } from '../../shared/models/food-response.model';
import { FoodService } from '../../services/food.service';
import { CommonModule } from '@angular/common';
import { FoodItemComponent } from '../food-item/food-item.component';
import { HttpErrorResponse } from '@angular/common/http';
import { SoftDrinkService } from '../../services/SoftDrink.service';
import { forkJoin } from 'rxjs';
import { DrinkItemComponent } from '../drink-item/drink-item.component';
import { MatDialog } from '@angular/material/dialog';
import { DrinkModalComponent } from '../drink-modal/drink-modal.component';
import { FoodModalComponent } from '../food-modal/food-modal.component';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imagePath?: string | null;
  category: string;
  type: 'food' | 'drink';
  
  ingredients?: any[];
  createdAt?: string; 
  available?: boolean;
  spiceLevels?: string[];
  size?: string;
  iceOption?: string;
  isActive?: boolean;
  displayOrder?: number;
}

@Component({
  selector: 'app-food-list',
  standalone: true,
  imports: [CommonModule,FoodItemComponent,DrinkItemComponent],
  templateUrl: './food-list.component.html',
  styleUrl: './food-list.component.scss'
})
export class FoodListComponent implements OnInit {
  allItems: any[] = []; 
  filteredItems: any[] = []; 
  categories: string[] = []; 
  selectedCategory: string = 'All'; 

  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private foodService: FoodService,
    private softDrinkService: SoftDrinkService,
    private dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadAllItems();

     setTimeout(() => {
    console.log('Drink items in allItems:', 
      this.allItems.filter(item => item.type === 'drink'));
  }, 1000);
  }

 loadAllItems(): void {
  this.isLoading = true;
  this.errorMessage = null;
  
  forkJoin({
    foods: this.foodService.getAllFoods(),
    drinks: this.softDrinkService.getAllSoftDrinks()
  }).subscribe({
    next: ({ foods, drinks }) => {
      
      let foodItems: MenuItem[] = [];
      if (foods && Array.isArray(foods)) {
         console.log('🍔 Raw foods from API:', JSON.stringify(foods, null, 2));
  
        foodItems = foods.map(food => {
          console.log('Processing food:', food.name, 'category:', food.category);
          return{
          id: food.id || 0,
          name: food.name || 'Unknown',
          description: food.description,
          price: food.price || 0,
          imagePath: food.imagePath,
          category: food.category || 'Food',
          type: 'food' as const,
          ingredients: food.ingredients || [],
          createdAt: food.createdAt || '',
          available: food.available !== undefined ? food.available : true,
          spiceLevels: food.spiceLevels || []
          };
        });
        
        console.log('✅ Mapped foods categories:', foodItems.map(f => f.category));
      }

      let drinkItems: MenuItem[] = [];
      if (drinks && Array.isArray(drinks)) {
        console.log('📸 Raw drinks data:', drinks);
        drinkItems = drinks.map(drink => ({
          id: drink.id,
          name: drink.name,
          description: drink.description,
          price: drink.price,
          imagePath: drink.imagePath,
          hasImage: !!drink.imagePath ,
          category: 'Drinks',
          type: 'drink' as const,
          size: drink.Size,
          iceOption: drink.iceOption
        }));
      } else {
        console.warn('⚠️ Drinks is not an array:', drinks);
      }

      this.allItems = [...foodItems, ...drinkItems];
      console.log('✅ Combined items:', this.allItems);
      console.log('📊 Total items:', this.allItems.length);
      
      this.extractCategories();
      this.filterByCategory('All');
      this.isLoading = false;
    },
    error: (error) => {
      console.error('❌ Error loading menu items:', error);
      this.errorMessage = 'Failed to load menu items. Please try again later.';
      this.allItems = [];
      this.filteredItems = [];
      this.isLoading = false;
    }
  });

}
onFoodClick(food: MenuItem): void {
    console.log('Food clicked:', food);
    
    const foodResponse: FoodResponse = {
      id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      imagePath: food.imagePath,
      category: food.category,
      ingredients: food.ingredients || [],
      createdAt: food.createdAt || '',
      available: food.available !== undefined ? food.available : true,
      spiceLevels: food.spiceLevels || []
    };

    const dialogRef = this.dialog.open(FoodModalComponent, {
       width: '90%',
       maxWidth: '500px',  
       maxHeight: '90vh', 
       data: { food: foodResponse }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Food added to cart:', result);
       
      }
    });
  }

  onDrinkClick(drink: MenuItem): void {
    console.log('Drink clicked:', drink);
    
    const dialogRef = this.dialog.open(DrinkModalComponent, {
      width: '500px',
      data: { drink: drink }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Drink added to order:', result);
      
      }
    });
  }



    convertItem(item: MenuItem): any {
      return item; 
    }

    get foodItems(): any[] {
      return this.filteredItems.filter(item => item.type === 'food');
    }

    get drinkItems(): any[] {
      return this.filteredItems.filter(item => item.type === 'drink');
    }

    get isAllCategory(): boolean {
      return this.selectedCategory === 'All';
    }



  extractCategories(): void {
    const allCategories = this.allItems.map(item => item.category || 'Uncategorized');
    this.categories = ['All', ...new Set(allCategories)];
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    
    if (category === 'All') {
      this.filteredItems = [...this.allItems];
    } else {
      this.filteredItems = this.allItems.filter(item => 
        item.category === category
      );
    }
  }

getItemImage(item: MenuItem): string {
  console.log(`🖼️ Getting image for ${item.name}:`, item.imagePath);
  
  if (!item.imagePath || item.imagePath.trim() === '') {
    return 'assets/default-image.jpg';
  }
  
  if (item.imagePath.startsWith('/api/images/')) {
    return `http://localhost:3000${item.imagePath}`;
  }
  
  if (item.imagePath.startsWith('http://') || item.imagePath.startsWith('https://')) {
    return item.imagePath;
  }
  
  if (item.imagePath.startsWith('assets/')) {
    return item.imagePath;
  }
  
  return 'assets/default-image.jpg';
}
  private handleError(error: HttpErrorResponse): void {
    console.error('Error fetching foods:', error);
    this.errorMessage = error.status === 404 
      ? 'Menu items not found.' 
      : 'Failed to load food items. Please try again later.';
    this.filteredItems = [];
  }

  retryLoading(): void {
    this.loadAllItems();
  }
}