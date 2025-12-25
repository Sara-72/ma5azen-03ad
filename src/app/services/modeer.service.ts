import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModeerSercive {

  private api = 'https://newwinventoryapi.runasp.net/api';

  constructor(private http: HttpClient) {}
//Additions Service
  getAdditions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/Additions`);
  }
  getStoreKeeperStocks() {
  return this.http.get<any[]>(
    'https://newwinventoryapi.runasp.net/api/StoreKeeperStocks'
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
  // modeer.service.ts
  getSpendNotes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/SpendNotes`);
  }

  getSpendNoteById(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/SpendNotes/${id}`);
  }

  updateSpendNoteStatus(
    noteId: number,
    updatedNote: any
  ): Observable<any> {
    return this.http.put(
      `${this.api}/SpendNotes/${noteId}`,
      updatedNote
    );
  }
}

