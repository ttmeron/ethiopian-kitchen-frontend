import { Component, HostListener, OnInit } from '@angular/core';
import { EmployeeResponse } from '../../shared/models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {
  employees: EmployeeResponse[] = [];
  filteredEmployees: EmployeeResponse[] = [];
  isLoading = false;
  searchTerm = '';
  selectedDepartment = '';
  selectedPosition = '';
  openDropdownId: number | null = null;


  // Filter options
  departments = ['KITCHEN', 'SERVICE', 'MANAGEMENT', 'FRONT_DESK', 'GENERAL'];
  positions = ['CHEF', 'SOUS_CHEF', 'LINE_COOK', 'DISHWASHER', 'WAITER', 'WAITRESS', 'SERVER', 'BARTENDER', 'HOST', 'HOSTESS', 'MANAGER', 'ASSISTANT_MANAGER', 'CASHIER'];

  constructor(private employeeService: EmployeeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
  }

  navigateToCreateEmployee(): void {
  this.router.navigate(['/admin/employees/create']);
}


@HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.openDropdownId = null;
  }

  toggleDropdown(employeeId: number, event: Event): void {
    event.stopPropagation(); 
    
    if (this.openDropdownId === employeeId) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = employeeId;
    }
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }
  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.filteredEmployees = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.isLoading = false;
      }
    });
  }

  searchEmployees(): void {
    if (this.searchTerm.trim()) {
      this.employeeService.searchEmployeesByName(this.searchTerm).subscribe({
        next: (data) => {
          this.filteredEmployees = data;
        },
        error: (error) => {
          console.error('Error searching employees:', error);
        }
      });
    } else {
      this.filteredEmployees = this.employees;
    }
  }

  filterEmployees(): void {
    this.filteredEmployees = this.employees.filter(employee => {
      const departmentMatch = !this.selectedDepartment || employee.department === this.selectedDepartment;
      const positionMatch = !this.selectedPosition || employee.position === this.selectedPosition;
      return departmentMatch && positionMatch;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.selectedPosition = '';
    this.filteredEmployees = this.employees;
  }

  deactivateEmployee(id: number): void {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      this.employeeService.deactivateEmployee(id).subscribe({
        next: () => {
          this.loadEmployees(); 
        },
        error: (error) => {
          console.error('Error deactivating employee:', error);
        }
      });
    }
  }

  activateEmployee(id: number): void {
    this.employeeService.activateEmployee(id).subscribe({
      next: () => {
        this.loadEmployees(); 
      },
      error: (error) => {
        console.error('Error activating employee:', error);
      }
    });
  }

  deleteEmployee(id: number): void {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.loadEmployees(); 
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
        }
      });
    }
  }

  getStatusBadgeClass(active: boolean): string {
    return active ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusText(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }

}
