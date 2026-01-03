import { Component ,OnInit, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { catchError, lastValueFrom, of } from 'rxjs';
import { LedgerService, LedgerEntry } from '../../../services/ledger.service';
import { CentralStoreService, CentralStoreResponse } from '../../../services/central-store.service';

@Component({
  selector: 'app-ameen2',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './ameen2.component.html',
  styleUrls: ['./ameen2.component.css']
})
export class Ameen2Component implements OnInit {

  userName: string = '';
  displayName: string = '';
  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;
  simpleForm!: FormGroup;


  assetTypes: string[] = ['مستهلك', 'مستديم'];
  sourceDestinationOptions: string[] = ['وارد من', 'منصرف الى'];

  // ✅ هنا قائمة الأصناف ستأتي من المخزن المركزي
  availableItems: string[] = [];

  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);
  private ledgerService = inject(LedgerService);
  private centralStoreService = inject(CentralStoreService);

  constructor() {
    this.inventoryLogForm = this.fb.group({
      assetType: ['', Validators.required],
      tableData: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    // جلب الأصناف من المخزن المركزي
    this.loadAvailableItems();

    // Start with one empty row
    this.tableData.push(this.createTableRowFormGroup());
  }

  getFirstTwoNames(fullName: string): string {
    return fullName ? fullName.trim().split(/\s+/).slice(0, 2).join(' ') : '';
  }

  private loadAvailableItems(): void {
  this.centralStoreService.getAll().subscribe({
    next: (data: CentralStoreResponse[]) => {
      // استخدم Set لإزالة التكرارات
      const uniqueItems = new Set<string>();
      data.forEach(d => uniqueItems.add(d.itemName));
      this.availableItems = Array.from(uniqueItems).sort(); // optional: ترتيب الأبجدي
    },
    error: (err) => {
      console.error('Failed to load central store items:', err);
    }
  });
}


  // --- FormArray Helper ---
  get tableData(): FormArray {
    return this.inventoryLogForm.get('tableData') as FormArray;
  }

  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      date: ['', Validators.required],
      itemName: ['', Validators.required],
      sourceOrDestination: ['', Validators.required],
      addedValue: [''],
      issuedValue: [''],
      transactionType: ['added', Validators.required] // 'added' = وارد | 'issued' = منصرف
    });
  }
  private sameDay(d1: string, d2: string): boolean {
  return d1.split('T')[0] === d2.split('T')[0];
}


  addRow(): void {
    this.tableData.push(this.createTableRowFormGroup());
  }

  removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.removeAt(this.tableData.length - 1);
    } else {
      this.tableData.at(0).reset();
    }
  }

 onSubmit(): void {
  if (this.inventoryLogForm.invalid) {
    this.inventoryLogForm.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);

  const assetTypeIndex =
    this.assetTypes.indexOf(this.inventoryLogForm.value.assetType);

  /* ========== STEP 1: GROUP FORM ROWS ========== */
  const rawRows = this.inventoryLogForm.getRawValue().tableData;

  const groupedMap = new Map<string, any>();

  rawRows.forEach((row: any) => {
    const value =
      row.transactionType === 'added'
        ? Number(row.addedValue || 0)
        : -(Number(row.issuedValue || 0));

    const key = [
      row.date,
      row.itemName,
      assetTypeIndex,
      row.sourceOrDestination
    ].join('|');

    if (groupedMap.has(key)) {
      groupedMap.get(key).itemsValue += value;
    } else {
      groupedMap.set(key, {
        date: row.date,
        itemName: row.itemName,
        documentReference: row.sourceOrDestination,
        storeType: assetTypeIndex,
        itemsValue: value
      });
    }
  });

  const rows = Array.from(groupedMap.values());

  /* ========== STEP 2: SAVE TO DATABASE ========== */
  let completed = 0;
  const total = rows.length;

  this.ledgerService.getLedgerEntries().pipe(
    catchError(() => of([]))
  ).subscribe(existingEntries => {

    rows.forEach(row => {

      const existing = existingEntries.find(e =>
        e.itemName === row.itemName &&
        e.documentReference === row.documentReference &&
        e.storeType === row.storeType &&
        this.sameDay(e.date, row.date)
      );

      /* ===== UPDATE ===== */
      if (existing) {
        this.ledgerService.updateLedgerEntry(existing.id!, {
          ...existing,
          itemsValue: existing.itemsValue + row.itemsValue
        }).subscribe(() => {
          this.handleComplete(++completed, total);
        });

      /* ===== ADD ===== */
      } else {
        this.ledgerService.addLedgerEntry({
          date: new Date(row.date).toISOString(),
          itemName: row.itemName,
          documentReference: row.documentReference,
          itemsValue: row.itemsValue,
          storeType: row.storeType,
          spendPermissionId: null,
          spendPermission: null
        }).subscribe(() => {
          this.handleComplete(++completed, total);
        });
      }
    });
  });
}
private handleComplete(done: number, total: number) {
  if (done === total) {
    this.isSubmitting.set(false);
    alert('تم حفظ البيانات بنجاح');
    this.showStatus('تم حفظ البيانات بنجاح', 'success');
    this.simpleForm.reset();
    this.tableData.clear();
    this.addRow();
  }
}
 showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage = msg;
    this.statusType = type;
  }

  closeStatusMessage() {
    this.statusMessage = null;
    this.statusType = null;
  }

}
