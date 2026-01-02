import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustodyAuditsService {
  private apiUrl = 'https://newwinventoryapi.runasp.net/api/CustodyAudits';

  constructor(private http: HttpClient) {}

  addAudit(audit: any): Observable<any> {
    return this.http.post(this.apiUrl, audit);
  }

  getAllAudits(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
