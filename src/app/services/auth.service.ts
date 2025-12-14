import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
const FACULTY_MAP: Record<string, string> = {
  'كلية التربية': 'education',
  'كلية الحاسبات والذكاء الاصطناعي': 'csai',
  'كلية الألسن': 'alsun',
  'كلية السياحة و الفنادق': 'tourism'
};
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  normalizeFaculty(faculty: string | null | undefined): string | null {
  if (!faculty) return null;
  return FACULTY_MAP[faculty] ?? faculty;
}

  private api = 'http://newwinventoryapi.runasp.net/api';

  constructor(private http: HttpClient) {}

  // ===== LOGIN =====
  adminLogin(data: any) {
    return this.http.post(`${this.api}/Auth/admin/login`, data);
  }

  employeeLogin(data: any) {
    return this.http.post(`${this.api}/Auth/employee/login`, data);
  }

  storeKeeperLogin(data: any) {
    return this.http.post(`${this.api}/Auth/store-keeper/login`, data);
  }

  inventoryManagerLogin(data: any) {
    return this.http.post(`${this.api}/Auth/inventory-manager/login`, data);
  }

  userLogin(data: any) {
    return this.http.post(`${this.api}/Auth/user/login`, data);
  }

  // ===== ADMIN CREATE =====
  addUser(data: any) {
    return this.http.post(`${this.api}/Users`, data);
  }

  addEmployee(data: any) {
    return this.http.post(`${this.api}/Employees`, data);
  }

  addStoreKeeper(data: any) {
    return this.http.post(`${this.api}/StoreKeepers`, data);
  }

  addInventoryManager(data: any) {
    return this.http.post(`${this.api}/InventoryManagers`, data);
  }
  
}
