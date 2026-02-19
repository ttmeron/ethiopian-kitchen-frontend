export interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  address: string;
  emergencyContact: string;
  active: boolean;
  employeeCode: string;
  createdAt?: string;
  dateOfBirth: string;
  shift: string;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department?: string;
  hireDate: string;
  salary: number;
  address: string;
  emergencyContact: string;
  dateOfBirth: string;
  shift: string;
}

export interface EmployeeResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  address: string;
  emergencyContact: string;
  active: boolean;
  employeeCode: string;
  createdAt: string;
  dateOfBirth: string;
  shift:string;
}