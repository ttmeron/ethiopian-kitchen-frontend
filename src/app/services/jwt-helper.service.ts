import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtHelperService {
  
  decodeToken(token: string): any {
    try {
      // JWT token has 3 parts: header.payload.signature
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  getRoleFromToken(token: string): string | null {
    const decodedToken = this.decodeToken(token);
    return decodedToken?.role || null;
  }

  getExpirationFromToken(token: string): Date | null {
    const decodedToken = this.decodeToken(token);
    return decodedToken?.exp ? new Date(decodedToken.exp * 1000) : null;
  }
}