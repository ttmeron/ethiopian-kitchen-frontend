import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, catchError, tap, throwError } from "rxjs";
import { environment } from "../enviironments/environment";
import { GuestUser } from "../shared/models/auth-types";


@Injectable({
    providedIn: 'root'
})

export class GuestAuthService{

    private guestApi = `${environment.authApi}/guest`;

    private _currentGuestValue: GuestUser | null = null;

    private readonly GUEST_KEY = 'current_guest';
    private guestUserSubject = new BehaviorSubject<GuestUser | null>(null);
    public guestUser$ = this.guestUserSubject.asObservable();

    constructor(
        private http: HttpClient,
        private router: Router
    ){
        this.initializeGuestSession();
    }


    private initializeGuestSession():void{
        const savedGuest = localStorage.getItem(this.GUEST_KEY);
        if(savedGuest){
            const guestUser: GuestUser = JSON.parse(savedGuest);
       

        if(new Date(guestUser.expiresAt) > new Date()){
            this.guestUserSubject.next(guestUser);
        }else{
            this.clearGuestSession();
        }
    }
    }

    // createGuestAccount(): Observable<GuestUser> {
    //     return this.http.post<GuestUser>('/api/user/guest', {}).pipe(
    //       tap((response) => {
    //         this._currentGuestValue = {
    //           ...response,
    //           isGuest: true,
    //           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiration
    //         };
    //       }),
    //       catchError((error) => {
    //         console.error('Guest creation failed:', error);
    //         return throwError(() => new Error('Failed to create guest account'));
    //       })
    //     );
    //   }

      createGuestAccount(): Observable<GuestUser> {
        // Add proper headers and empty body (or required structure)
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });
      
        return this.http.post<GuestUser>(
          '/api/user/guest', 
          null, // or {} if your backend expects an object
          { headers }
        ).pipe(
          tap((response) => {
            this._currentGuestValue = {
              ...response,
              isGuest: true,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiration
            };
            console.log('Guest created:', response); // Debug log
          }),
          catchError((error) => {
            console.error('Guest creation failed:', error);
            return throwError(() => new Error('Failed to create guest account'));
          })
        );
      }
    
      createGuestSession(name: string, email: string): Observable<GuestUser> {
        return this.http.post<GuestUser>(`${this.guestApi}/session`, { name, email }).pipe(
            tap(guest => this.storeGuestSession({
                ...guest,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            })),
            catchError(error => {
                console.error('Guest session creation failed:', error);
                return throwError(() => new Error('Failed to create guest session'));
            })
        );
    }

      private storeGuestSession(guestUser: GuestUser): void {
        localStorage.setItem(this.GUEST_KEY, JSON.stringify(guestUser));
        sessionStorage.setItem('guestToken', guestUser.token || '');
        sessionStorage.setItem('guestEmail', guestUser.email || '');
        this.guestUserSubject.next(guestUser);
    }

      clearGuestSession(): void{
        localStorage.removeItem(this.GUEST_KEY);
        sessionStorage.removeItem('guestToken'); 
        sessionStorage.removeItem('guestEmail');
        this.guestUserSubject.next(null);
        this.router.navigate(['/']);
      }

      get currentGuestValue(): GuestUser | null {
        return this.guestUserSubject.value;
      }

      isGuestAuthenticated(): boolean{
        const guest = this.currentGuestValue;
        return !!guest && new Date(guest.expiresAt) > new Date();
      }

      refreshGuestSession(): Observable<GuestUser>{
        if(!this.isGuestAuthenticated()){
            return throwError(()=> new Error('No valid guest session'));
        }
        return this.http.post<GuestUser>('/api/user/guest/refresh', {
            token: this.currentGuestValue?.token
        }).pipe(
            tap((response) => {
                const guestUser: GuestUser ={
                    ...response,
                    isGuest: true,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                };
                this.storeGuestSession(guestUser);
            })
        );
      }

      convertToRegularAccount(registrationData: any): Observable<any> {
        if (!this.isGuestAuthenticated()) {
          return throwError(() => new Error('No valid guest session'));
        }
    
        return this.http.post('/api/user/guest/convert', {
          ...registrationData,
          guestToken: this.currentGuestValue?.token
        }).pipe(
          tap(() => {
            this.clearGuestSession();
          })
        );
      }
    }




















































