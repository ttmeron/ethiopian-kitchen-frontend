import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-drink-item',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './drink-item.component.html',
  styleUrl: './drink-item.component.scss'
})
export class DrinkItemComponent {


    private baseUrl = environment.apiUrl;
    private _drink: any = {}; 
  @Input() 
    set drink(value: any) {
     this._drink = value || {}; 
      }
      
    get drink(): any {
      return this._drink || {};
      }
  @Output() drinkClicked = new EventEmitter<any>();

   ngOnInit(): void {
    console.log('DRINK OBJECT (DrinkItem):', this.drink);
  }

  defaultImage = 'assets/default-image.jpg';

   getImageUrl(): string {
    if (!this.drink?.imagePath) return this.defaultImage;
    if (this.drink.imagePath.startsWith('http')) return this.drink.imagePath;
    return `${this.baseUrl}/images/${this.drink.imagePath}`;
  }

  handleImageError(event: Event): void {
  const imgElement = event.target as HTMLImageElement;
  imgElement.src = this.defaultImage; // Use defaultImage property!
}

  onCardClick(): void{
    this.drinkClicked.emit(this.drink);
  }

}
