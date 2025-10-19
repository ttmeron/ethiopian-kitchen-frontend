import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviironments/environment';

@Injectable({
  providedIn: 'root'
})

export class UserService {
    private apiUrl = `${environment.apiUrl}/user`;

    constructor(private http: HttpClient){}

    register(user: any): Observable<any>{
        return this.http.post(`${this.apiUrl}/register`,user);
    }
    checkEmailExists(email: string): Observable<{ exists: boolean }> {
        return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-email?email=${email}`);
      }

    
}
