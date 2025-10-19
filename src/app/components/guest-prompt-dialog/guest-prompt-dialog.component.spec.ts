import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestPromptDialogComponent } from './guest-prompt-dialog.component';

describe('GuestPromptDialogComponent', () => {
  let component: GuestPromptDialogComponent;
  let fixture: ComponentFixture<GuestPromptDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestPromptDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestPromptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
