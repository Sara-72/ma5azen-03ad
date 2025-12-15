// src/app/services/ledger.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LedgerEntry {
  date: string;
  documentReference: string;
  addedItemsValue: number;
  issuedItemsValue: number;
  storeType: number;
  spendPermissionId: number;
  spendPermission: string;
}

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private apiUrl = 'http://newwinventoryapi.runasp.net/api/LedgerEntries';

  constructor(private http: HttpClient) {}

  getLedgerEntries(): Observable<LedgerEntry[]> {
    return this.http.get<LedgerEntry[]>(this.apiUrl);
  }

  addLedgerEntry(entry: LedgerEntry): Observable<LedgerEntry> {
    return this.http.post<LedgerEntry>(this.apiUrl, entry);
  }
}
