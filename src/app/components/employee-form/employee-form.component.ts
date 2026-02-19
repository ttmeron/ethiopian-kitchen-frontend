import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeRequest } from '../../shared/models/employee.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  isEditMode = false;
  employeeId?: number;
  isLoading = false;
  isSubmitting = false;

  positions = ['CHEF', 'SOUS_CHEF', 'LINE_COOK', 'DISHWASHER', 'WAITER', 'WAITRESS', 'ADMIN','SERVER', 'BARTENDER', 'HOST', 'HOSTESS', 'MANAGER', 'ASSISTANT_MANAGER', 'CASHIER'];
  shifts = ['MORNING', 'EVENING', 'NIGHT'];
  departments = ['KITCHEN', 'SERVICE', 'MANAGEMENT', 'FRONT_DESK', 'GENERAL'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService
  ) {
    this.employeeForm = this.createForm();
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.employeeId;

    if (this.isEditMode) {
      this.loadEmployee();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{10,15}$')]],
      position: ['', Validators.required],
      department: [''],
      hireDate: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      address: [''],
      emergencyContact: [''],
      shift: ['', Validators.required],
      dateOfBirth: ['', Validators.required] 
    });
  }

  get firstName() { return this.employeeForm.get('firstName'); }
  get lastName() { return this.employeeForm.get('lastName'); }
  get email() { return this.employeeForm.get('email'); }
  get phoneNumber() { return this.employeeForm.get('phoneNumber'); }
  get position() { return this.employeeForm.get('position'); }
  get department() { return this.employeeForm.get('department'); }
  get hireDate() { return this.employeeForm.get('hireDate'); }
  get salary() { return this.employeeForm.get('salary'); }
  get shift() { return this.employeeForm.get('shift'); }
  get emergencyContact() { return this.employeeForm.get('emergencyContact'); }
  get address() { return this.employeeForm.get('address'); }
  get dateOfBirth() { return this.employeeForm.get('dateOfBirth'); }


  loadEmployee(): void {
    if (!this.employeeId) return;

    this.isLoading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (employee) => {
        this.employeeForm.patchValue({
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          position: employee.position,
          department: employee.department,
          hireDate: employee.hireDate,
          salary: employee.salary,
          address: employee.address,
          emergencyContact: employee.emergencyContact,
          dateOfBirth: employee.dateOfBirth
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    console.log('🚀 onSubmit called');
  console.log('📋 Form value:', this.employeeForm.value);
  console.log('📅 Date of Birth value:', this.dateOfBirth?.value);
  console.log('📅 Date of Birth valid:', this.dateOfBirth?.valid);
  console.log('📅 Date of Birth touched:', this.dateOfBirth?.touched);
  console.log('📅 Date of Birth dirty:', this.dateOfBirth?.dirty);
  console.log('✅ Form valid:', this.employeeForm.valid);
  
    if (this.employeeForm.valid) {
      this.isSubmitting = true;
      const employeeData: EmployeeRequest = this.employeeForm.value;

    console.log('📋 Form Data:', this.employeeForm.value);
    console.log('📅 Date of Birth value:', this.employeeForm.get('dateOfBirth')?.value);
    console.log('✅ Form valid:', this.employeeForm.valid);

      if (this.isEditMode && this.employeeId) {
        this.employeeService.updateEmployee(this.employeeId, employeeData).subscribe({
          next: () => {
            this.router.navigate(['/admin/employees']);
          },
          error: (error) => {
            console.error('Error updating employee:', error);
            this.isSubmitting = false;
            console.error('❌ Error updating employee:', error);
            console.error('❌ Error details:', error.error);
        
          }
        });
      } else {
        this.employeeService.createEmployee(employeeData).subscribe({
          next: () => {
            this.router.navigate(['/admin/employees']);
          },
          error: (error) => {
            console.error('Error creating employee:', error);
            this.isSubmitting = false;
            console.error('❌ Error creating employee:', error);
            console.error('❌ Error details:', error.error);
         
          }
        });
      }
    } else {
       console.log('❌ Form invalid. Showing errors:');
       Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      if (control?.invalid) {
        console.log(`  ${key}:`, control.errors);
      }
    });
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      control?.markAsTouched();
    });
  }

  onPositionChange(): void {
    const position = this.position?.value;
    if (position && !this.department?.value) {
      const department = this.determineDepartment(position);
      this.employeeForm.patchValue({ department });
    }
  }

  private determineDepartment(position: string): string {
    const kitchenPositions = ['CHEF', 'SOUS_CHEF', 'LINE_COOK', 'DISHWASHER'];
    const servicePositions = ['WAITER', 'WAITRESS', 'SERVER', 'BARTENDER', 'HOST', 'HOSTESS'];
    const managementPositions = ['MANAGER', 'ASSISTANT_MANAGER'];

    if (kitchenPositions.includes(position)) return 'KITCHEN';
    if (servicePositions.includes(position)) return 'SERVICE';
    if (managementPositions.includes(position)) return 'MANAGEMENT';
    if (position === 'CASHIER') return 'FRONT_DESK';
    
    return 'GENERAL';
  }

}
