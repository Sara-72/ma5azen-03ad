import { Component, OnInit, OnDestroy, inject, signal, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, catchError, of } from 'rxjs';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { EmployeeStock, EmployeeStockService } from '../../../services/employee-stock.service';

interface CategoryItemMap {
  [key: string]: string[];
}

@Component({
  selector: 'app-employee-ma5azen3',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './employee-ma5azen3.component.html',
  styleUrls: ['./employee-ma5azen3.component.css']
})
export class EmployeeMa5azen3Component implements OnInit, OnDestroy {

  /* ===================== Static Data ===================== */
  categories: string[] = [];
  units: string[] = [];
  itemTypes: string[] = ['مستهلك', 'مستديم'];
  categoryItemMap: CategoryItemMap = {};
  availableItemsByRow: string[][] = [];

  // Manual input flags
  isManualCategory: { [key: number]: boolean } = {};
  isManualItem: { [key: number]: boolean } = {};
  isManualUnit: { [key: number]: boolean } = {};

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
  private eRef = inject(ElementRef);
  private stockService = inject(EmployeeStockService);

  constructor() {
    this.simpleForm = this.fb.group({
      tableData: this.fb.array([])
    });
  }

  /* ===================== Lifecycle ===================== */
  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);
    this.loadLookups();

    const firstRow = this.createTableRowFormGroup();
    this.tableData.push(firstRow);
    this.availableItemsByRow.push([]);
    this.addCategoryListener(firstRow, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  /* ===================== FormArray Getter ===================== */
  get tableData(): FormArray {
    return this.simpleForm.get('tableData') as FormArray;
  }

  /* ===================== Helper Methods ===================== */
  private getFirstTwoNames(fullName: string): string {
    return fullName?.trim().split(/\s+/).slice(0, 2).join(' ') || '';
  }

  private loadLookups(): void {
    this.stockService.getAll().subscribe(stocks => {
      // Categories & Units
      this.categories = Array.from(new Set(stocks.map(s => s.category)));
      this.units = Array.from(new Set(stocks.map(s => s.unit)));

      // Category -> Items
      this.categoryItemMap = {};
      stocks.forEach(s => {
        if (!this.categoryItemMap[s.category]) this.categoryItemMap[s.category] = [];
        if (!this.categoryItemMap[s.category].includes(s.itemName)) {
          this.categoryItemMap[s.category].push(s.itemName);
        }
      });

      // Add "أخرى"
      this.categories.push('أخرى');
      this.units.push('أخرى');
      Object.keys(this.categoryItemMap).forEach(cat => {
        if (!this.categoryItemMap[cat].includes('أخرى')) this.categoryItemMap[cat].push('أخرى');
      });
    });
  }

  private sameDay(d1: string, d2: string): boolean {
    return d1.split('T')[0] === d2.split('T')[0];
  }

  /* ===================== Form Row Creation ===================== */
  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      category: ['', [Validators.required, this.categoryExistsValidator()]],
      item: ['', [Validators.required]],
      itemType: ['', Validators.required],
      unit: ['', [Validators.required, this.unitExistsValidator()]],
      count: ['', [Validators.required, Validators.min(1)]],
      entryDate: ['', Validators.required]
    });
  }

  private addCategoryListener(rowGroup: FormGroup, index: number): void {
    rowGroup.get('item')?.setValidators([Validators.required, this.itemExistsValidator(index)]);
    const sub = rowGroup.get('category')?.valueChanges.subscribe(cat => {
      this.availableItemsByRow[index] = this.categoryItemMap[cat] || [];
      rowGroup.get('item')?.reset('', { emitEvent: false });
      rowGroup.get('category')?.updateValueAndValidity({ emitEvent: false });
      rowGroup.get('item')?.updateValueAndValidity({ emitEvent: false });
    });
    if (sub) this.subscriptions.push(sub);
  }

  /* ===================== Dropdown Handlers ===================== */
  onCategoryChange(value: string, index: number) {
  const row = this.tableData.at(index);

  if (value === 'أخرى') {
    this.isManualCategory[index] = true;
    
    // اجعل الحقل قابل للكتابة بأي قيمة
    row.get('category')?.clearValidators();
    row.get('category')?.updateValueAndValidity({ emitEvent: false });
    row.get('category')?.setValue(''); // اتركه فارغ ليكتب المستخدم

    // الصنف يصبح أيضًا قابل للكتابة
    this.availableItemsByRow[index] = [];
    this.isManualItem[index] = true;
    row.get('item')?.clearValidators();
    row.get('item')?.updateValueAndValidity({ emitEvent: false });
    row.get('item')?.setValue('');
  } else {
    this.isManualCategory[index] = false;
    row.get('category')?.setValidators([Validators.required, this.categoryExistsValidator()]);
    row.get('category')?.updateValueAndValidity({ emitEvent: false });

    // إعادة تحميل الأصناف للفئة المختارة
    this.availableItemsByRow[index] = [...(this.categoryItemMap[value] || []), 'أخرى'];
  }
}

  onItemChange(value: string, index: number) {
  const row = this.tableData.at(index);

  if (value === 'أخرى') {
    this.isManualItem[index] = true;

    // السماح لأي قيمة جديدة
    row.get('item')?.clearValidators();
    row.get('item')?.updateValueAndValidity({ emitEvent: false });
    row.get('item')?.setValue('');
  } else {
    this.isManualItem[index] = false;
    row.get('item')?.setValidators([Validators.required, this.itemExistsValidator(index)]);
    row.get('item')?.updateValueAndValidity();
  }
}


  onUnitChange(value: string, index: number) {
  const row = this.tableData.at(index);

  if (value === 'أخرى') {
    this.isManualUnit[index] = true;
    row.get('unit')?.clearValidators();
    row.get('unit')?.updateValueAndValidity({ emitEvent: false });
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
    row.get('category')?.setValidators([Validators.required, this.categoryExistsValidator()]);
    row.get('category')?.updateValueAndValidity();
    this.isManualItem[index] = false;
    this.availableItemsByRow[index] = [];
    row.get('item')?.setValue('');
  }

  resetItem(index: number) {
    this.isManualItem[index] = false;
    const row = this.tableData.at(index);
    row.get('item')?.setValue('');
    row.get('item')?.setValidators([Validators.required, this.itemExistsValidator(index)]);
    row.get('item')?.updateValueAndValidity();
  }

  resetUnit(index: number) {
    this.isManualUnit[index] = false;
    const row = this.tableData.at(index);
    row.get('unit')?.setValue('');
    row.get('unit')?.setValidators([Validators.required]);
    row.get('unit')?.updateValueAndValidity();
  }

  /* ===================== Row Operations ===================== */
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

  /* ===================== Submission ===================== */
  onSubmit(): void {
    if (this.simpleForm.invalid) {
      this.simpleForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    const rawRows = this.simpleForm.getRawValue().tableData;
    const groupedMap = new Map<string, any>();

    rawRows.forEach((row: { item: any; category: any; itemType: any; unit: any; entryDate: any; count: any; }) => {
      const key = [row.item, row.category, row.itemType, row.unit, row.entryDate].join('|');
      if (groupedMap.has(key)) groupedMap.get(key).count += Number(row.count);
      else groupedMap.set(key, { ...row, count: Number(row.count) });
    });

    const rows = Array.from(groupedMap.values());
    let completed = 0;
    const total = rows.length;

    rows.forEach(row => {
      const { item, category, itemType, unit, entryDate, count } = row;
      const newQuantity = Number(count);

      this.stockService.getAll().pipe(catchError(() => of([]))).subscribe(allStocks => {
        const match = allStocks.find(s =>
          s.category === category &&
          s.itemName === item &&
          s.unit === unit &&
          s.itemStatus === itemType &&
          this.sameDay(s.date, entryDate)
        );

        if (match) {
          this.stockService.update(match.id!, { ...match, quantity: match.quantity + newQuantity })
            .subscribe(() => this.handleComplete(++completed, total));
        } else {
          this.stockService.create({
            category,
            itemName: item,
            unit,
            itemStatus: itemType,
            quantity: newQuantity,
            date: entryDate
          }).subscribe(() => this.handleComplete(++completed, total));
        }
      });
    });
  }

  private handleComplete(done: number, total: number) {
    if (done === total) {
      this.isSubmitting.set(false);
      this.showStatus('تم حفظ البيانات بنجاح ✅', 'success');
      this.simpleForm.reset();
      this.tableData.clear();
      this.availableItemsByRow = [];
      this.subscriptions.forEach(s => s.unsubscribe());
      this.subscriptions = [];
      this.addRow();
    }
  }

  /* ===================== Status ===================== */
  showStatus(msg: string, type: 'success' | 'error') {
    this.statusMessage = msg;
    this.statusType = type;
  }

  closeStatusMessage() {
    this.statusMessage = null;
    this.statusType = null;
  }

  /* ===================== Click Outside ===================== */
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.filteredCategories = {};
      this.filteredItemsRows = {};
      this.filteredTypesRows = {};
      this.filteredUnitsRows = {};
    }
  }

  /* ===================== Filtered Dropdowns ===================== */
  filteredCategories: { [key: number]: string[] } = {};
  filteredItemsRows: { [key: number]: string[] } = {};
  filteredTypesRows: { [key: number]: string[] } = {};
  filteredUnitsRows: { [key: number]: string[] } = {};

  /* ===================== Validators ===================== */
  private categoryExistsValidator() {
    return (control: any) => {
      const val = control.value;
      if (!val) return null;
      return this.categories.includes(val) ? null : { invalidCategory: true };
    };
  }

  private itemExistsValidator(index: number) {
    return (control: any) => {
      const val = control.value;
      if (!val) return null;
      const items = this.availableItemsByRow[index] || [];
      return items.includes(val) ? null : { invalidItem: true };
    };
  }

  private unitExistsValidator() {
    return () => null;
  }
}
