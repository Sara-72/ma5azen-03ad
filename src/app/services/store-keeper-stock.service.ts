import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StockResponse {
  id: number;
  itemName: string;
  category: string;
  storeType: string; // مستهلك أو مستديم
  unit: string;
  quantity: number;
  additionId?: number;
  spendPermissionId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StoreKeeperStockService {

  private apiUrl = 'https://newwinventoryapi.runasp.net/api/StoreKeeperStocks';

  constructor(private http: HttpClient) {}

  addStock(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getStock(itemName: string, category: string): Observable<StockResponse> {
    return this.http.get<StockResponse>(`${this.apiUrl}/by-item?itemName=${itemName}&category=${category}`);
  }

  updateStock(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }
  getAllStocks(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}`);
}

}
