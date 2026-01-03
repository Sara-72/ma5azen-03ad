import { Component, OnInit, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { forkJoin, of, lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CentralStoreService } from '../../../services/central-store.service';
import { SpendPermissionService } from '../../../services/spend-permission.service';
import { LedgerService, LedgerEntry } from '../../../services/ledger.service';

@Component({
  selector: 'app-ameen2',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './ameen4.component.html',
  styleUrls: ['./ameen4.component.css']
})
export class Ameen4Component implements OnInit {

  userName = '';
  displayName = '';

  private centralStoreService = inject(CentralStoreService);
  private spendService = inject(SpendPermissionService);
  private ledgerService = inject(LedgerService);

  consumerEntries = signal<any[]>([]);
  durableEntries = signal<any[]>([]);

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    // 1️⃣ تحميل كل الدفاتر من LedgerEntries أولًا
    this.loadLedgerEntries();

    // 2️⃣ جلب أي جديد من المخازن وSpendPermissions وحفظه في LedgerEntries
    this.updateLedgerFromStores();
  }

  getFirstTwoNames(fullName: string): string {
    return fullName ? fullName.trim().split(/\s+/).slice(0, 2).join(' ') : '';
  }

  private loadLedgerEntries() {
    this.ledgerService.getLedgerEntries().pipe(
      catchError(() => of([]))
    ).subscribe((ledgerEntries: LedgerEntry[]) => {
      const consumer: any[] = [];
      const durable: any[] = [];

      ledgerEntries
  .sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  })
  .forEach(entry => {

    const row = {
      date: entry.date ? new Date(entry.date) : new Date(),
      itemName: entry.itemName,
      category: entry.storeType === 0 ? 'مستهلك' : 'مستديم',
      quantity: entry.itemsValue,
      source: entry.documentReference
    };

    entry.storeType === 0 ? consumer.push(row) : durable.push(row);
  });


      this.consumerEntries.set(consumer);
      this.durableEntries.set(durable);

      localStorage.setItem('consumerEntries', JSON.stringify(consumer));
      localStorage.setItem('durableEntries', JSON.stringify(durable));
    });
  }

  private updateLedgerFromStores() {
    forkJoin({
      central: this.centralStoreService.getAll().pipe(catchError(() => of([]))),
      spend: this.spendService.getAll().pipe(catchError(() => of([])))
    }).subscribe(async ({ central, spend }) => {

      const requests: Promise<any>[] = [];

      // 1️⃣ Central Store
      central.forEach(entry => {
        const e = entry as any; // type assertion لتجنب خطأ TS

        if (e.ledgerEntriesStatus !== 'لم يسجل') return;

        const ledgerEntry: LedgerEntry = {
          date: e.date || new Date(),
          itemName: e.itemName,
          documentReference: 'وارد من',
          itemsValue: e.quantity || 0,
          storeType: e.storeType === 'مستهلك' ? 0 : 1,
          spendPermissionId: null,
          spendPermission: null
        };

        requests.push(
          lastValueFrom(this.ledgerService.addLedgerEntry(ledgerEntry))
            .then(() => lastValueFrom(this.centralStoreService.update(e.id, {
              ...e,
              ledgerEntriesStatus: 'تم التسجيل'
            })))
        );
      });

      // 2️⃣ Spend Permissions
      spend.forEach(sp => {
        const s = sp as any;

        if (s.ledgerEntriesStatus !== 'لم يسجل' ||
            (s.permissionStatus !== 'تم الصرف' && s.permissionStatus !== 'تم الاسترجاع')) return;

        const sourceText = s.permissionStatus === 'تم الصرف' ? 'منصرف إلى' : 'وارد من';
        const storeHouse = (s.storeHouse || '').toLowerCase();

        const ledgerEntry: LedgerEntry = {
          date: s.issueDate || new Date(),
          itemName: s.itemName,
          documentReference: sourceText,
          itemsValue: s.issuedQuantity || 0,
          storeType: storeHouse.includes('مستهلك') ? 0 : 1,
          spendPermissionId: s.id,
          spendPermission: null
        };

        requests.push(
          lastValueFrom(this.ledgerService.addLedgerEntry(ledgerEntry))
            .then(() => lastValueFrom(this.spendService.update(s.id, {
              ...s,
              ledgerEntriesStatus: 'تم التسجيل'
            })))
        );
      });

      // بعد حفظ كل السجلات الجديدة، نعيد تحميل الدفاتر من LedgerEntries
      await Promise.all(requests);
      this.loadLedgerEntries();
    });
  }
}
