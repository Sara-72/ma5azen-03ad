import { Component, OnInit, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { LedgerService, LedgerEntry } from '../../../services/ledger.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ameen4',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule
  ],
  templateUrl: './ameen4.component.html',
  styleUrls: ['./ameen4.component.css']
})
export class Ameen4Component implements OnInit {
userName: string = '';
  displayName: string = '';


  private ledgerService = inject(LedgerService);

  // جميع البيانات المسترجعة
  ledgerEntries = signal<LedgerEntry[]>([]);

  // مصفوفات منفصلة لكل نوع مخزن
  consumerEntries = signal<LedgerEntry[]>([]);
  durableEntries = signal<LedgerEntry[]>([]);

  constructor() {}

  ngOnInit(): void {
     this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.loadLedgerEntries();
  }
 getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';

    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');
  }

  loadLedgerEntries() {
    this.ledgerService.getLedgerEntries().subscribe({
      next: (data: LedgerEntry[]) => {
        this.ledgerEntries.set(data);

        // فلترة البيانات لكل نوع
        this.consumerEntries.set(data.filter(e => e.storeType === 1)); // مستهلك = 1
        this.durableEntries.set(data.filter(e => e.storeType === 2));  // مستديم = 2
      },
      error: (err) => {
        console.error('Failed to load ledger entries', err);
        alert('فشل تحميل البيانات');
      }
    });
  }
}
