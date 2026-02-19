import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminIngredientManagementComponent } from './admin-ingredient-management.component';

describe('AdminIngredientManagementComponent', () => {
  let component: AdminIngredientManagementComponent;
  let fixture: ComponentFixture<AdminIngredientManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminIngredientManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminIngredientManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
