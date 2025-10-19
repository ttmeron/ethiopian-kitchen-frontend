// services/admin-food.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable,throwError } from 'rxjs';
import { environment } from '../enviironments/environment';
import { FoodResponse, Ingredient } from '../shared/models/food-response.model';
import { AuthService } from './auth.service';

import { catchError } from 'rxjs/operators';

export interface FoodRequest {
    name: string;
    description: string;
    price: number;
    category: string;
    imagePath?: string;
    ingredients: { id: number; extraCost: number }[];
  }
  

@Injectable({
  providedIn: 'root'
})
export class AdminFoodService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
    
  ) {}

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401 || error.status === 403) {
      // Unauthorized or Forbidden - user is not admin
      return throwError(() => new Error('You do not have permission to perform this action'));
    }
    
    if (error.status === 404) {
      return throwError(() => new Error('Resource not found'));
    }
    
    return throwError(() => new Error('An error occurred. Please try again.'));
  }

  // Food Management with Multipart FormData
  createFood(foodData: FoodRequest, imageFile?: File): Observable<FoodResponse> {
    
    if (!this.authService.isAdmin()) {
      return throwError(() => new Error('Admin access required'));
    }
    
    const formData = new FormData();
    
    // Add the food request as JSON string
    formData.append('foodRequest', JSON.stringify(foodData));
    
    // Add image file if provided
    if (imageFile) {
      formData.append('imageFile', imageFile, imageFile.name);
    }

    return this.http.post<FoodResponse>(`${this.apiUrl}/foods/admin/`, formData)
    .pipe(catchError(this.handleError));
  }

  updateFood(id: number, foodData: FoodRequest, imageFile?: File): Observable<FoodResponse> {

    if (!this.authService.isAdmin()) {
      return throwError(() => new Error('Admin access required'));
    }

    const formData = new FormData();
    
    // Add the food request as JSON string
    formData.append('foodRequest', JSON.stringify(foodData));
    
    // Add image file if provided
    if (imageFile) {
      formData.append('imageFile', imageFile, imageFile.name);
    }

    return this.http.put<FoodResponse>(`${this.apiUrl}/foods/admin/${id}`, formData)
    .pipe(catchError(this.handleError));
  }

  // Other methods remain the same
  getFoods(): Observable<FoodResponse[]> {
    return this.http.get<FoodResponse[]>(`${this.apiUrl}/foods`);
  }

  getFood(id: number): Observable<FoodResponse> {
    return this.http.get<FoodResponse>(`${this.apiUrl}/foods/${id}`);
  }

  deleteFood(id: number): Observable<void> {
    if (!this.authService.isAdmin()) {
      return throwError(() => new Error('Admin access required'));
    }
    return this.http.delete<void>(`${this.apiUrl}/foods/admin/${id}`)
    .pipe(catchError(this.handleError));
  }

  getIngredients(): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(`${this.apiUrl}/ingredients`);
    
  }

  createIngredient(ingredient: Ingredient): Observable<Ingredient> {
   
    if (!this.authService.isAdmin()) {
      return throwError(() => new Error('Admin access required'));
    }
    return this.http.post<Ingredient>(`${this.apiUrl}/ingredients/admin`, ingredient)
    .pipe(catchError(this.handleError));
    
  }

  updateIngredient(id: number, ingredient: Ingredient): Observable<Ingredient> {
    if (!this.authService.isAdmin()) {
      return throwError(() => new Error('Admin access required'));
    }
    return this.http.put<Ingredient>(`${this.apiUrl}/ingredients/admin/${id}`, ingredient)
     .pipe(catchError(this.handleError));
  
  }

  deleteIngredient(id: number): Observable<void> {

     if (!this.authService.isAdmin()) {
      return throwError(() => new Error('Admin access required'));
    }
    return this.http.delete<void>(`${this.apiUrl}/ingredients/admin/${id}`)
     .pipe(catchError(this.handleError));
  
  }

}