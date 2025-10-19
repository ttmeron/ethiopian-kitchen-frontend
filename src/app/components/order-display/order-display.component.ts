import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { OrderStatus, TimerStatus,OrderResponse } from '../../shared/models/order.model';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-order-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-display.component.html',
  styleUrl: './order-display.component.scss'
})
export class OrderDisplayComponent implements OnInit, OnDestroy{
  orders: OrderResponse[] = [];
  private timerSubscription!: Subscription;
  private readonly BASE_PREP_TIME = 10;
  private readonly MAX_CONCURRENT_ORDERS = 3;
  TimerStatus = TimerStatus;
  OrderStatus = OrderStatus;

  constructor(private orderService: OrderService){}

  ngOnInit(): void {
      this.loadProcessingOrders();
      this.setupTimer();
  }

  ngOnDestroy(): void {
      this.timerSubscription?.unsubscribe();
  }

  markAsReady(order: OrderResponse): void {
    this.orderService.markAsReady(order.orderId).subscribe({
      next: () => {
        this.orders = this.orders.filter(o => o.orderId !== order.orderId);
      },
      error: (err) => console.error('Failed to mark as ready:', err)
    });
  }

  loadProcessingOrders(): void {
    this.orderService.getProcessingOrders().subscribe({
      next: (response: unknown) => {
        try {
          const orders = response as OrderResponse[];
          if (!Array.isArray(orders)) {
            throw new Error('Expected array of orders');
          }
  
          this.orders = orders.map(order => this.enrichOrderData(order));
          this.initializeOrderTimers();
        } catch (error) {
          console.error('Order processing failed:', error);
          this.orders = [];
        }
      },
      error: (err) => {
        console.error('API request failed:', err);
        this.orders = [];
      }
    });
  }
  

  loadPaidOrders(): void {
    this.orderService.getPaidOrders().subscribe({
      next: (response: unknown) => {
        try {
          // Type assertion with runtime check
          const orders = response as OrderResponse[];
          if (!Array.isArray(orders)) {
            throw new Error('Expected array of orders');
          }
          
          this.orders = orders.map(order => this.enrichOrderData(order));
          this.initializeOrderTimers();
        } catch (error) {
          console.error('Order processing failed:', error);
          this.orders = []; // Fallback to empty array
        }
      },
      error: (err) => {
        console.error('API request failed:', err);
        this.orders = []; // Clear orders on error
      }
    });
  }

  private enrichOrderData(order: OrderResponse): OrderResponse {
    return {
      ...order,
      placedTime: order.placedTime || new Date().toISOString(),
      status: this.parseOrderStatus(order.status),
      deliveryDTO: order.deliveryDTO || undefined // Explicit undefined
    };
  }
  private parseOrderStatus(status: string): OrderStatus {
    return OrderStatus[status as keyof typeof OrderStatus] || OrderStatus.READY;
  }

  private setupTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateOrderTimers();
    });
  }


  initializeOrderTimers(): void {
    let currentBatchEndTime: Date | null = null;
    let ordersInCurrentBatch = 0;
    
    this.orders.forEach(order => {
      const placedTime = order.placedTime ? new Date(order.placedTime) : new Date();
      
      if (!currentBatchEndTime || ordersInCurrentBatch >= this.MAX_CONCURRENT_ORDERS) {
        currentBatchEndTime = new Date(placedTime.getTime() + this.BASE_PREP_TIME * 60000);
        ordersInCurrentBatch = 1;
      } else {
        ordersInCurrentBatch++;
      }
      
      order.estimatedReadyTime = currentBatchEndTime;
    });
  }

  updateOrderTimers(): void {
    const now = new Date();
    
    this.orders.forEach(order => {
      if (!order.estimatedReadyTime) return;
      
      const timeDiff = (order.estimatedReadyTime.getTime() - now.getTime()) / 1000;
      order.remainingTime = Math.max(0, Math.floor(timeDiff / 60));
      
      if (timeDiff <= 0) {
        order.timerStatus = TimerStatus.READY;
      } else if (timeDiff <= 180) {
        order.timerStatus = TimerStatus.WARNING;
      } else {
        order.timerStatus = TimerStatus.NORMAL;
      }
    });
  }


  getTimerColor(order: OrderResponse): string {
    switch (order.timerStatus) {
      case TimerStatus.READY: return 'red';
      case TimerStatus.WARNING: return 'yellow';
      case TimerStatus.NORMAL: 
      default: return 'green';
    }
  }
}
