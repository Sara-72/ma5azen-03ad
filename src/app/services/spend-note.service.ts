import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpendNoteService {

  private baseApi = 'https://newwinventoryapi.runasp.net/api';

  constructor(private http: HttpClient) {}

  /** جلب كل SpendNotes */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseApi}/SpendNotes`);
  }

  /** تحديث SpendNote */
  updateSpendNoteStatus(noteId: number, updatedNote: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseApi}/SpendNotes/${noteId}`,
      updatedNote
    );
  }
}

