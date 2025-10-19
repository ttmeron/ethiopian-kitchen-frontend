import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    
    provideZoneChangeDetection({
         eventCoalescing: true,
         runCoalescing: true
    
    }), 
    provideRouter(routes),
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    provideAnimations(),
    provideClientHydration(),
    provideNativeDateAdapter(),
    {
      provide:HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi:true
    }
  ]
}

