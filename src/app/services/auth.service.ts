import { Injectable } from '@angular/core';
import { environment } from '../enviironments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoginRequest } from '../shared/models/login-request.model';
import { AuthResponse } from '../shared/models/auth-response.model';
import { BehaviorSubject, Observable , throwError} from 'rxjs';
import { tap,catchError } from 'rxjs/operators';
import { GuestAuthService } from './guest-auth.service';
import { AuthUser, GuestUser, RegularUser } from '../shared/models/auth-types';
import { BaseUser, UserRole } from '../shared/user-roles.model';
import { JwtHelperService } from './jwt-helper.service';
@Injectable({
  providedIn: 'root',
})


export class AuthService {

  private baseUrl = environment.authApi; 

  private authState: BehaviorSubject<boolean>; 
  private currentUserSubject: BehaviorSubject<AuthUser>;

  constructor(
    private http: HttpClient,
    private guestAuth: GuestAuthService,
    private jwtHelper: JwtHelperService) {
      
    this.authState = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<AuthUser>(null);

      this.initializeAuthState();
    }
  
    private initializeAuthState(): void {
      this.authState.next(this.isAuthenticated());
      this.currentUserSubject.next(this.getCurrentUser());
    }


    isLoggedIn(): boolean {
      return this.isUserLoggedIn(); 
    }

 // auth.service.ts
 getUser(): { userName: string, email: string } | null {
    const user = this.getCurrentUser();
    
    if (!user) return null;

    return {
      userName: user.userName,
      email: user.email || ''
    };
  }
    isAuthenticated(): boolean{
      return this.isUserLoggedIn() || this.guestAuth.isGuestAuthenticated();
    }

    isUserLoggedIn():boolean{
      return !!this.getToken();
    }

    isRegularUser(user: AuthUser): user is RegularUser {
      return user !== null && user.isGuest === false;
    }
    
    isGuestUser(user: AuthUser): user is GuestUser {
      return user !== null && user.isGuest === true;
    }

    getUserRole(): UserRole {
      const user = this.getCurrentUser();
        if (!user) return UserRole.GUEST;

          if ('role' in user) {
                return user.role;
              }
        
       return UserRole.USER;
    }

    isAdmin(): boolean {
      const userRole = this.getUserRole();
      console.log('🔍 isAdmin() check - userRole:', userRole, 'UserRole.ADMIN:', UserRole.ADMIN);
      console.log('🔍 Comparison result:', userRole === UserRole.ADMIN);
      
      // Case-insensitive comparison
      return userRole?.toUpperCase() === UserRole.ADMIN.toUpperCase();
    }
    // In your auth.service.ts - update getCurrentUser method
getCurrentUser(): AuthUser {
  const regularUser = this.getRegularUser();
  if (regularUser) {
    // Get role from sessionStorage, or extract from token if not found
    let role = sessionStorage.getItem('userRole') as UserRole;
    
    if (!role) {
      // If no role in sessionStorage, try to extract from token
      const token = this.getToken();
      if (token) {
        role = this.jwtHelper.getRoleFromToken(token) as UserRole;
        if (role) {
          sessionStorage.setItem('userRole', role); // Cache it for future use
        }
      }
    }
    
    return {
      ...regularUser,
      role: role || UserRole.USER
    };
  }

  const guestUser = this.guestAuth.currentGuestValue;
  if (guestUser) {
    return {
      id: guestUser.id,
      userName: guestUser.userName,
      email: guestUser.email,
      token: guestUser.token,
      isGuest: true,
      expiresAt: new Date(guestUser.expiresAt),
      role: UserRole.GUEST
    };
  }
  return null;
}
    private isValidGuestUser(user: any): user is GuestUser{
      return user &&
      user.isGuest === true &&
      typeof user.token === 'string' &&
      user.expiresAt instanceof Date;

    }

    getRegularUser(): RegularUser | null{
      
        const token = this.getToken();
        if(!token) return null;

        const userName = sessionStorage.getItem('userName');
        const email = sessionStorage.getItem('email');
        const role = sessionStorage.getItem('userRole') as UserRole;

        return userName && email ? {
          userName,
          email,
          role: role || UserRole.USER,
          isGuest: false,
          profileCompleted: false
        } : null;
      }
  
  login(credentials: LoginRequest): Observable<AuthResponse> {
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    
    }
    console.log('Sending login request:', credentials);

    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((response) => {

         console.log('🔍 FULL LOGIN RESPONSE FROM BACKEND:', response);
          const roleFromToken = this.jwtHelper.getRoleFromToken(response.token);
          console.log('🔍 Role extracted from JWT token:', roleFromToken)
         
      
        this.saveToken(response.token);
        //  const role = (response as any).role || UserRole.USER;
        this.saveUser(response.userName, response.email, roleFromToken || undefined);
        this.authState.next(true);
        this.currentUserSubject.next(this.getCurrentUser());

        if (this.guestAuth.isGuestAuthenticated()) {
          this.guestAuth.clearGuestSession();
        }
      }),

      catchError(this.handleLoginError)
        
    );
  }

  loginAsGuest(): Observable<any>{
    return this.guestAuth.createGuestAccount().pipe(
      tap(() => {
        this.authState.next(true);
        this.currentUserSubject.next(this.getCurrentUser());
      })
    );
  }


  logout(): void {

    sessionStorage.clear();
    this.guestAuth.clearGuestSession();

    this.authState.next(false);
    this.currentUserSubject.next(null);

    localStorage.removeItem('guestEmail');
    localStorage.removeItem('guestUserName');
    localStorage.removeItem('token');
  }


  register(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
  }


  saveToken(token: string) {
    sessionStorage.setItem('authToken', token);
  }
  getToken(): string | null {
    return sessionStorage.getItem('authToken');
  }

      
  saveUser(userName: string, email: string, role?: string) {
  sessionStorage.setItem('userName', userName);
  sessionStorage.setItem('email', email);
  
  // If no role provided, try to determine it
   if (role) {
      sessionStorage.setItem('userRole', role);
      console.log('💾 Saved to sessionStorage - role:', role);
    } else {
      // If no role provided, remove any existing role to avoid conflicts
      sessionStorage.removeItem('userRole');
      console.log('💾 No role provided, cleared userRole from sessionStorage');
    }
  }
  getAuthState(): Observable<boolean> {
    return this.authState.asObservable();
  }

  getUserState(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }


  private handleLoginError(error: HttpErrorResponse): Observable<never> {
    console.error('Login error details:', error);
    
    const rawMessage = error.error?.message || error.message || '';
    
    // Extract text between quotes or after the status code
    let cleanMessage = '';
    
    if (typeof rawMessage === 'string') {
      // Method 1: Extract text between quotes
      const quotedText = rawMessage.match(/"([^"]*)"/);
      if (quotedText && quotedText[1]) {
        cleanMessage = quotedText[1];
      } else {
        // Method 2: Split by space and take parts after status code
        const parts = rawMessage.split(/\s+/);
        if (parts.length > 2) {
          cleanMessage = parts.slice(2).join(' ').replace(/^"|"$/g, '');
        }
      }
    }
    
    // Use status-based fallbacks
    if (!cleanMessage) {
      if (error.status === 404) {
        cleanMessage = 'No account found with this email address.';
      } else if (error.status === 401) {
        cleanMessage = 'Wrong password. Please try again.';
      } else {
        cleanMessage = 'Login failed. Please try again.';
      }
    }
    
    return throwError(() => new Error(cleanMessage));
  }

  
}