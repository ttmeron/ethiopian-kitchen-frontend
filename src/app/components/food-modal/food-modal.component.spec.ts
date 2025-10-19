import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoodModalComponent } from './food-modal.component';

describe('FoodModalComponent', () => {
  let component: FoodModalComponent;
  let fixture: ComponentFixture<FoodModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoodModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FoodModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
