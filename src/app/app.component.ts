import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { PaymentComponent } from './components/payment/payment.component';
import { NgIf } from '@angular/common'; 
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,
  HeaderComponent,PaymentComponent, NgIf ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ethiopian-kitchen-frontend';

  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }
}
