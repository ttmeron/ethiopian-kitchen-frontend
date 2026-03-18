import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmployeeRequest, EmployeeResponse } from '../shared/models/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/admin/employees`;

  constructor(private http: HttpClient) { }

  createEmployee(employee: EmployeeRequest): Observable<EmployeeResponse> {
    console.log('🚀 Sending to backend:', employee);
    return this.http.post<EmployeeResponse>(this.apiUrl, employee);
  }

  getAllEmployees(): Observable<EmployeeResponse[]> {
    return this.http.get<EmployeeResponse[]>(this.apiUrl);
  }

  getEmployeeById(id: number): Observable<EmployeeResponse> {
    return this.http.get<EmployeeResponse>(`${this.apiUrl}/${id}`);
  }

  getEmployeeByCode(employeeCode: string): Observable<EmployeeResponse> {
    return this.http.get<EmployeeResponse>(`${this.apiUrl}/code/${employeeCode}`);
  }

  getEmployeesByPosition(position: string): Observable<EmployeeResponse[]> {
    return this.http.get<EmployeeResponse[]>(`${this.apiUrl}/position/${position}`);
  }

  getEmployeesByDepartment(department: string): Observable<EmployeeResponse[]> {
    return this.http.get<EmployeeResponse[]>(`${this.apiUrl}/department/${department}`);
  }

  getActiveEmployees(): Observable<EmployeeResponse[]> {
    return this.http.get<EmployeeResponse[]>(`${this.apiUrl}/active`);
  }

  searchEmployeesByName(name: string): Observable<EmployeeResponse[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<EmployeeResponse[]>(`${this.apiUrl}/search`, { params });
  }

  updateEmployee(id: number, employee: EmployeeRequest): Observable<EmployeeResponse> {
    return this.http.put<EmployeeResponse>(`${this.apiUrl}/${id}`, employee);
  }

  deactivateEmployee(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  activateEmployee(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/activate`, {});
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEmployeesCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

}