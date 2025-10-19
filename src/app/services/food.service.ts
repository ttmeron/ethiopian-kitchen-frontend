import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FoodResponse } from '../shared/models/food-response.model';

import { catchError, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FoodService {
  private apiUrl = '/api/foods'; // Update with your Spring Boot endpoint

  constructor(private http: HttpClient) { }

  getAllFoods(): Observable<FoodResponse[]> {
    return this.http.get<FoodResponse[]>(this.apiUrl).pipe(
      tap(response => console.log('API Response:', response)), // Debug logging
      catchError(error => {
        console.error('API Error:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  getFoodById(id: number): Observable<FoodResponse> {
    return this.http.get<FoodResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('API Error:', error);
        throw error; // Re-throw for component to handle
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
