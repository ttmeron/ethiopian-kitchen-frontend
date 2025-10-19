import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFoodManagementComponent } from './admin-food-management.component';

describe('AdminFoodManagementComponent', () => {
  let component: AdminFoodManagementComponent;
  let fixture: ComponentFixture<AdminFoodManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFoodManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminFoodManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
