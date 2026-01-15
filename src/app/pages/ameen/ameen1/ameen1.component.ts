import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { catchError, of, Subscription } from 'rxjs';
import {
  FormsModule,
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';

import {
  StoreKeeperStockService
} from '../../../services/store-keeper-stock.service';
import { CentralStoreService } from '../../../services/central-store.service';
import { LedgerService } from '../../../services/ledger.service';

interface CategoryItemMap {
  [key: string]: string[];
}

@Component({
  selector: 'app-ameen1',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './ameen1.component.html',
  styleUrl: './ameen1.component.css'
})
export class Ameen1Component implements OnInit, OnDestroy {

  /* ===================== Static Data ===================== */
  categoryItemMap: CategoryItemMap = {};
categories: string[] = [];
units: string[] = [];

availableItemsByRow: string[][] = [];

// Manual mode flags
isManualCategory: { [key: number]: boolean } = {};
isManualItem: { [key: number]: boolean } = {};
isManualUnit: { [key: number]: boolean } = {};

  itemTypes: string[] = ['مستهلك', 'مستديم'];
  //availableItemsByRow: string[][] = [];

  /* ===================== State ===================== */
  simpleForm!: FormGroup;
  isSubmitting = signal(false);

  userName = '';
  displayName = '';

  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;

  private subscriptions: Subscription[] = [];

  /* ===================== DI ===================== */
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private stockService = inject(StoreKeeperStockService);
  private centralStoreService = inject(CentralStoreService);
  private ledgerService = inject(LedgerService);


  constructor() {
    this.simpleForm = this.fb.group({
      tableData: this.fb.array([])
    });
  }

  /* ===================== Lifecycle ===================== */
  ngOnInit(): void {
  this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);

  this.loadLookupsFromStock();

  const firstRow = this.createTableRowFormGroup();
  this.tableData.push(firstRow);
  this.availableItemsByRow.push([]);
  this.addCategoryListener(firstRow, 0);
}
private loadLookupsFromStock(): void {
  this.stockService.getAllStocks().subscribe(stocks => {

    // Categories
    this.categories = Array.from(
      new Set(stocks.map(s => s.category))
    );

    // Units
    this.units = Array.from(
      new Set(stocks.map(s => s.unit))
    );

    // Category -> Items map
    this.categoryItemMap = {};
    stocks.forEach(s => {
  if (!this.categoryItemMap[s.category]) {
    this.categoryItemMap[s.category] = [];
  }
  if (!this.categoryItemMap[s.category].includes(s.itemName)) {
    this.categoryItemMap[s.category].push(s.itemName);
  }
});

// أضف "أخرى" لكل فئة
Object.keys(this.categoryItemMap).forEach(cat => {
  if (!this.categoryItemMap[cat].includes('أخرى')) {
    this.categoryItemMap[cat].push('أخرى');
  }
});


    // Add "Other"
    this.categories.push('أخرى');
    this.units.push('أخرى');
  });
}
onCategoryChange(value: string, index: number) {
  const row = this.tableData.at(index);

  if (value === 'أخرى') {
    this.isManualCategory[index] = true;

    // 🔥 أوقف validator الفئة
    row.get('category')?.clearValidators();
    row.get('category')?.updateValueAndValidity();

    // Reset item logic
    this.availableItemsByRow[index] = [];
    this.isManualItem[index] = true;
    row.get('item')?.clearValidators();
    row.get('item')?.updateValueAndValidity();

    row.get('category')?.setValue('');
  } else {
    this.isManualCategory[index] = false;

    // 🔥 رجّع validator
    row.get('category')?.setValidators([
      Validators.required,
      this.categoryExistsValidator()
    ]);

    this.availableItemsByRow[index] = [
      ...(this.categoryItemMap[value] || []),
      'أخرى'
    ];

    row.get('category')?.updateValueAndValidity();
  }
}

onItemChange(value: string, index: number) {
  const row = this.tableData.at(index);

  if (value === 'أخرى') {
    this.isManualItem[index] = true;

    // السماح بإدخال أي صنف جديد
    row.get('item')?.clearValidators();
    row.get('item')?.updateValueAndValidity();

    row.get('item')?.setValue('');
  } else {
    this.isManualItem[index] = false;

    row.get('item')?.setValidators([
      Validators.required,
      this.itemExistsValidator(index) // للتحقق من الصنف ضمن الفئة إذا لم يكن "أخرى"
    ]);
    row.get('item')?.updateValueAndValidity();
  }
}


onUnitChange(value: string, index: number) {
  const row = this.tableData.at(index);

  if (value === 'أخرى') {
    this.isManualUnit[index] = true;

    // 🔥 اسمحي بأي وحدة
    row.get('unit')?.clearValidators();
    row.get('unit')?.updateValueAndValidity();

    row.get('unit')?.setValue('');
  } else {
    this.isManualUnit[index] = false;

    row.get('unit')?.setValidators([Validators.required]);
    row.get('unit')?.updateValueAndValidity();
  }
}
resetCategory(index: number) {
  this.isManualCategory[index] = false;

  const row = this.tableData.at(index);
  row.get('category')?.setValue('');

  // رجّعي validators
  row.get('category')?.setValidators([
    Validators.required,
    this.categoryExistsValidator()
  ]);
  row.get('category')?.updateValueAndValidity();

  // Reset item
  this.isManualItem[index] = false;
  this.availableItemsByRow[index] = [];
  row.get('item')?.setValue('');
}

resetItem(index: number) {
  this.isManualItem[index] = false;

  const row = this.tableData.at(index);
  row.get('item')?.setValue('');

  row.get('item')?.setValidators([
    Validators.required,
    this.itemExistsValidator(index)
  ]);
  row.get('item')?.updateValueAndValidity();
}

resetUnit(index: number) {
  this.isManualUnit[index] = false;

  const row = this.tableData.at(index);
  row.get('unit')?.setValue('');

  row.get('unit')?.setValidators([Validators.required]);
  row.get('unit')?.updateValueAndValidity();
}




  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /* ===================== Helpers ===================== */
  get tableData(): FormArray {
    return this.simpleForm.get('tableData') as FormArray;
  }

  private getFirstTwoNames(fullName: string): string {
    return fullName?.trim().split(/\s+/).slice(0, 2).join(' ') || '';
  }

  private sameDay(d1: string, d2: string): boolean {
  const day1 = d1.split('T')[0];
  const day2 = d2.split('T')[0];
  return day1 === day2;
}
private mapStoreType(type: string): number {
  return type === 'مستهلك' ? 0 : 1;
}


private unitExistsValidator() {
  return () => null; // السماح بأي وحدة
}



private createTableRowFormGroup(): FormGroup {
  return this.fb.group({
    category: ['', [Validators.required, this.categoryExistsValidator()]],
    item: ['', [Validators.required]],
    itemType: ['', Validators.required],
    // ADDED: unitExistsValidator here
    unit: ['', [Validators.required, this.unitExistsValidator()]],
    count: ['', [Validators.required, Validators.min(1)]],
    entryDate: ['', Validators.required]
  });
}




private addCategoryListener(rowGroup: FormGroup, index: number): void {
  rowGroup.get('item')?.setValidators([Validators.required, this.itemExistsValidator(index)]);

  const sub = rowGroup.get('category')?.valueChanges.subscribe(cat => {
    this.availableItemsByRow[index] = this.categoryItemMap[cat] || [];

    // Resetting the item ensures the user must pick a new item
    // that matches the new category's list.
    rowGroup.get('item')?.reset('', { emitEvent: false });

    // Force the validators to run immediately
    rowGroup.get('category')?.updateValueAndValidity({ emitEvent: false });
    rowGroup.get('item')?.updateValueAndValidity({ emitEvent: false });
  });

  if (sub) this.subscriptions.push(sub);
}
  /* ===================== Rows ===================== */
  addRow(): void {
    const row = this.createTableRowFormGroup();
    const index = this.tableData.length;
    this.tableData.push(row);
    this.availableItemsByRow.push([]);
    this.addCategoryListener(row, index);
  }

  removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.removeAt(this.tableData.length - 1);
      this.availableItemsByRow.pop();
      this.subscriptions.pop()?.unsubscribe();
    } else {
      this.tableData.at(0).reset();
    }
  }

  /* ===================== Submit ===================== */
  onSubmit(): void {
  if (this.simpleForm.invalid) {
    this.simpleForm.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);

  /* ========== STEP 1: GROUP FORM ROWS ========== */
  const rawRows = this.simpleForm.getRawValue().tableData;

  const groupedMap = new Map<string, any>();

  rawRows.forEach((row: any) => {
    const key = [
      row.item,
      row.category,
      row.itemType,
      row.unit,
      row.entryDate
    ].join('|');

    if (groupedMap.has(key)) {
      groupedMap.get(key).count += Number(row.count);
    } else {
      groupedMap.set(key, {
        ...row,
        count: Number(row.count)
      });
    }
  });

  const rows = Array.from(groupedMap.values());

  /* ========== STEP 2: SAVE TO DATABASE ========== */
  let completed = 0;
  const total = rows.length;

  rows.forEach((row: any) => {
    const { item, category, itemType, unit, entryDate, count } = row;
    const newQuantity = Number(count);

    /* ========== StoreKeeperStocks ========== */
    this.stockService.getAllStocks().pipe(
      catchError(() => of([]))
    ).subscribe(storeStocks => {

      const existingStore = storeStocks.find((s: any) =>
        s.itemName === item &&
        s.category === category &&
        s.storeType === itemType &&
        s.unit === unit &&
        this.sameDay(s.date, entryDate)
      );

      const afterStore = () => {
  this.centralStoreService.getAll().pipe(
    catchError(() => of([]))
  ).subscribe(centralStocks => {

    const existingCentral = centralStocks.find((c: any) =>
      c.itemName === item &&
      c.category === category &&
      c.storeType === itemType &&
      c.unit === unit &&
      this.sameDay(c.date, entryDate)
    );

    const afterCentral = () => {
      /* ========== LedgerEntries (وارد) ========== */
      this.ledgerService.getLedgerEntries().pipe(
  catchError(() => of([]))
).subscribe(ledgerEntries => {

  const existingLedger = ledgerEntries.find((l: any) =>
    l.itemName === item &&
    l.unit === unit &&
    l.storeType === this.mapStoreType(itemType) &&
    l.documentReference === 'وارد من ' &&
    this.sameDay(l.date, entryDate)
  );

  if (existingLedger) {
    // ✅ UPDATE (تجميع)
    this.ledgerService.updateLedgerEntry(existingLedger.id!, {
      ...existingLedger,
      itemsValue: existingLedger.itemsValue + newQuantity
    }).subscribe(() => {
      this.handleComplete(++completed, total);
    });

  } else {
    // ➕ ADD جديد
    this.ledgerService.addLedgerEntry({
      date: entryDate,
      itemName: item,
      unit: unit,
      status: ' لم يؤكد',
      documentReference: 'وارد من ',
      itemsValue: newQuantity,
      storeType: this.mapStoreType(itemType),
      spendPermissionId: null
    }).subscribe(() => {
      this.handleComplete(++completed, total);
    });
  }

});

    };

    if (existingCentral) {
      this.centralStoreService.update(existingCentral.id, {
        itemName: item,
        category,
        storeType: itemType,
        unit,
        quantity: existingCentral.quantity + newQuantity,
        date: entryDate,
        storeKeeperSignature: this.displayName,
        ledgerEntriesStatus: 'تم التسجيل'
      }).subscribe(afterCentral);
    } else {
      this.centralStoreService.add({
        itemName: item,
        category,
        storeType: itemType,
        unit,
        quantity: newQuantity,
        date: entryDate,
        storeKeeperSignature: this.displayName,
        ledgerEntriesStatus: 'تم التسجيل'
      }).subscribe(afterCentral);
    }
  });
};


      if (existingStore) {
        this.stockService.updateStock(existingStore.id, {
          stock: {
            itemName: item,
            category,
            storeType: itemType,
            unit,
            quantity: existingStore.quantity + newQuantity,
            date: entryDate,
            storeKeeperSignature: this.displayName
          }
        }).subscribe(afterStore);
      } else {
        this.stockService.addStock({
          stock: {
            itemName: item,
            category,
            storeType: itemType,
            unit,
            quantity: newQuantity,
            date: entryDate,
            storeKeeperSignature: this.displayName
          }
        }).subscribe(afterStore);
      }
    });
  });
}


  /* ===================== UI ===================== */
