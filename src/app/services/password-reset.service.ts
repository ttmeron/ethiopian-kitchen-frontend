import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../enviironments/environment';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {

  private apiUrl = environment.authApi; 

  constructor(private http: HttpClient) {}

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, resetData);
  }

  validateResetToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/validate-reset-token/${token}`);
  }
}
