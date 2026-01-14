import { Component, OnInit, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

import { LedgerService, LedgerEntry } from '../../../services/ledger.service';

@Component({
  selector: 'app-ameen4',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, FormsModule],
  templateUrl: './ameen4.component.html',
  styleUrls: ['./ameen4.component.css']
})
export class Ameen4Component implements OnInit {

  userName = '';
  displayName = '';

  private ledgerService = inject(LedgerService);

  consumerEntries = signal<any[]>([]);
  durableEntries = signal<any[]>([]);

  // 🔹 البيانات الأصلية لكل جدول
  private allConsumerEntries: any[] = [];
  private allDurableEntries: any[] = [];

  selectedConsumerDate: string = '';
  selectedDurableDate: string = '';

  consumerDates: {value: string, display: string}[] = [];
  durableDates: {value: string, display: string}[] = [];

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadLedgerEntries();
  }

  getFirstTwoNames(fullName: string): string {
    return fullName
      ? fullName.trim().split(/\s+/).slice(0, 2).join(' ')
      : '';
  }

  private loadLedgerEntries() {
    this.ledgerService.getLedgerEntries().pipe(
      catchError(() => of([]))
    ).subscribe((ledgerEntries: LedgerEntry[]) => {

      const confirmedEntries = ledgerEntries.filter(entry => entry.status === 'تم التأكيد');

      const consumer: any[] = [];
      const durable: any[] = [];

      confirmedEntries
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(entry => {
          const row = {
            date: entry.date,
            itemName: entry.itemName,
            unit: entry.unit,
            source: entry.documentReference,
            quantity: entry.itemsValue,
            storeType: entry.storeType
          };

          entry.storeType === 0 ? consumer.push(row) : durable.push(row);
        });

      // 🔹 تخزين البيانات الأصلية
      this.allConsumerEntries = consumer;
      this.allDurableEntries = durable;

      this.consumerEntries.set(consumer);
      this.durableEntries.set(durable);

      // 🔹 توليد التواريخ الفريدة بصيغة yyyy-MM-dd للفلتر
      this.consumerDates = Array.from(new Set(consumer.map(c => this.formatDateValue(c.date))))
        .map(d => ({ value: d, display: this.formatDateDisplay(d) }));

      this.durableDates = Array.from(new Set(durable.map(d => this.formatDateValue(d.date))))
        .map(d => ({ value: d, display: this.formatDateDisplay(d) }));
    });
  }

  private formatDateValue(dateStr: string) {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`; // صيغة مناسبة للـ select
  }

  private formatDateDisplay(value: string) {
    const d = new Date(value);
    return d.toLocaleDateString('ar-EG'); // عرض التاريخ بشكل عربي
  }

  filterConsumerByDate() {
    if (!this.selectedConsumerDate) {
      this.consumerEntries.set([...this.allConsumerEntries]);
      return;
    }
    const filtered = this.allConsumerEntries.filter(entry =>
      this.formatDateValue(entry.date) === this.selectedConsumerDate
    );
    this.consumerEntries.set(filtered);
  }

  filterDurableByDate() {
    if (!this.selectedDurableDate) {
      this.durableEntries.set([...this.allDurableEntries]);
      return;
    }
    const filtered = this.allDurableEntries.filter(entry =>
      this.formatDateValue(entry.date) === this.selectedDurableDate
    );
    this.durableEntries.set(filtered);
  }
}
