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
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EmployeeFormComponent } from './components/employee-form/employee-form.component';
import { AdminDrinkManagementComponent } from './components/admin-drink-management/admin-drink-management.component';
import { AdminIngredientManagementComponent } from './components/admin-ingredient-management/admin-ingredient-management.component';
import { AboutContactComponent } from './components/about-contact/about-contact.component';
export const routes: Routes = [
    { path: '', redirectTo: 'foods', pathMatch: 'full' },
    { path: 'foods', component: FoodListComponent },
    { path: 'cart', component: CartComponent },
    { path: 'orders', component: OrderDisplayComponent,canActivate: [AdminGuard] },
    { path: 'my-orders', component: MyOrdersComponent },
    { path: 'login', component: LoginPageComponent },
    { path: 'admin/ingredients', 
      component: AdminIngredientManagementComponent,
      canActivate: [AdminGuard]},
    { path: 'reset-password', component: ResetPasswordComponent },
     {path: 'about', component: AboutContactComponent },
    { path: 'admin', 
    children: [
      { 
        path: 'food-management', 
        component: AdminFoodManagementComponent, 
        canActivate: [AdminGuard] 
      },
      { 
        path: 'drinks', 
        component: AdminDrinkManagementComponent, 
        canActivate: [AdminGuard] 
      },
      { 
        path: 'employees', 
        component: EmployeeListComponent,
        canActivate: [AdminGuard]
      },
      { 
        path: 'employees/create', 
        component: EmployeeFormComponent,
        canActivate: [AdminGuard]
      },
      { 
        path: 'employees/edit/:id', 
        component: EmployeeFormComponent,
        canActivate: [AdminGuard]
      },

]},
    { path: 'register', component: RegisterPageComponent },
    { path: '**', redirectTo: 'foods' }
];
