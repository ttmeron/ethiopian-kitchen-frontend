import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError} from "rxjs";
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface SoftDrink {
  id: number;
  name: string;
  description: string;
  price: number;
  imagePath: string;
  Size: string;
  iceOption: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SoftDrinkService {

  private apiUrl = 'http://localhost:8080/api/soft-drinks';
  private adminUrl = 'http://localhost:8080/api/soft-drinks/admin';
  
  constructor(private http: HttpClient) {}
  
getAllSoftDrinks(): Observable<SoftDrink[]> {
  console.log('🔍 [SoftDrinkService] Making request to:', this.apiUrl);
  
  return this.http.get<any>(this.apiUrl, {
    observe: 'response'
  }).pipe(
    tap(response => {
      console.log('🔍 [SoftDrinkService] Full HTTP Response:', response);
      console.log('🔍 [SoftDrinkService] Status:', response.status);
      console.log('🔍 [SoftDrinkService] Raw body:', response.body);
      console.log('🔍 [SoftDrinkService] Is array?', Array.isArray(response.body));
      
      if (Array.isArray(response.body)) {
        console.log(`✅ Response is direct array with ${response.body.length} items`);
        if (response.body.length > 0) {
          console.log('📝 First drink in array:', response.body[0]);
        }
      }
    }),
    
    map(response => {
      let body = response.body;
      console.log('🔍 [SoftDrinkService] Response body:', body);
      
      if (Array.isArray(body)) {
        console.log('✅ Direct array response - returning as is');
        return body as SoftDrink[];
      }
      
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse JSON string:', e);
          return [];
        }
      }
      
      if (Array.isArray(body)) {
        console.log('✅ Parsed to array');
        return body as SoftDrink[];
      }
      
      if (body && typeof body === 'object') {
        console.log('🔍 Checking object properties:', Object.keys(body));
        
        if ('data' in body && Array.isArray(body.data)) {
          console.log('✅ Found data array');
          return body.data as SoftDrink[];
        }
        
        if ('content' in body && Array.isArray(body.content)) {
          console.log('✅ Found content array');
          return body.content as SoftDrink[];
        }
        
        if ('softDrinks' in body && Array.isArray(body.softDrinks)) {
          console.log('✅ Found softDrinks array');
          return body.softDrinks as SoftDrink[];
        }
        
        if ('drinks' in body && Array.isArray(body.drinks)) {
          console.log('✅ Found drinks array');
          return body.drinks as SoftDrink[];
        }
        
        console.warn('⚠️ Object but no array property found');
      }
      
      console.warn('⚠️ Unexpected response format');
      return [];
    }),
    
    tap(drinks => {
      console.log('🔍 [SoftDrinkService] Returning drinks:', drinks);
      console.log(`✅ Number of drinks: ${drinks.length}`);
      
      if (Array.isArray(drinks) && drinks.length > 0) {
        console.log('📝 First drink details:', {
          name: drinks[0].name,
          imagePath: drinks[0]?.imagePath,
          price: drinks[0]?.price,
          allProps: Object.keys(drinks[0])
        });
        
        drinks.forEach((drink, index) => {
          console.log(`🥤 Drink ${index + 1}: ${drink.name}`);
          console.log(`   imagePath: "${drink.imagePath}"`);
          console.log(`   Has imagePath?`, !!drink.imagePath);
        });
      }
    }),
    
    catchError((error: HttpErrorResponse) => {
      console.error('❌ [SoftDrinkService] Error:', error);
      return of([]);
    })
  );
}
  getSoftDrinkById(id: number): Observable<SoftDrink> {
    return this.http.get<ApiResponse<SoftDrink>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message;
    }
    return throwError(() => new Error(errorMessage));
  }


createDrink(formData: FormData): Observable<any> {
  return this.http.post(this.adminUrl, formData);
}

updateDrink(id: number, formData: FormData): Observable<any> {
  return this.http.put(`${this.adminUrl}/${id}`, formData);
}

deleteDrink(id: number) {
  return this.http.delete(`${this.adminUrl}/${id}`);
}
}