import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDrinkManagementComponent } from './admin-drink-management.component';

describe('AdminDrinkManagementComponent', () => {
  let component: AdminDrinkManagementComponent;
  let fixture: ComponentFixture<AdminDrinkManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDrinkManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDrinkManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
