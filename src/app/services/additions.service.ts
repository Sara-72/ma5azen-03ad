import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdditionsService {

  private api = 'http://newwinventoryapi.runasp.net/api';

  constructor(private http: HttpClient) {}

  getAdditions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/Additions`);
  }
}
