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
import { environment } from '../../../environments/environment';
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


  private baseUrl = environment.apiUrl;
  defaultImage = 'assets/default-food.png';
  foodForm!: FormGroup;



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
    this.ingredientForm = this.fb.group({
    ingredients: this.fb.array([
      this.createIngredientGroup()
    ])
  });
  }

  ngOnInit(): void {

     this.foodForm = this.createFoodForm();
    this.loadFoods();
    this.loadIngredients();

    setTimeout(() => {
      const overlayContainer = document.querySelector('.cdk-overlay-container') as HTMLElement;
      if (overlayContainer) {
        overlayContainer.style.zIndex = '99999';
      }
    }, 0);
  }

  onIngredientDropdownChange(selectedId: number, index: number): void {
  const ingredient = this.ingredients.find(ing => ing.id === selectedId);
  if (!ingredient) return;

  // Update form array
  const ingForm = this.ingredientsArray.at(index) as FormGroup;
  ingForm.patchValue({
    name: ingredient.id,
    extraCost: ingredient.extraCost ?? 0
  });

  // Update selectedIngredients array
  if (!this.selectedIngredients.some(ing => ing.id === ingredient.id)) {
    this.selectedIngredients.push({ ...ingredient });
  }
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

  createIngredientGroup(): FormGroup {
  return this.fb.group({
    id: ['', Validators.required], 
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    extraCost: [0, [Validators.min(0)]],
    category: [''],
    isAvailable: [true]
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

  addIngredientField(): void {
  this.ingredientsArray.push(this.createIngredientGroup());
}
  removeIngredientField(index: number): void {
  this.ingredientsArray.removeAt(index);
}

  addIngredientToFood(id: number,name: string = '', extraCost: number = 0): void {
  this.ingredientsArray.push(this.fb.group({
    id: [id, Validators.required],  
    name: [name, Validators.required],
    extraCost: [extraCost, [Validators.required, Validators.min(0)]]
  }));
}
  removeIngredientFromFood(index: number) {
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

    return `${this.baseUrl}/images/${food.imagePath}`;
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
    this.selectedIngredients = []; 
  }

  editFood(food: FoodResponse): void {
    this.isEditingFood = true;
    this.selectedFood = food;
    
    this.ingredientsArray.clear();
    this.selectedIngredients = [];
    
    // Add ingredients from the food to both form array and selected ingredients
    if (food.ingredients) {
      food.ingredients.forEach(ing => {
        this.addIngredientToFood(ing.id,ing.name, ing.extraCost);
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

   resetForm(): void {
    this.foodForm.reset();
    this.ingredientsArray.clear();
    this.isEditingFood = false;
    this.selectedFood = null;
    this.imagePreview = null;
  }

  submitFood(): void {

      console.log('=== FORM VALIDATION DEBUG ===');
      console.log('Form Valid:', this.foodForm.valid);
      console.log('Form Invalid:', this.foodForm.invalid);
      console.log('Form Values:', this.foodForm.value);
      console.log('Form Errors:', this.foodForm.errors);

      Object.keys(this.foodForm.controls).forEach(key => {
        const control = this.foodForm.get(key);
        if (control) {
          console.log(`Control "${key}":`);
          console.log('  Value:', control.value);
          console.log('  Valid:', control.valid);
          console.log('  Invalid:', control.invalid);
          console.log('  Errors:', control.errors);
          console.log('  Touched:', control.touched);
          console.log('  Dirty:', control.dirty);
        }
      });

      const ingredientsArray = this.ingredientsArray;
        console.log('Ingredients Array length:', ingredientsArray.length);
        console.log('Ingredients Array valid:', ingredientsArray.valid);
  
    if (this.foodForm.invalid) {
    console.log('❌ Form is invalid. Showing validation errors:');
    
    this.showValidationErrors();
    
    this.foodForm.markAllAsTouched();
    return;

    
  }

  console.log('✅ Form is valid, proceeding...');
  
    if (this.foodForm.invalid) {

      console.log('Form is invalid');
      this.foodForm.markAllAsTouched();
      return;
    }

    console.log('🚀 Starting food update...');

      const ingredients = this.selectedIngredients.map(ing => ({
          id: ing.id,
          extraCost: ing.extraCost || 0
        }));

        console.log('🧪 Selected ingredients:', ingredients);
  
    const foodData: FoodRequest = {
      name: this.foodForm.value.name,
      description: this.foodForm.value.description,
      price: this.foodForm.value.price,
      category: this.foodForm.value.category,
      imagePath: this.foodForm.value.imagePath,
      ingredients: ingredients
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
    console.log('✏️ Updating existing food ID:', this.selectedFood.id);
    
      this.adminService.updateFood(this.selectedFood.id, foodData, this.selectedFile || undefined)
      .subscribe({
        next: (response) => {
          console.log('✅ Food updated successfully:', response);
          this.loadFoods();
          this.resetFoodForm();
          alert('Food updated successfully!');
        },
        error: (error) => {
          console.error('❌ Update failed:', error);
          
          // Detailed error info
          if (error.status) {
            console.log('Status:', error.status);
          }
          if (error.error) {
            console.log('Error response:', error.error);
          }
          if (error.message) {
            console.log('Message:', error.message);
          }
          
          if (error.status === 403) {
            alert('Access denied. You need admin privileges.');
          } else if (error.status === 400) {
            alert('Invalid data format: ' + (error.error?.message || 'Check your input'));
          } else if (error.status === 500) {
            alert('Server error: ' + (error.error?.message || 'Internal server error'));
          } else {
            alert('Error: ' + error.message);
          }
        }
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

  

  deleteFood(foodId: number): void {
  const food = this.foods.find(f => f.id === foodId);
  if (!food) return;

  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
      title: 'Delete Food',
      message: `Are you sure you want to delete ${food.name}?`
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.adminService.deleteFood(foodId).subscribe({
        next: () => {
          this.loadFoods();
          alert('Food deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting food:', error);
        }
      });
    }
  });
}

private showValidationErrors(): void {
  const errors: string[] = [];
  
  // Check each field
  const nameCtrl = this.foodForm.get('name');
  if (nameCtrl?.hasError('required')) {
    errors.push('• Food Name is required');
  }
  if (nameCtrl?.hasError('minlength')) {
    errors.push(`• Food Name must be at least ${nameCtrl.errors?.['minlength']?.requiredLength} characters`);
  }
  
  const descCtrl = this.foodForm.get('description');
  if (descCtrl?.hasError('required')) {
    errors.push('• Description is required');
  }
  if (descCtrl?.hasError('minlength')) {
    errors.push(`• Description must be at least ${descCtrl.errors?.['minlength']?.requiredLength} characters`);
  }
  
  const priceCtrl = this.foodForm.get('price');
  if (priceCtrl?.hasError('required')) {
    errors.push('• Price is required');
  }
  if (priceCtrl?.hasError('min')) {
    errors.push(`• Price must be at least ${priceCtrl.errors?.['min']?.min}`);
  }
  
  const categoryCtrl = this.foodForm.get('category');
  if (categoryCtrl?.hasError('required')) {
    errors.push('• Category is required');
  }
  
  // Show errors in alert
  if (errors.length > 0) {
    alert('Please fix the following errors:\n\n' + errors.join('\n'));
  }}


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

  addIngredient(): void {
  const ingredientGroup = this.fb.group({
    name: ['', Validators.required],
    extraCost: [0, [Validators.min(0)]]
  });
  this.ingredientsArray.push(ingredientGroup);
}

  getIngredientPrice(ingredientId: number): number {
    const ingredient = this.ingredients.find(ing => ing.id === ingredientId);
    return ingredient ? ingredient.extraCost : 0;
  }

  removeIngredient(index: number): void {
  this.ingredientsArray.removeAt(index);
}

  removeIngredientById(ingredientId: number) { 
    this.selectedIngredients = this.selectedIngredients.filter(
      ing => ing.id !== ingredientId
    );
  }

  isIngredientSelected(ingredientId: number): boolean { 
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


