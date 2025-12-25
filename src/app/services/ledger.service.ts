// src/app/services/ledger.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LedgerEntry {
  date: string;
  documentReference: string;
  addedItemsValue: number;
  issuedItemsValue: number;
  storeType: number;        // 0 = مستهلك | 1 = مستديم
  spendPermissionId: number | null;
}



@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  private apiUrl = 'https://newwinventoryapi.runasp.net/api/LedgerEntries';

  constructor(private http: HttpClient) {}

  getLedgerEntries(): Observable<LedgerEntry[]> {
  return this.http.get<LedgerEntry[]>(this.apiUrl, { responseType: 'json' });
}


  getLedgerEntryById(id: number): Observable<LedgerEntry> {
    return this.http.get<LedgerEntry>(`${this.apiUrl}/${id}`);
  }

  addLedgerEntry(entry: LedgerEntry): Observable<any> {
  return this.http.post(this.apiUrl, {
    id: 0,
    date: entry.date,
    documentReference: entry.documentReference,
    addedItemsValue: entry.addedItemsValue,
    issuedItemsValue: entry.issuedItemsValue,
    storeType: entry.storeType,
    spendPermissionId: entry.spendPermissionId,
    spendPermission: null // ⭐ مهم جدًا
  });
}



  updateLedgerEntry(id: number, entry: LedgerEntry): Observable<LedgerEntry> {
    return this.http.put<LedgerEntry>(`${this.apiUrl}/${id}`, entry);
  }
}

