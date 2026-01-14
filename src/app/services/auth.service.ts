import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { forkJoin, map, Observable } from 'rxjs'; // 👈 Import these

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private api = 'https://newwinventoryapi.runasp.net/api';

  constructor(private http: HttpClient) {}

  // ===== LOGIN =====
adminLogin(data: any) {
  return this.http.post(`${this.api}/Auth/admin/login`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
}

employeeLogin(data: any) {
  return this.http.post(`${this.api}/Auth/employee/login`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
}

storeKeeperLogin(data: any) {
  return this.http.post(`${this.api}/Auth/store-keeper/login`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
}

inventoryManagerLogin(data: any) {
  return this.http.post(`${this.api}/Auth/inventory-manager/login`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
}


 userLogin(data: any) {
  return this.http.post(`${this.api}/Auth/user/login`, data, {
    headers: { 'Content-Type': 'application/json' }
  });
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
  checkEmailExists(email: string, role: string) {
    let url = '';
    switch (role) {
     case 'موظف':
      url = `${this.api}/Users?email=${email}`;
      break;
     case 'موظف مخزن':
      url = `${this.api}/Employees?email=${email}`;
      break;
     case 'أمين مخزن':
      url = `${this.api}/StoreKeepers?email=${email}`;
      break;
     case 'مدير مخزن':
      url = `${this.api}/InventoryManagers?email=${email}`;
      break;
     }
    return this.http.get(url); // يفترض السيرفر يرجع [] لو مش موجود أو object لو موجود
  }
  loginByRole(role: string, data: { email: string; password: string }) {
  switch (role) {
    case 'ADMIN':
      return this.adminLogin(data);

    case 'EMPLOYEE':
      return this.employeeLogin(data);

    case 'STORE_KEEPER':
      return this.storeKeeperLogin(data);

    case 'INVENTORY_MANAGER':
      return this.inventoryManagerLogin(data);

    default:
      return this.userLogin(data);
  }
}



  // ===== FETCH ALL ACCOUNTS =====
  getAllAccounts(): Observable<any[]> {
    return forkJoin({
      users: this.http.get<any[]>(`${this.api}/Users`),
      employees: this.http.get<any[]>(`${this.api}/Employees`),
      keepers: this.http.get<any[]>(`${this.api}/StoreKeepers`),
      managers: this.http.get<any[]>(`${this.api}/InventoryManagers`)
    }).pipe(
      map(res => {
        // We add the 'role' manually so the admin knows which table the user belongs to
        const u = res.users.map(x => ({ ...x, role: 'موظف', endpoint: 'Users' }));
        const e = res.employees.map(x => ({ ...x, role: 'موظف مخزن', endpoint: 'Employees' }));
        const k = res.keepers.map(x => ({ ...x, role: 'أمين مخزن', endpoint: 'StoreKeepers' }));
        const m = res.managers.map(x => ({ ...x, role: 'مدير مخزن', endpoint: 'InventoryManagers' }));
        return [...u, ...e, ...k, ...m];
      })
    );
  }

  // ===== DELETE ACCOUNT =====
  deleteAccount(id: number, endpoint: string) {
    return this.http.delete(`${this.api}/${endpoint}/${id}`);
  }

  // ===== UPDATE ACCOUNT (Example: Update Password/Name) =====
  updateAccount(id: number, endpoint: string, data: any) {
    return this.http.put(`${this.api}/${endpoint}/${id}`, data);
  }

checkNameExists(name: string) {
  return forkJoin({
    users: this.http.get<any[]>(`${this.api}/Users`),
    employees: this.http.get<any[]>(`${this.api}/Employees`),
    keepers: this.http.get<any[]>(`${this.api}/StoreKeepers`),
    managers: this.http.get<any[]>(`${this.api}/InventoryManagers`)
  }).pipe(
    map(res => {
      const allNames = [
        ...res.users,
        ...res.employees,
        ...res.keepers,
        ...res.managers
      ].map(x => x.name?.trim().toLowerCase());

      return allNames.includes(name.trim().toLowerCase());
    })
  );
}
checkEmailExistsAllRoles(email: string) {
  return this.getAllAccounts().pipe(
    map(accounts => accounts.some(acc => acc.email?.toLowerCase() === email.toLowerCase()))
  );
}


}