private handleComplete(done: number, total: number) {
  if (done === total) {
    this.isSubmitting.set(false);
    this.showStatus('تم حفظ البيانات بنجاح وتحديث أرصدة المخازن', 'success');

    // Reset Data
    this.simpleForm.reset();
    this.tableData.clear();
    this.availableItemsByRow = []; // Clear the suggestions array
    this.subscriptions.forEach(s => s.unsubscribe()); // Clear old listeners
    this.subscriptions = [];

    this.addRow(); // Start fresh
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


  isSidebarOpen = false;



  trackCategoryChanges(index: number) {
  const row = this.tableData.at(index);
  row.get('category')?.valueChanges.subscribe(value => {
    // Optional: Clear item when category changes
    row.get('item')?.setValue('');
    // Trigger your logic to populate availableItemsByRow[index] based on 'value'
  });
}



/* ===================== Custom Validators ===================== */

// Validates that the category exists in your keys
private categoryExistsValidator() {
  return (control: any) => {
    const value = control.value;
    if (!value) return null; // Let 'required' validator handle empty
    return this.categories.includes(value) ? null : { invalidCategory: true };
  };
}

// Validates that the item exists for the currently selected category
private itemExistsValidator(index: number) {
  return (control: any) => {
    const value = control.value;
    if (!value) return null;

    // Check if the value is in the currently available items for this specific row
    const items = this.availableItemsByRow[index] || [];
    return items.includes(value) ? null : { invalidItem: true };
  };
}

}
