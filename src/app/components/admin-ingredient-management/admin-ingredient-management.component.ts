import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Ingredient } from '../../shared/models/food-response.model';
import { AdminFoodService } from '../../services/admin-food.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-admin-ingredient-management',
  standalone: true,
  imports: [

    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-ingredient-management.component.html',
  styleUrl: './admin-ingredient-management.component.scss'
})
export class AdminIngredientManagementComponent implements OnInit{

  ingredients: Ingredient[] = [];
  displayedColumns: string[] = ['name', 'extraCost', 'actions']
  ingredientForm!: FormGroup;


  isEditing = false;
  selectedIngredient: Ingredient | null = null;
  isLoading = false;

  constructor(
    private adminService: AdminFoodService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ){}
  
  ngOnInit(): void {
      this.initForm();
      this.loadIngredients();
  }

  initForm(): void{
    this.ingredientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      extraCost: [0, [Validators.required, Validators.min(0)]]
    });

  }

  loadIngredients(): void{
    this.isLoading = true;
    this.adminService.getIngredients().subscribe({
      next: (ingredients) => {
        this.ingredients = ingredients;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ingredients:', error);
        this.snackBar.open('Failed to load ingredients', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  addIngredient(): void {
    this.isEditing = false;
    this.selectedIngredient = null;
    this.ingredientForm.reset({
      name: '',
      extraCost: 0
    });
    this.ingredientForm.markAsUntouched();
  }

  editIngredient(ingredient: Ingredient): void {
    this.isEditing = true;
    this.selectedIngredient = ingredient;
    
    this.ingredientForm.patchValue({
      name: ingredient.name,
      extraCost: ingredient.extraCost
    });
  }

  submitIngredient(): void {
    if (this.ingredientForm.invalid) {
      this.markFormGroupTouched(this.ingredientForm);
      this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
      return;
    }

    const ingredientData: Ingredient = {
      id: this.isEditing && this.selectedIngredient ? this.selectedIngredient.id : 0,
      name: this.ingredientForm.value.name.trim(),
      extraCost: this.ingredientForm.value.extraCost,
      category: this.selectedIngredient?.category || '',
      isAvailable: this.selectedIngredient?.isAvailable ?? true,
      price: this.selectedIngredient?.price || 0
    };

    const operation = this.isEditing ? 'update' : 'create';
    
    if (this.isEditing && this.selectedIngredient?.id) {
      this.adminService.updateIngredient(this.selectedIngredient.id, ingredientData).subscribe({
        next: () => {
          this.snackBar.open('Ingredient updated successfully!', 'Close', { duration: 3000 });
          this.loadIngredients();
          this.addIngredient();
        },
        error: (error) => {
          console.error('Error updating ingredient:', error);
          this.handleError(error, operation);
        }
      });
    } else {
      this.adminService.createIngredient(ingredientData).subscribe({
        next: () => {
          this.snackBar.open('Ingredient created successfully!', 'Close', { duration: 3000 });
          this.loadIngredients();
          this.addIngredient(); 
        },
        error: (error) => {
          console.error('Error creating ingredient:', error);
          this.handleError(error, operation);
        }
      });
    }
  }

  deleteIngredient(ingredient: Ingredient): void {
    if (!ingredient.id) {
      this.snackBar.open('Cannot delete ingredient without ID', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Ingredient',
        message: `Are you sure you want to delete "${ingredient.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && ingredient.id) {
        this.adminService.deleteIngredient(ingredient.id).subscribe({
          next: () => {
            this.snackBar.open('Ingredient deleted successfully!', 'Close', { duration: 3000 });
            this.loadIngredients();
          },
          error: (error) => {
            console.error('Error deleting ingredient:', error);
            this.handleError(error, 'delete');
          }
        });
      }
    });
  }

  private handleError(error: any, operation: string): void {
    let errorMessage = `Failed to ${operation} ingredient.`;
    
    if (error.status === 403) {
      errorMessage = 'Access denied. Admin privileges required.';
    } else if (error.status === 401) {
      errorMessage = 'Please login to perform this action.';
    } else if (error.status === 400) {
      errorMessage = 'Invalid data. Please check your input.';
    } else if (error.status === 404) {
      errorMessage = 'Ingredient not found.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.ingredientForm.get(controlName);
    
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    
    if (control?.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength']?.requiredLength} characters`;
    }
    
    if (control?.hasError('min')) {
      return `Value must be at least ${control.errors?.['min']?.min}`;
    }
    
    return '';
  }
}
