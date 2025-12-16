import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModeerSercive {

  private api = 'http://newwinventoryapi.runasp.net/api';

  constructor(private http: HttpClient) {}
//Additions Service
  getAdditions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/Additions`);
  }
  getStoreKeeperStocks() {
  return this.http.get<any[]>(
    'http://newwinventoryapi.runasp.net/api/StoreKeeperStocks'
  );
}
  //SpendPermission service
  getSpendPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/SpendPermissions`);
  }

  // (اختياري) get permission by id
  getSpendPermissionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/SpendPermissions/${id}`);
  }
}

