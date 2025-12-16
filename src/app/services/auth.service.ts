import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

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
