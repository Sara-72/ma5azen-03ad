import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpendNotesService {

  // 👇 خليها relative علشان تعدي من الـ proxy
  private baseUrl = '/api/SpendNotes';

  constructor(private http: HttpClient) {}

  createSpendNote(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

 getMySpendNotes(): Observable<any[]> {
  return this.http.get<any[]>(this.baseUrl);
}


}
