import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpendPermissionService {

  private apiUrl = 'https://newwinventoryapi.runasp.net/api/SpendPermissions';

  constructor(private http: HttpClient) {}

  // ✅ Get all spend permissions
  getAll(): Observable<any[]> {
    // لا حاجة responseType:'text' لأن الـ API بيرجع نص JSON بشكل صحيح
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
