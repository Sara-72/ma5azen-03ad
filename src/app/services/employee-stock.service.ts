import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmployeeStock {
  id?: number;
  category: string;
  itemName: string;
  unit: string;
  quantity: number;
  itemStatus: string;
  date: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeStockService {
  baseUrl = 'https://newwinventoryapi.runasp.net/api/EmployeeStocks';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EmployeeStock[]> {
    return this.http.get<EmployeeStock[]>(this.baseUrl);
  }

  create(stock: EmployeeStock) {
    return this.http.post<EmployeeStock>(this.baseUrl, stock);
  }

  update(id: number, stock: EmployeeStock) {
    return this.http.put<EmployeeStock>(`${this.baseUrl}/${id}`, stock);
  }
}
