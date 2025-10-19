import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { OrderResponse } from '../../shared/models/order.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GuestPromptDialogComponent } from '../guest-prompt-dialog/guest-prompt-dialog.component';

type GuestLoginResult = 
      | { userName: string; email: string } 
      | { action: 'login_success' | 'register' }
      | null;

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule,FormsModule,MatDialogModule],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss'
})
export class MyOrdersComponent implements OnInit{

  myOrders: OrderResponse[] = [];
  guestEmail: string = '';
  trackingToken: string = '';
  trackedOrder?: OrderResponse;
  showDebug: boolean = false;
  
  constructor(
    private orderService: OrderService,
    public authService: AuthService,
    private dialog: MatDialog){}
  
  ngOnInit() {
    this.loadMyOrders();

    setTimeout(() => {
      if (this.myOrders.length > 0 && this.myOrders[0].orderItems.length > 0) {
        console.log('First order item structure:', this.myOrders[0].orderItems[0]);
        console.log('Has addOns property?', 'addOns' in this.myOrders[0].orderItems[0]);
      }
    }, 1000);
  }
  
  trackOrder(): void {
    if (!this.trackingToken) return;
  
    this.orderService.trackOrder(this.trackingToken).subscribe({
      next: (order) => {
        this.trackedOrder = order;
      },
      error: () => {
        this.trackedOrder = undefined;
        alert('Order not found or tracking token expired.');
      }
    });
  }
  openGuestLoginDialog(): void {

    const dialogRef = this.dialog.open(GuestPromptDialogComponent);

    
dialogRef.afterClosed().subscribe((result: GuestLoginResult) => {
  if (!result) return;

  if ('email' in result && 'userName' in result) {
    sessionStorage.setItem('guestEmail', result.email);
    sessionStorage.setItem('guestUserName', result.userName);
    this.guestEmail = result.email;
    this.loadMyOrders(result.email);
    console.log("current user credaital ", result.email,result.userName);
  }

  if ('action' in result) {
    if (result.action === 'login_success') {
      this.loadOrdersForCurrentUser();
    } else if (result.action === 'register') {
      // handle register action
    }
  }
});
}

  
  loadOrdersForCurrentUser() {
    this.orderService.getCurrentUserOrders().subscribe({
      next: (orders) => {
        this.myOrders = orders;
      },
      error: (err) => {
        console.error('Failed to fetch orders', err);
      }
    });
  }


  loadMyOrders(email?: string): void {
    if (!email) {
      const currentUser = this.authService.getCurrentUser();
      
      if (currentUser) {
        // Type-safe property access
        email = currentUser.email || '';
        
        // Optional: Special handling for guest users
        if (this.authService.isGuestUser(currentUser)) {
          console.log('Loading orders for guest user:', currentUser.email);
          
        }
      } else {
        // Fallback for legacy/unauthenticated access
        email = sessionStorage.getItem('guestEmail') || '';
      }
    }
  
    if (!email) {
      console.warn('No email provided or found for orders');
      return;
    }

    this.orderService.getOrdersByEmail(email).subscribe({
      next: (orders) => {
        console.log('=== DEBUG: Full API Response ===');
        console.log('Raw orders response:', orders);
        
        this.myOrders = orders;
        
        if (this.myOrders.length > 0) {
          const firstOrder = this.myOrders[0];
          console.log('=== First Order Analysis ===');
          console.log('Full order object:', JSON.stringify(firstOrder, null, 2));
          
          // Check if placedTime exists and its value
          console.log('placedTime exists?', 'placedTime' in firstOrder);
          console.log('placedTime value:', firstOrder.placedTime);
          console.log('placedTime truthy?', !!firstOrder.placedTime);
          
          // Check OrderTiming properties
          console.log('OrderTiming properties:');
          console.log('- placedTime:', firstOrder.placedTime);
          console.log('- estimatedReadyTime:', firstOrder.estimatedReadyTime);
          console.log('- remainingTime:', firstOrder.remainingTime);
          console.log('- timerStatus:', firstOrder.timerStatus);
        }
      },
      error: (err) => console.error('Failed to load user orders:', err)
    });
  }

 
  

}