import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { OrderStatus, TimerStatus,OrderResponse,OrderItem } from '../../shared/models/order.model';
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

  constructor(
    private orderService: OrderService,
  private cdr: ChangeDetectorRef ){}

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
        this.cdr.detectChanges();
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

        console.log('Raw orders from API:', orders);
         orders.forEach((order, orderIndex) => {
          if (order.orderItems) {
            order.orderItems.forEach((item, itemIndex) => {
              console.log(`Order ${orderIndex}, Item ${itemIndex}:`, {
                name: item.foodName || item.drinkName,
                specialInstructions: item.specialInstructions,
                hasSpecialInstructions: !!item.specialInstructions?.trim()
              });
            });
          }
        });
        
        const existingOrderIds = new Set(this.orders.map(o => o.orderId));
        const newOrders = orders.filter(order => !existingOrderIds.has(order.orderId));
        
        const enrichedNewOrders = newOrders.map(order => this.enrichOrderData(order));
        const existingOrders = this.orders.filter(order => existingOrderIds.has(order.orderId));
        
        this.orders = [...existingOrders, ...enrichedNewOrders];
        
        if (enrichedNewOrders.length > 0) {
          console.log(`Found ${enrichedNewOrders.length} new orders, initializing their timers`);
          this.initializeTimersForNewOrders(enrichedNewOrders);
        } else {
          this.orders.forEach(order => this.updateSingleOrderTimer(order));
        }
        
        this.cdr.detectChanges();
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
private initializeTimersForNewOrders(newOrders: OrderResponse[]): void {
  const now = new Date();
  
  console.log('=== INITIALIZING TIMERS FOR NEW ORDERS ===');
  console.log('Current time:', now);

  const recentOrders = newOrders.filter(order => {
    const placedTime = new Date(order.placedTime);
    const timeSincePlaced = now.getTime() - placedTime.getTime();
    return timeSincePlaced <= 10 * 60 * 1000; 
  });

  const oldOrders = newOrders.filter(order => {
    const placedTime = new Date(order.placedTime);
    const timeSincePlaced = now.getTime() - placedTime.getTime();
    return timeSincePlaced > 10 * 60 * 1000; 
  });

  console.log(`Recent orders (<=10 min): ${recentOrders.length}`);
  console.log(`Old orders (>10 min): ${oldOrders.length}`);

  oldOrders.forEach(order => {
    order.estimatedReadyTime = new Date(now.getTime() - 1 * 60 * 1000); 
    order.remainingTime = 0;
    order.timerStatus = TimerStatus.READY;
    console.log(`Marking old order ${order.orderId} as READY (placed: ${order.placedTime})`);
  });

  if (recentOrders.length > 0) {
    const sortedRecentOrders = [...recentOrders].sort((a, b) => {
      return new Date(a.placedTime).getTime() - new Date(b.placedTime).getTime();
    });

    let currentBatchEndTime: Date | null = null;
    const existingOrders = this.orders.filter(order => !newOrders.includes(order));
    
    if (existingOrders.length > 0) {
      const validExistingOrders = existingOrders.filter(order => 
        order.estimatedReadyTime && 
        !isNaN(new Date(order.estimatedReadyTime).getTime()) &&
        new Date(order.estimatedReadyTime) > now 
      );
      
      if (validExistingOrders.length > 0) {
        const latestTime = Math.max(...validExistingOrders.map(order => 
          new Date(order.estimatedReadyTime!).getTime()
        ));
        currentBatchEndTime = new Date(latestTime);
        console.log('Continuing from existing orders, end time:', currentBatchEndTime);
      }
    }

    let ordersInCurrentBatch = currentBatchEndTime ? 1 : 0;

    sortedRecentOrders.forEach((order, index) => {
      if (!currentBatchEndTime || ordersInCurrentBatch >= this.MAX_CONCURRENT_ORDERS) {
        currentBatchEndTime = new Date(now.getTime() + this.BASE_PREP_TIME * 60 * 1000);
        ordersInCurrentBatch = 1;
        console.log(`Starting NEW batch for order ${order.orderId}. End time:`, currentBatchEndTime);
      } else {
        currentBatchEndTime = new Date(currentBatchEndTime.getTime() + 2 * 60 * 1000);
        ordersInCurrentBatch++;
        console.log(`Adding order ${order.orderId} to existing batch. End time:`, currentBatchEndTime);
      }
      
      order.estimatedReadyTime = currentBatchEndTime;
      console.log(`Order ${order.orderId} estimated ready:`, order.estimatedReadyTime);
      
      this.updateSingleOrderTimer(order);
    });
  }

  console.log('=== FINAL ORDER STATES ===');
  this.orders.forEach(order => {
    console.log(`Order ${order.orderId}:`, {
      placed: order.placedTime,
      estimatedReady: order.estimatedReadyTime,
      remaining: order.remainingTime,
      status: order.timerStatus
    });
  });
}
 loadPaidOrders(): void {
  this.orderService.getPaidOrders().subscribe({
    next: (response: unknown) => {
      try {
        const orders = response as OrderResponse[];
        if (!Array.isArray(orders)) {
          throw new Error('Expected array of orders');
        }

        console.log('Raw paid orders from API:', orders);
         
        
        const existingOrderIds = new Set(this.orders.map(o => o.orderId));
        const newOrders = orders.filter(order => !existingOrderIds.has(order.orderId));
        
        const enrichedNewOrders = newOrders.map(order => this.enrichOrderData(order));
        const existingOrders = this.orders.filter(order => existingOrderIds.has(order.orderId));
        
        this.orders = [...existingOrders, ...enrichedNewOrders];
        
        if (enrichedNewOrders.length > 0) {
          console.log(`Found ${enrichedNewOrders.length} new paid orders, initializing their timers`);
          this.initializeTimersForNewOrders(enrichedNewOrders);
        } else {
          this.orders.forEach(order => this.updateSingleOrderTimer(order));
        }
        
        this.cdr.detectChanges();
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
   private enrichOrderData(order: any): OrderResponse {
  const placedTime = order.placedTime || order.createdAt || new Date().toISOString();
  
  console.log('=== RAW ORDER DATA ===');
  console.log('Full order:', order);
  console.log('Order specialInstructions:', order.specialInstructions);  

  const instructionsMap = this.parseSpecialInstructions(order.specialInstructions, order);

  
  const orderItems: OrderItem[] = [];
  
  if (order.foodItems && Array.isArray(order.foodItems)) {
    console.log(`Processing ${order.foodItems.length} food items`);
    order.foodItems.forEach((food: any, index: number) => {
      const foodName = food.foodName || '';
      const itemInstruction = this.getInstructionForItem(foodName, instructionsMap);
      console.log(`Food item ${index}:`, food);
      
      const orderInstructions = order.specialInstructions || '';
      
      orderItems.push({
        itemType: 'FOOD' as const,
        foodId: food.foodId,
        foodName: food.foodName,
        drinkName: '', 
        price: food.price,
        quantity: food.quantity,
        customIngredients: food.customIngredients || [],
        specialInstructions: itemInstruction
      });
    });
  }
  
  if (order.drinkItems && Array.isArray(order.drinkItems)) {
    console.log(`Processing ${order.drinkItems.length} drink items`);
    
    order.drinkItems.forEach((drink: any, index: number) => {
      const drinkName = drink.drinkName || '';
      const itemInstruction = this.getInstructionForItem(drinkName, instructionsMap);
      console.log(`=== Drink item ${index} details ===`);
      
      const orderInstructions = order.specialInstructions || '';
      
      orderItems.push({
        itemType: 'DRINK' as const,
        foodId: 0, 
        foodName: '', 
        drinkName: drink.drinkName,
        price: drink.price,
        quantity: drink.quantity,
        size: drink.size,
        iceOption: drink.iceOption ?? drink.ice,
        customIngredients: drink.customIngredients || [],
        specialInstructions: itemInstruction
      });
    });
  }
  
  const enrichedOrder: OrderResponse = {
    ...order,
    orderId: order.orderId || 0,
    totalPrice: order.totalPrice || 0,
    orderNumber: order.orderNumber || '',
    placedTime: placedTime,
    status: this.parseOrderStatus(order.status || 'CONFIRMED'),
    userName: order.customerName || order.userName || '',
    email: order.customerEmail || order.email || '',
    orderItems: orderItems,
    deliveryDTO: order.deliveryDTO || undefined,
    estimatedReadyTime: order.estimatedReadyTime || undefined,
    remainingTime: order.remainingTime ?? this.BASE_PREP_TIME,
    timerStatus: order.timerStatus || TimerStatus.NORMAL
  };
  
  console.log('=== FINAL ENRICHED ORDER ITEMS ===');
  enrichedOrder.orderItems.forEach((item, index) => {
    console.log(`Item ${index}:`, {
      type: item.itemType,
      name: item.foodName || item.drinkName,
      specialInstructions: item.specialInstructions,  
      hasSpecialInstructions: !!item.specialInstructions?.trim()
    });
  });
  
  return enrichedOrder;
}
  private parseOrderStatus(status: string): OrderStatus {
    return OrderStatus[status as keyof typeof OrderStatus] || OrderStatus.READY;
  }

  private setupTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.updateOrderTimers();
    });
  }

  getShortOrderNumber(order: any): string {
  if (order?.orderNumber) {
    return order.orderNumber.substring(0, 6).toUpperCase();
  }
  if (order?.orderId) {
    return order.orderId.toString();
  }
  return '';
}

   updateOrderTimers(): void {
    let hasChanges = false;
    
    this.orders.forEach(order => {
      const previousRemainingTime = order.remainingTime;
      const previousTimerStatus = order.timerStatus;
      
      this.updateSingleOrderTimer(order);
      
      if (previousRemainingTime !== order.remainingTime || previousTimerStatus !== order.timerStatus) {
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.cdr.detectChanges();
    }
  }

  private updateSingleOrderTimer(order: OrderResponse): void {
  if (!order.estimatedReadyTime) return;
  
  const now = new Date();
  const timeDiffMs = order.estimatedReadyTime.getTime() - now.getTime();
  
  const remainingTime = Math.max(0, Math.ceil(timeDiffMs / (60 * 1000)));
  order.remainingTime = remainingTime;
  
  if (remainingTime <= 0) {
    order.timerStatus = TimerStatus.READY;
  } else if (remainingTime <= 2) { 
    order.timerStatus = TimerStatus.READY;
  } else if (remainingTime <= 5) { 
    order.timerStatus = TimerStatus.WARNING;
  } else {
    order.timerStatus = TimerStatus.NORMAL;
  }
}

 getTimerColor(order: OrderResponse): string {
    switch (order.timerStatus) {
      case TimerStatus.READY: return 'red';
      case TimerStatus.WARNING: return 'orange';
      case TimerStatus.NORMAL: 
      default: return 'green';
    }
  }

getTimerText(order: OrderResponse): string {
  if (order.remainingTime === undefined) {
    return '10:00';
  }
  
  if (order.remainingTime <= 0) {
    return 'Ready!';
  }
  
  const formattedMinutes = order.remainingTime.toString().padStart(2, '0');
  return `${formattedMinutes}:00`;
}
  getTimerProgress(order: OrderResponse): number {
    if (!order.totalRemainingSeconds || order.totalRemainingSeconds <= 0) {
      return 0;
    }
    const totalTime = 10 * 60; 
    const progress = (order.totalRemainingSeconds / totalTime) * 100;
    return Math.max(0, Math.min(100, progress));
  }

   getTimeSincePlaced(order: OrderResponse): string {
    if (!order.placedTime) return 'Unknown';
    
    const placed = new Date(order.placedTime);
    const now = new Date();
    
    if (isNaN(placed.getTime()) || isNaN(now.getTime())) {
      return 'Invalid date';
    }
    
    const diffMs = now.getTime() - placed.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins === 1) {
      return '1 minute ago';
    } else {
      return `${diffMins} minutes ago`;
    }
  }

  isValidEstimatedTime(order: OrderResponse): boolean {
    if (!order.estimatedReadyTime) return false;
    return !isNaN(new Date(order.estimatedReadyTime).getTime());
  }
  
  refreshDisplay(): void {
    this.cdr.detectChanges();
  }


  private getInstructionForItem(itemName: string, instructionsMap: {[key: string]: string}): string {
  if (!itemName) return '';
  
  // Try exact match
  if (instructionsMap[itemName]) {
    return instructionsMap[itemName];
  }
  
  // Try case-insensitive match
  const lowerItemName = itemName.toLowerCase();
  for (const key in instructionsMap) {
    if (key.toLowerCase() === lowerItemName) {
      return instructionsMap[key];
    }
  }
  
  return ''; 
}
  private parseSpecialInstructions(instructions: string, order: any): {[itemName: string]: string} {
  const instructionsMap: {[itemName: string]: string} = {};
  
  if (!instructions || typeof instructions !== 'string') {
    return instructionsMap;
  }
  
  console.log('=== PARSING SPECIAL INSTRUCTIONS ===');
  console.log('Raw instructions:', instructions);
  
  const patterns = [
    /([^:]+):\s*([^:]+)(?=\s+[^:]+:|$)/g,
    
    /([^-]+)-\s*([^-]+)(?=\s+[^-]+-|$)/g,
    
    /([^.,;]+)[.,;]\s*/g
  ];
  
  for (const pattern of patterns) {
    const matches = [...instructions.matchAll(pattern)];
    if (matches.length > 0) {
      console.log(`Found pattern matches:`, matches);
      
      matches.forEach(match => {
        if (match[1] && match[2]) {
          const itemName = match[1].trim();
          const itemInstruction = match[2].trim();
          instructionsMap[itemName] = itemInstruction;
          console.log(`Mapped: "${itemName}" -> "${itemInstruction}"`);
        }
      });
      
      break; 
    }
  }
  
  if (Object.keys(instructionsMap).length === 0) {
    console.log('No pattern matches, trying intelligent split...');
    
    const allItemNames: string[] = [];
    
    if (order.foodItems && Array.isArray(order.foodItems)) {
      order.foodItems.forEach((food: any) => {
        if (food.foodName) allItemNames.push(food.foodName.trim());
      });
    }
    
    if (order.drinkItems && Array.isArray(order.drinkItems)) {
      order.drinkItems.forEach((drink: any) => {
        if (drink.drinkName) allItemNames.push(drink.drinkName.trim());
      });
    }
    
    console.log('All item names in order:', allItemNames);
    
    allItemNames.forEach(itemName => {
      const index = instructions.toLowerCase().indexOf(itemName.toLowerCase());
      
      if (index !== -1) {
        let endIndex = instructions.length;
        
        for (const otherItemName of allItemNames) {
          if (otherItemName !== itemName) {
            const otherIndex = instructions.toLowerCase().indexOf(
              otherItemName.toLowerCase(), 
              index + itemName.length
            );
            if (otherIndex !== -1 && otherIndex < endIndex) {
              endIndex = otherIndex;
            }
          }
        }
        
        const itemStart = index + itemName.length;
        let itemInstructions = instructions.substring(itemStart, endIndex).trim();
        
        itemInstructions = itemInstructions.replace(/^[:-\s]+/, '');
        
        if (itemInstructions) {
          instructionsMap[itemName] = itemInstructions;
          console.log(`Found via search: "${itemName}" -> "${itemInstructions}"`);
        }
      }
    });
  }
  
  if (Object.keys(instructionsMap).length === 0 && instructions.trim()) {
    console.log('No specific matches found, assigning to first item');
  }
  
  return instructionsMap;
}
}
