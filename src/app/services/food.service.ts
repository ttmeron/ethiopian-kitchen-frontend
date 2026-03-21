import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { FoodResponse } from '../shared/models/food-response.model';

import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = `${environment.apiUrl}/foods`;

  constructor(private http: HttpClient) { }

  getAllFoods(): Observable<FoodResponse[]> {
    const url = this.apiUrl;
  console.log('🔍 FoodService making request to:', url);
  
    return this.http.get<FoodResponse[]>(url).pipe(
      tap(response => console.log('API Response:', response)), 
      catchError(error => {
         console.error('❌ FoodService error:', error);
        return of([]); 
      })
    );
  }

  getFoodById(id: number): Observable<FoodResponse> {
    return this.http.get<FoodResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('API Error:', error);
        throw error; 
      })
    );
  }

  getFoodsByCategory(category: string): Observable<FoodResponse[]> {
   return this.http.get<FoodResponse[]>(`${this.apiUrl}/category/${category}`).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return of([]);
      })
    );
  }
}
