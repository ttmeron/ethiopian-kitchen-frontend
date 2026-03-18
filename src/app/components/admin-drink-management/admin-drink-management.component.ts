import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { SoftDrink, SoftDrinkService } from '../../services/SoftDrink.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-drink-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButton,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './admin-drink-management.component.html',
  styleUrl: './admin-drink-management.component.scss'
})
export class AdminDrinkManagementComponent implements OnInit{


  sizes = [
  { label: '500 ml', value: 'SMALL' },
  { label: '1 Liter', value: 'MEDIUM' },
  { label: '2 Liter', value: 'LARGE' }
];

iceOptions = [
  { label: 'Cold', value: 'COLD' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Ice', value: 'ICE' },
  { label: 'No Ice', value: 'NO_ICE' }
];


  private baseUrl = environment.apiUrl
  drinks: SoftDrink[] = [];
  drinkForm!: FormGroup;

  isEditing = false;
  selectedDrink: SoftDrink | null = null;

  selectedFile: File | null = null;
  imagePreview: string | null = null;

  displayedColumns = ['name', 'price','size', 'iceOptions', 'image', 'actions'];

   constructor(
    private fb: FormBuilder,
    private drinkService: SoftDrinkService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDrinks();
  }
initForm() {
  this.drinkForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    size: ['LARGE', Validators.required],
    iceOption: ['NORMAL', Validators.required],
    imagePath: ['']
  }); 
}



  loadDrinks() {
    this.drinkService.getAllSoftDrinks().subscribe(drinks => {
      this.drinks = drinks;
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  addDrink() {
    this.isEditing = false;
    this.selectedDrink = null;
    this.drinkForm.reset({ price: 0 });
    this.selectedFile = null;
    this.imagePreview = null;
  }

  editDrink(drink: SoftDrink) {
  this.isEditing = true;
  this.selectedDrink = drink;

  console.log('📝 Editing drink:', drink);
  console.log('📝 Drink size property:', drink.Size);
  console.log('📝 Drink Size property (capital):', (drink as any).Size);
  const sizeValue = drink.Size || (drink as any).Size || 'LARGE';

 
  this.drinkForm.patchValue({
    name: drink.name,
    description: drink.description,
    price: drink.price,
    size: sizeValue, 
    iceOption: drink.iceOption
  });

  console.log('📝 Form after patch:', this.drinkForm.value);

  if (drink.imagePath) {
    this.imagePreview = this.getImageUrl(drink);
  } else {
    this.imagePreview = null;
  }
  this.selectedFile = null;
}

  submitDrink() {
  if (this.drinkForm.invalid) return;

  const formData = new FormData();
  
  const drinkData = {
    name: this.drinkForm.get('name')?.value,
    description: this.drinkForm.get('description')?.value,
    price: this.drinkForm.get('price')?.value,
    size: this.drinkForm.get('size')?.value,
    iceOption: this.drinkForm.get('iceOption')?.value
  };

  formData.append('drink', new Blob([JSON.stringify(drinkData)], {
    type: 'application/json'
  }));

  if (this.selectedFile) {
    formData.append('image', this.selectedFile); 
  }

  if (this.isEditing && this.selectedDrink) {
    this.drinkService.updateDrink(this.selectedDrink.id, formData)
      .subscribe({
        next: () => {
          console.log('Drink updated successfully');
          this.loadDrinks();
          this.addDrink();
        },
        error: (error) => {
          console.error('Error updating drink:', error);
          console.log('Full error object:', JSON.stringify(error, null, 2));
        }
      });
  } else {
    this.drinkService.createDrink(formData)
      .subscribe({
        next: () => {
          console.log('Drink created successfully');
          this.loadDrinks();
          this.addDrink();
        },
        error: (error) => {
          console.error('Error creating drink:', error);
        }
      });
  }
}
  deleteDrink(drink: SoftDrink) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Drink',
        message: `Delete ${drink.name}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.drinkService.deleteDrink(drink.id).subscribe(() => {
          this.loadDrinks();
        });
      }
    });
  }

  getImageUrl(drink: SoftDrink): string {
    if (!drink.imagePath) return 'assets/default-drink.png';
    return drink.imagePath.startsWith('http')
      ? drink.imagePath
      : `${this.baseUrl}/images/${drink.imagePath}`;
  }



}
