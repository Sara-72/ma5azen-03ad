import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { LedgerService, LedgerEntry } from '../../../services/ledger.service';
import { CentralStoreService, CentralStoreResponse } from '../../../services/central-store.service';

@Component({
  selector: 'app-ameen2',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './ameen2.component.html',
  styleUrls: ['./ameen2.component.css']
})
export class Ameen2Component implements OnInit {
  userName: string = '';
  displayName: string = '';
  assetTypes: string[] = ['مستهلك', 'مستديم'];
  availableItems: string[] = [];

  // --- MODAL STATUS STATE ---
  statusMessage: string | null = null;
  statusType: 'success' | 'error' = 'success';

  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);
  private ledgerService = inject(LedgerService);
  private centralStoreService = inject(CentralStoreService);

  constructor() {
    this.inventoryLogForm = this.fb.group({
      dates: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.userName.split(' ').slice(0, 2).join(' ');

    this.loadAvailableItems();
    this.loadPendingLedgerEntries();
  }

  // --- MODAL METHODS ---
  showStatus(message: string, type: 'success' | 'error') {
    this.statusMessage = message;
    this.statusType = type;
  }

  closeStatusMessage() {
    this.statusMessage = null;
  }

  get dates(): FormArray {
    return this.inventoryLogForm.get('dates') as FormArray;
  }

  getDateRows(dateIndex: number): FormArray {
    return this.dates.at(dateIndex).get('rows') as FormArray;
  }

  private createRowGroup(item: LedgerEntry): FormGroup {
    return this.fb.group({
      id: [item.id],
      itemName: [{ value: item.itemName, disabled: true }],
      documentReference: [{ value: item.documentReference, disabled: true }],
      addedValue: [{ value: item.itemsValue > 0 ? item.itemsValue : 0, disabled: true }],
      issuedValue: [{ value: item.itemsValue < 0 ? -item.itemsValue : 0, disabled: true }],
      transactionType: [{ value: item.itemsValue > 0 ? 'added' : 'issued', disabled: true }],
      unit: [{ value: item.unit, disabled: true }],
      storeType: [{ value: item.storeType, disabled: true }],
      status: [item.status]
    });
  }

  private createDateGroup(date: string, rows: LedgerEntry[]): FormGroup {
    const rowsArray = this.fb.array(rows.map(r => this.createRowGroup(r)));
    return this.fb.group({ date: [date], rows: rowsArray });
  }

  private loadAvailableItems() {
    this.centralStoreService.getAll().subscribe({
      next: (data: CentralStoreResponse[]) => {
        this.availableItems = Array.from(new Set(data.map(d => d.itemName))).sort();
      },
      error: err => console.error(err)
    });
  }

  private loadPendingLedgerEntries() {
    this.ledgerService.getLedgerEntries().subscribe({
      next: (entries) => {
        const pending = entries.filter(e => e.status?.trim().toLowerCase() === 'لم يؤكد');
        const groupedMap = new Map<string, LedgerEntry[]>();

        pending.forEach(e => {
          const dateKey = e.date ? e.date.split('T')[0] : 'غير محدد';
          if (!groupedMap.has(dateKey)) groupedMap.set(dateKey, []);
          groupedMap.get(dateKey)!.push(e);
        });

        this.dates.clear();
        groupedMap.forEach((rows, date) => {
          if (rows.length > 0) {
            this.dates.push(this.createDateGroup(date, rows));
          }
        });
      },
      error: err => console.error(err)
    });
  }

  getStoreTypeText(storeType: number): string {
    return this.assetTypes[storeType] || '';
  }

  onSubmit() {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);

    const allEntries: { id: number; status: string }[] = [];

    this.dates.controls.forEach(dateGroup => {
      const rows = dateGroup.get('rows') as FormArray;
      rows.controls.forEach(r => {
        const idValue = r.get('id')?.value;
        if (idValue) {
          allEntries.push({ id: idValue, status: 'تم التأكيد' });
        }
      });
    });

    if (allEntries.length === 0) {
      this.showStatus('لا توجد بيانات ليتم تأكيدها', 'error');
      this.isSubmitting.set(false);
      return;
    }

    let completed = 0;
    const total = allEntries.length;
    let hasError = false;

    allEntries.forEach(entry => {
      this.ledgerService.updateLedgerStatus(entry.id, entry.status).subscribe({
        next: () => {
          completed++;
          if (completed === total) {
            this.dates.clear();
            this.isSubmitting.set(false);
            if (!hasError) {
              this.showStatus('تم تأكيد جميع الدفاتر بنجاح', 'success');
            }
          }
        },
        error: err => {
          console.error(err);
          hasError = true;
          completed++;
          if (completed === total) {
            this.isSubmitting.set(false);
            this.showStatus('حدث خطأ أثناء تحديث بعض الدفاتر', 'error');
          }
        }
      });
    });
  }
}
