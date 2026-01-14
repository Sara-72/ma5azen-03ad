import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

export interface LedgerEntry {
  id?: number;
  date: string;
  itemName: string;
  unit: string;                 // ✅ تمت الإضافة
  documentReference: string;
  itemsValue: number;           // + وارد | - منصرف
  storeType: number;            // 0 = مستهلك | 1 = مستديم
  spendPermissionId: number | null;
  spendPermission?: any;
  status: string;
}


@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  private apiUrl = 'https://newwinventoryapi.runasp.net/api/LedgerEntries';

  constructor(private http: HttpClient) {}

  getLedgerEntries(): Observable<LedgerEntry[]> {
    return this.http.get<LedgerEntry[]>(this.apiUrl);
  }

  getLedgerEntryById(id: number): Observable<LedgerEntry> {
    return this.http.get<LedgerEntry>(`${this.apiUrl}/${id}`);
  }

 addLedgerEntry(entry: LedgerEntry): Observable<LedgerEntry> {
  return this.http.post<LedgerEntry>(this.apiUrl, {
    date: entry.date,
    itemName: entry.itemName,
    unit: entry.unit,                   // ✅
    documentReference: entry.documentReference,
    itemsValue: entry.itemsValue,
    storeType: entry.storeType,
    spendPermissionId: entry.spendPermissionId,
    spendPermission: null,
    status: entry.status
  });
}


  updateLedgerEntry(id: number, entry: LedgerEntry): Observable<LedgerEntry> {
  return this.http.put<LedgerEntry>(`${this.apiUrl}/${id}`, {
    id,
    date: entry.date,
    itemName: entry.itemName,
    unit: entry.unit,                   // ✅
    documentReference: entry.documentReference,
    itemsValue: entry.itemsValue,
    storeType: entry.storeType,
    spendPermissionId: entry.spendPermissionId,
    spendPermission: null,
    status: entry.status
  });
}
updateLedgerStatus(id: number, status: string): Observable<LedgerEntry> {
    return this.getLedgerEntryById(id).pipe(
      switchMap(entry => {
        const updatedEntry: LedgerEntry = { ...entry, status };
        return this.updateLedgerEntry(id, updatedEntry);
      })
    );
  }


}
