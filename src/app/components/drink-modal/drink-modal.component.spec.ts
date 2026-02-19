import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrinkModalComponent } from './drink-modal.component';

describe('DrinkModalComponent', () => {
  let component: DrinkModalComponent;
  let fixture: ComponentFixture<DrinkModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrinkModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrinkModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
