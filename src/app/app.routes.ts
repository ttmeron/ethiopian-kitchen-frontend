import { Routes } from '@angular/router';
import { FoodListComponent } from './components/food-list/food-list.component';
import { CartComponent } from './components/cart/cart.component';
import { MyOrdersComponent } from './components/my-orders/my-orders.component';
import { LoginPageComponent } from './components/login-page/login-page.component';
import { RegisterPageComponent } from './components/register-page/register-page.component';
import { OrderDisplayComponent } from './components/order-display/order-display.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { AdminFoodManagementComponent } from './components/admin-food-management/admin-food-management.component';
import { AdminGuard } from './guards/admin.guard';
export const routes: Routes = [
    { path: '', redirectTo: 'foods', pathMatch: 'full' },
    { path: 'foods', component: FoodListComponent },
    { path: 'cart', component: CartComponent },
    { path: 'orders', component: OrderDisplayComponent },
    { path: 'my-orders', component: MyOrdersComponent },
    { path: 'login', component: LoginPageComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'admin/food-management', component: AdminFoodManagementComponent, 
        canActivate: [AdminGuard]
     },
    { path: 'register', component: RegisterPageComponent },
    { path: '**', redirectTo: 'foods' }
];
