import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StoreKeeperStockService {
  private apiUrl = 'http://newwinventoryapi.runasp.net/api/StoreKeeperStocks';

  constructor(private http: HttpClient) {}

  addStock(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}