import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { FoodResponse, Ingredient } from '../../shared/models/food-response.model';
import { AdminFoodService, FoodRequest } from '../../services/admin-food.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Overlay } from '@angular/cdk/overlay';
@Component({
  selector: 'app-admin-food-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule
  ],
  templateUrl: './admin-food-management.component.html',
  styleUrl: './admin-food-management.component.scss',encapsulation: ViewEncapsulation.None,
  providers: [
    // This helps with overlay positioning in tabs
    {
      provide: Overlay,
      useFactory: () => {
        const overlay = new Overlay();
        return overlay;
      }
    }
  ]
})
export class AdminFoodManagementComponent implements OnInit{
  foods: FoodResponse[] = [];
  ingredients: Ingredient[] = [];
  selectedTab = 0;

  defaultImage = 'assets/default-food.png';

  foodForm: FormGroup;

  isEditingFood = false;
  selectedFood: FoodResponse | null = null;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  // Ingredient form
  ingredientForm: FormGroup;
  
  isEditingIngredient = false;
  selectedIngredient: Ingredient | null = null;

  // Table columns
  foodColumns: string[] = ['name', 'category', 'price', 'ingredients', 'image', 'actions'];
  ingredientColumns: string[] = ['name', 'category', 'extraCost', 'isAvailable', 'actions'];

  // Available categories
  foodCategories: string[] = ['vegen', 'Combo', 'meet Lover', 'Beverage'];

  selectedIngredients: Ingredient[] = []; // Fixed: Use Ingredient type instead of any[]

  constructor(
    private adminService: AdminFoodService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.foodForm = this.createFoodForm();
    this.ingredientForm = this.createIngredientForm();
  }

  ngOnInit(): void {
    this.loadFoods();
    this.loadIngredients();

    setTimeout(() => {
      const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
      if (overlayContainer) {
        overlayContainer.style.zIndex = '99999';
      }
    }, 0);
  }

  createFoodForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      imagePath: [''],
      ingredients: this.fb.array([])
    });
  }

  createIngredientForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      extraCost: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      isAvailable: [true]
    });
  }

  get ingredientsArray(): FormArray {
    return this.foodForm.get('ingredients') as FormArray;
  }

  addIngredientToFood(ingredientId?: number, extraCost?: number): void {
    const ingredientGroup = this.fb.group({
      id: [ingredientId || '', Validators.required],
      extraCost: [extraCost || 0, [Validators.required, Validators.min(0)]]
    });
    this.ingredientsArray.push(ingredientGroup);
  }

  removeIngredientFromFood(index: number): void {
    this.ingredientsArray.removeAt(index);
  }

  loadFoods(): void {
    this.adminService.getFoods().subscribe({
      next: (foods) => this.foods = foods,
      error: (error) => console.error('Error loading foods:', error)
    });
  }

  loadIngredients(): void {
    this.adminService.getIngredients().subscribe({
      next: (ingredients) => this.ingredients = ingredients,
      error: (error) => console.error('Error loading ingredients:', error)
    });
  }

  getImageUrl(food: any): string {
    if (!food?.imagePath) {
      return 'assets/default-food.jpg';
    }

    if (food.imagePath.startsWith('http')) {
      return food.imagePath;
    }

    return `http://localhost:8080/api/images/${food.imagePath}`;
  }

  getIngredientFormGroup(index: number): FormGroup {
    return this.ingredientsArray.at(index) as FormGroup;
  }

  removeSelectedImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // FIXED: Properly handle ingredient selection
  onIngredientsSelected(selectedIds: number[]): void {
    this.selectedIngredients = selectedIds.map(id => {
      // Find existing ingredient first
      const existing = this.selectedIngredients.find(ing => ing.id === id);
      if (existing) return existing;
      
      // Find the ingredient from available list
      const ingredient = this.ingredients.find(ing => ing.id === id);
      
      if (!ingredient) {
        console.warn(`Ingredient with ID ${id} not found`);
        return null;
      }
      
      // Return the actual Ingredient object
      return {
        id: ingredient.id,
        name: ingredient.name,
        price: ingredient.price,
        extraCost: ingredient.extraCost,
        category: ingredient.category,
        isAvailable: ingredient.isAvailable
      };
    }).filter((ing): ing is Ingredient => ing !== null);
  }

  // Food Methods
  addFood(): void {
    this.isEditingFood = false;
    this.selectedFood = null;
    this.foodForm.reset({ 
      price: 0,
      category: '',
      ingredients: []
    });
    this.ingredientsArray.clear();
    this.selectedFile = null;
    this.imagePreview = null;
    this.selectedIngredients = []; // Clear selected ingredients
  }

  editFood(food: FoodResponse): void {
    this.isEditingFood = true;
    this.selectedFood = food;
    
    // Clear existing ingredients
    this.ingredientsArray.clear();
    this.selectedIngredients = []; // Clear selected ingredients
    
    // Add ingredients from the food to both form array and selected ingredients
    if (food.ingredients) {
      food.ingredients.forEach(ing => {
        this.addIngredientToFood(ing.id, ing.extraCost);
        this.selectedIngredients.push({
          id: ing.id,
          name: ing.name,
          price: ing.price,
          extraCost: ing.extraCost,
          category: ing.category,
          isAvailable: ing.isAvailable
        });
      });
    }
    
    this.foodForm.patchValue({
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      imagePath: food.imagePath
    });

    if (food.imagePath) {
      this.imagePreview = food.imagePath;
    }
  }

  submitFood(): void {
    if (this.foodForm.invalid) {
      console.log('Form is invalid');
      return;
    }
  
    const foodData: FoodRequest = {
      name: this.foodForm.value.name,
      description: this.foodForm.value.description,
      price: this.foodForm.value.price,
      category: this.foodForm.value.category,
      imagePath: this.foodForm.value.imagePath,
      ingredients: this.selectedIngredients.map(ing => ({
        id: ing.id,
        extraCost: ing.extraCost
      }))
    };
  
    console.log('Submitting food data:', foodData);
    console.log('Image file:', this.selectedFile);
  
    const handleError = (error: any, operation: string) => {
      console.error(`Error ${operation} food:`, error);
      
      if (error.status === 403) {
        alert(`Access denied. You need admin privileges to ${operation} foods.`);
      } else if (error.status === 401) {
        alert('Please login to perform this action.');
      } else if (error.status === 404) {
        alert('Food not found. It may have been deleted.');
      } else if (error.status === 400) {
        alert('Invalid data. Please check your input.');
      } else {
        alert(`Error ${operation} food. Please check the console for details.`);
      }
    };
  
    if (this.isEditingFood && this.selectedFood?.id) {
      this.adminService.updateFood(this.selectedFood.id, foodData, this.selectedFile ?? undefined).subscribe({
        next: (response) => {
          console.log('Food updated successfully:', response);
          this.loadFoods();
          this.resetFoodForm();
          alert('Food updated successfully!');
        },
        error: (error) => handleError(error, 'updating')
      });
    } else {
      this.adminService.createFood(foodData, this.selectedFile ?? undefined).subscribe({
        next: (response) => {
          console.log('Food created successfully:', response);
          this.loadFoods();
          this.resetFoodForm();
          alert('Food created successfully!');
        },
        error: (error) => handleError(error, 'creating')
      });
    }
  }

  deleteFood(food: FoodResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Food',
        message: `Are you sure you want to delete ${food.name}?`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && food.id) {
        this.adminService.deleteFood(food.id).subscribe({
          next: () => {
            this.loadFoods();
            alert('Food deleted successfully!');
          },
          error: (error) => {
            console.error('Error deleting food:', error);
            
            if (error.status === 403) {
              alert('Access denied. You need admin privileges to delete foods.');
            } else if (error.status === 401) {
              alert('Please login to perform this action.');
            } else if (error.status === 404) {
              alert('Food not found. It may have been already deleted.');
            } else {
              alert('Error deleting food. Please check the console for details.');
            }
          }
        });
      }
    });
  }

  resetFoodForm(): void {
    this.foodForm.reset();
    this.ingredientsArray.clear();
    this.isEditingFood = false;
    this.selectedFood = null;
    this.selectedFile = null;
    this.imagePreview = null;
    this.selectedIngredients = []; // Clear selected ingredients
  }

  // FIXED: Available ingredients getter
  get availableIngredients(): Ingredient[] {
    return this.ingredients.filter(ing => 
      !this.selectedIngredients.some(selected => selected.id === ing.id)
    );
  }

  getIngredientName(ingredientId: number): string {
    const ingredient = this.ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.name : 'Unknown Ingredient';
  }

  // FIXED: Use Ingredient type instead of ComponentIngredient
  addIngredient(ingredient: Ingredient) {
    if (!this.selectedIngredients.some(ing => ing.id === ingredient.id)) {
      this.selectedIngredients.push({
        id: ingredient.id,
        name: ingredient.name,
        price: ingredient.price,
        extraCost: ingredient.extraCost,
        category: ingredient.category,
        isAvailable: ingredient.isAvailable
      });
    }
  }

  getIngredientPrice(ingredientId: number): number {
    const ingredient = this.ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.extraCost : 0;
  }

  // FIXED: All ingredient methods now use number IDs consistently
  removeIngredient(index: number) {
    this.selectedIngredients.splice(index, 1);
  }

  removeIngredientById(ingredientId: number) { // Changed to number
    this.selectedIngredients = this.selectedIngredients.filter(
      ing => ing.id !== ingredientId
    );
  }

  isIngredientSelected(ingredientId: number): boolean { // Changed to number
    return this.selectedIngredients.some(ing => ing.id === ingredientId);
  }

  updateIngredientCost(index: number, newCost: number) {
    if (this.selectedIngredients[index]) {
      this.selectedIngredients[index].extraCost = newCost;
    }
  }

  // Ingredient Methods
  editIngredient(ingredient: Ingredient): void {
    this.isEditingIngredient = true;
    this.selectedIngredient = ingredient;
    this.ingredientForm.patchValue({
      name: ingredient.name,
      price: ingredient.price,
      extraCost: ingredient.extraCost,
      category: ingredient.category,
      isAvailable: ingredient.isAvailable
    });
  }

  submitIngredient(): void {
    if (this.ingredientForm.invalid) return;
  
    const ingredientData: Ingredient = {
      id: this.isEditingIngredient && this.selectedIngredient ? this.selectedIngredient.id : 0,
      name: this.ingredientForm.value.name,
      price: this.ingredientForm.value.price,
      extraCost: this.ingredientForm.value.extraCost,
      category: this.ingredientForm.value.category,
      isAvailable: this.ingredientForm.value.isAvailable
    };
  
    const handleError = (error: any, operation: string) => {
      console.error(`Error ${operation} ingredient:`, error);
      
      if (error.status === 403) {
        alert(`Access denied. You need admin privileges to ${operation} ingredients.`);
      } else if (error.status === 401) {
        alert('Please login to perform this action.');
      } else {
        alert(`Error ${operation} ingredient. Please check the console for details.`);
      }
    };
  
    if (this.isEditingIngredient && this.selectedIngredient?.id) {
      this.adminService.updateIngredient(this.selectedIngredient.id, ingredientData).subscribe({
        next: () => {
          this.loadIngredients();
          this.resetIngredientForm();
          alert('Ingredient updated successfully!');
        },
        error: (error) => handleError(error, 'updating')
      });
    } else {
      this.adminService.createIngredient(ingredientData).subscribe({
        next: () => {
          this.loadIngredients();
          this.resetIngredientForm();
          alert('Ingredient created successfully!');
        },
        error: (error) => handleError(error, 'creating')
      });
    }
  }

  deleteIngredient(ingredient: Ingredient): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Ingredient',
        message: `Are you sure you want to delete ${ingredient.name}?`
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && ingredient.id) {
        this.adminService.deleteIngredient(ingredient.id).subscribe({
          next: () => {
            this.loadIngredients();
            alert('Ingredient deleted successfully!');
          },
          error: (error) => {
            console.error('Error deleting ingredient:', error);
            
            if (error.status === 403) {
              alert('Access denied. You need admin privileges to delete ingredients.');
            } else if (error.status === 401) {
              alert('Please login to perform this action.');
            } else {
              alert('Error deleting ingredient. Please check the console for details.');
            }
          }
        });
      }
    });
  }

  resetIngredientForm(): void {
    this.ingredientForm.reset();
    this.isEditingIngredient = false;
    this.selectedIngredient = null;
  }
}