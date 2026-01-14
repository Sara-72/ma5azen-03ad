import { Component, OnInit, OnDestroy, inject, signal, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  FormsModule,
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormArray
} from '@angular/forms';

import { StoreKeeperStockService } from '../../../services/store-keeper-stock.service';
import { CentralStoreService } from '../../../services/central-store.service';
import { LedgerService } from '../../../services/ledger.service';

interface CategoryItemMap {
  [key: string]: string[];
}

@Component({
  selector: 'app-employee-ma5azen3',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './employee-ma5azen3.component.html',
  styleUrl: './employee-ma5azen3.component.css'
})
export class EmployeeMa5azen3Component implements OnInit, OnDestroy {

  filteredCategories: { [key: number]: string[] } = {};
  filteredItemsRows: { [key: number]: string[] } = {};
  filteredTypesRows: { [key: number]: string[] } = {};
  filteredUnitsRows: { [key: number]: string[] } = {};

  categoryItemMap: CategoryItemMap = {
    'أثاث مكتبي': ['مكتب مدير', 'كرسي دوار', 'خزانة ملفات'],
    'قرطاسية': ['أقلام حبر', 'أوراق A4', 'دفاتر ملاحظات'],
    'إلكترونيات': ['حاسوب محمول', 'طابعة ليزر', 'شاشة عرض'],
    'أدوات نظافة': ['مطهرات', 'مكانس', 'مناشف ورقية']
  };

  units: string[] = ['قطعة', 'متر', 'كيلو جرام', 'علبة', 'لفة', 'كرتونة'];
  categories: string[] = Object.keys(this.categoryItemMap);
  itemTypes: string[] = ['مستهلك', 'مستديم'];
  availableItemsByRow: string[][] = [];

  simpleForm!: FormGroup;
  isSubmitting = signal(false);
  userName = '';
  displayName = '';
  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;
  isManualItemMode: { [key: number]: boolean } = {};
  private subscriptions: Subscription[] = [];

  private fb = inject(FormBuilder);
  private stockService = inject(StoreKeeperStockService);
  private centralStoreService = inject(CentralStoreService);
  private ledgerService = inject(LedgerService);
  private eRef = inject(ElementRef);

  constructor() {
    this.simpleForm = this.fb.group({
      tableData: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);
    this.addRow();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  get tableData(): FormArray {
    return this.simpleForm.get('tableData') as FormArray;
  }

  private getFirstTwoNames(fullName: string): string {
    return fullName?.trim().split(/\s+/).slice(0, 2).join(' ') || '';
  }

  /* ===================== Dropdown Logic ===================== */

  filterCategories(query: string | null, index: number) {
    const q = (query || '').toLowerCase();
    this.filteredCategories[index] = this.categories.filter(c => c.toLowerCase().includes(q));
  }

  filterTypes(query: string | null, index: number) {
    const q = (query || '').trim();
    this.filteredTypesRows[index] = this.itemTypes.filter(t => t.includes(q));
  }

  filterUnits(query: string | null, index: number) {
    const q = (query || '').trim();
    this.filteredUnitsRows[index] = this.units.filter(u => u.includes(q));
  }

  filterAvailableItems(query: string | null, index: number) {
    if (this.isManualItemMode[index]) {
      this.filteredItemsRows[index] = [];
      return;
    }
    const q = (query || '').trim().toLowerCase();
    const items = this.availableItemsByRow[index] || [];
    this.filteredItemsRows[index] = items.filter(i => i.toLowerCase().includes(q));
  }

  selectCategory(val: string, index: number) {
    this.tableData.at(index).get('category')?.setValue(val);
    this.closeAllDropdowns();
  }

  selectItem(item: string, index: number) {
    this.tableData.at(index).get('item')?.setValue(item);
    this.closeAllDropdowns();
  }

  selectType(type: string, index: number) {
    this.tableData.at(index).get('itemType')?.setValue(type);
    this.closeAllDropdowns();
  }

  selectUnit(unit: string, index: number) {
    this.tableData.at(index).get('unit')?.setValue(unit);
    this.closeAllDropdowns();
  }

  selectOtherItem(index: number): void {
    this.isManualItemMode[index] = true;
    this.filteredItemsRows[index] = [];
    const row = this.tableData.at(index);
    row.get('item')?.setValue('', { emitEvent: false });
    row.get('item')?.updateValueAndValidity();

    setTimeout(() => {
      const inputs = document.querySelectorAll('td[data-label="الصنف"] input');
      (inputs[index] as HTMLInputElement)?.focus();
    }, 10);
  }

  resetManualMode(index: number): void {
    this.isManualItemMode[index] = false;
    const row = this.tableData.at(index);
    row.get('item')?.setValue('');
    row.get('item')?.updateValueAndValidity();
    // Trigger the dropdown to show again
    this.filterAvailableItems('', index);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns() {
    this.filteredCategories = {};
    this.filteredItemsRows = {};
    this.filteredTypesRows = {};
    this.filteredUnitsRows = {};
  }

  /* ===================== Validators & Rows ===================== */

  private itemExistsValidator(index: number) {
    return (control: any) => {
      if (!control.value || this.isManualItemMode[index]) return null;
      const items = this.availableItemsByRow[index] || [];
      return items.includes(control.value) ? null : { invalidItem: true };
    };
  }

  addRow(): void {
    const index = this.tableData.length;
    const row = this.fb.group({
      category: ['', [Validators.required]],
      item: ['', [Validators.required]],
      itemType: ['', Validators.required],
      unit: ['', [Validators.required]],
      count: ['', [Validators.required, Validators.min(1)]],
      entryDate: ['', Validators.required]
    });

    this.tableData.push(row);
    this.isManualItemMode[index] = false;
    this.addCategoryListener(row, index);
  }

  private addCategoryListener(rowGroup: FormGroup, index: number): void {
    rowGroup.get('item')?.setValidators([Validators.required, this.itemExistsValidator(index)]);
    const sub = rowGroup.get('category')?.valueChanges.subscribe(cat => {
      this.isManualItemMode[index] = false;
      this.availableItemsByRow[index] = this.categoryItemMap[cat] || [];
      rowGroup.get('item')?.reset('', { emitEvent: false });
    });
    if (sub) this.subscriptions.push(sub);
  }

  removeRow(): void {
    if (this.tableData.length > 1) {
      const idx = this.tableData.length - 1;
      this.tableData.removeAt(idx);
      delete this.isManualItemMode[idx];
    }
  }

  /* ===================== Submission ===================== */

  onSubmit(): void {
    if (this.simpleForm.invalid) {
      this.simpleForm.markAllAsTouched();
      this.showStatus('يرجى ملء كافة البيانات المطلوبة ⚠️', 'error');
      return;
    }
    this.isSubmitting.set(true);
    const rawRows = this.simpleForm.getRawValue().tableData;
    let completed = 0;
    const total = rawRows.length;

    rawRows.forEach((row: any) => {
        // Your Service Logic Here...
        this.handleComplete(++completed, total);
    });
  }

  private handleComplete(done: number, total: number) {
    if (done === total) {
      this.isSubmitting.set(false);
      this.showStatus('تم حفظ البيانات بنجاح ✅', 'success');
      this.simpleForm.reset();
      this.tableData.clear();
      this.isManualItemMode = {};
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
