import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { CartComponent } from './components/cart/cart.component';
import { FoodItemComponent } from './components/food-item/food-item.component';
import { FoodListComponent } from './components/food-list/food-list.component';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { PaymentComponent } from './components/payment/payment.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { AdminFoodManagementComponent } from './components/admin-food-management/admin-food-management.component';

@NgModule({
  declarations: [
    AppComponent,
    FoodListComponent,
    FoodItemComponent,
    CartComponent,
    PaymentComponent,
    MatIconModule,
    MatRadioModule,
    MatDialogModule,
    MatButtonModule,
    HeaderComponent,
    MatInputModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    AdminFoodManagementComponent  ],
  imports: [
    BrowserModule,
    MatDialogModule,
    RouterModule.forRoot(routes)
  ],
  providers: [provideHttpClient(withInterceptorsFromDi()),
  provideAnimations(),
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi:true
  }
],
  bootstrap: [AppComponent]
})
export class AppModule { }