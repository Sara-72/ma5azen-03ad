import { Component, OnInit, inject, signal, HostListener, ElementRef } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdditionsService } from '../../../services/additions.service';
import { StoreKeeperStockService, StockResponse } from '../../../services/store-keeper-stock.service';

@Component({
  selector: 'app-employee-ma5azen1',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './employee-ma5azen1.component.html',
  styleUrl: './employee-ma5azen1.component.css'
})
export class EmployeeMa5azen1Component implements OnInit {

  // Corrected property name to match HTML template
  isManualItemMode: { [key: number]: boolean } = {};

  filteredItems: { [key: number]: string[] } = {};
  filteredUnits: { [key: number]: string[] } = {};
  filteredConditions: { [key: number]: string[] } = {};

  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;
  allStockItems: string[] = [];

  isFormSubmitted = signal(false);
  isSubmitting = signal(false);
  userName: string = '';
  displayName: string = '';
  inventoryLogForm!: FormGroup;

  units = ['عدد', 'متر', 'كيلو', 'لتر', 'طقم', 'كرتونة'];
  conditions = ['مستهلك', 'مستديم'];

  private stockService = inject(StoreKeeperStockService);
  private additionsService = inject(AdditionsService);
  private fb = inject(FormBuilder);
  private eRef = inject(ElementRef);

  constructor() {
    this.inventoryLogForm = this.fb.group({
      tableData: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    this.stockService.getAllStocks().subscribe((stocks: StockResponse[]) => {
      const uniqueItems = Array.from(new Set(stocks.map(s => s.itemName)));
      this.allStockItems = uniqueItems;
    });

    this.addRow();
  }

  /* ===================== Selection & Manual Logic ===================== */

  selectOther(index: number): void {
    const row = this.tableData.at(index) as FormGroup;
    row.get('itemName')?.setValue('');

    this.isManualItemMode[index] = true; // Use the corrected name here
    this.filteredItems[index] = [];
    this.closeAllDropdowns();

    setTimeout(() => {
      const inputs = document.querySelectorAll('input[formControlName="itemName"]');
      (inputs[index] as HTMLInputElement)?.focus();
    }, 10);
  }

  // Support for the "X" button to go back to dropdown
  resetManualMode(index: number): void {
    this.isManualItemMode[index] = false;
    const row = this.tableData.at(index);
    row.get('itemName')?.setValue('');
    this.filterItems('', index);
  }

  filterItems(value: string, index: number): void {
    const searchTerm = (value || '').trim();

    if (searchTerm === '') {
      this.isManualItemMode[index] = false;
    }

    if (!this.isManualItemMode[index]) {
      this.filteredItems[index] = this.allStockItems
        .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 10);
    } else {
      this.filteredItems[index] = [];
    }
  }

  /* ===================== Dropdown Filters ===================== */

  filterUnits(query: string | null, index: number) {
    const q = query ? query.trim() : '';
    this.filteredUnits[index] = this.units.filter(u => u.includes(q));
  }

  filterConditions(query: string | null, index: number) {
    const q = query || '';
    this.filteredConditions[index] = this.conditions.filter(c => c.includes(q));
  }

  selectUnit(unit: string, index: number) {
    this.tableData.at(index).get('unit')?.setValue(unit);
    this.closeAllDropdowns();
  }

  selectCondition(condition: string, index: number) {
    this.tableData.at(index).get('itemCondition')?.setValue(condition);
    this.closeAllDropdowns();
  }

  

  selectItem(item: string, index: number): void {
    const row = this.tableData.at(index) as FormGroup;
    row.get('itemName')?.setValue(item);
    this.closeAllDropdowns();
  }

  /* ===================== Table Management ===================== */

  addRow(): void {
    const newIndex = this.tableData.length;
    this.tableData.push(this.createTableRowFormGroup());

    this.filteredItems[newIndex] = [];
    this.filteredUnits[newIndex] = [];
    this.isManualItemMode[newIndex] = false; // Corrected
    this.filteredConditions[newIndex] = [];
  }

  removeRow(): void {
    const lastIndex = this.tableData.length - 1;
    if (this.tableData.length > 1) {
      this.tableData.removeAt(lastIndex);
      delete this.filteredItems[lastIndex];
      delete this.filteredUnits[lastIndex];
      delete this.filteredConditions[lastIndex];
      delete this.isManualItemMode[lastIndex];
    } else {
      this.tableData.at(0).reset();
    }
  }

  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      additionNumber: [null, Validators.required],
      itemName: ['', [Validators.required, Validators.minLength(2)]],
      unit: ['', Validators.required],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitPrice: [null, [Validators.required, Validators.min(0.1)]],
      itemCondition: ['', Validators.required]
    });
  }

  /* ===================== Global Interactions ===================== */

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns() {
    this.filteredItems = {};
    this.filteredUnits = {};
    this.filteredConditions = {};
  }

  get tableData(): FormArray {
    return this.inventoryLogForm.get('tableData') as FormArray;
  }

  private getFirstTwoNames(fullName: string): string {
    return fullName?.trim().split(/\s+/).slice(0, 2).join(' ') || '';
  }

  /* ===================== Submission Logic ===================== */

  onSubmit(): void {
    this.isFormSubmitted.set(true);

    if (this.inventoryLogForm.invalid) {
      this.inventoryLogForm.markAllAsTouched();
      this.statusType = 'error';
      this.statusMessage = 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح ⚠️';
      return;
    }

    this.isSubmitting.set(true);
    const additionsPayload = this.tableData.getRawValue();
    let completedCount = 0;
    let hasError = false;

    additionsPayload.forEach((row: any) => {
      const payload = {
        itemName: row.itemName,
        unit: row.unit,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        totalValue: row.quantity * row.unitPrice,
        itemStatus: row.itemCondition
      };

      this.additionsService.addAddition(payload).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === additionsPayload.length) this.finalizeSubmit(hasError);
        },
        error: (err) => {
          hasError = true;
          completedCount++;
          if (completedCount === additionsPayload.length) this.finalizeSubmit(hasError);
        }
      });
    });
  }

  private finalizeSubmit(hasError: boolean) {
    this.isSubmitting.set(false);
    if (hasError) {
      this.statusType = 'error';
      this.statusMessage = 'حدث خطأ أثناء حفظ بعض البيانات ❌';
    } else {
      this.statusType = 'success';
      this.statusMessage = 'تم حفظ جميع البيانات بنجاح ✅';
    }
  }

  closeStatusMessage(): void {
    const wasSuccess = this.statusType === 'success';
    this.statusMessage = null;
    this.statusType = null;
    if (wasSuccess) this.resetForm();
  }

  resetForm(): void {
    this.tableData.clear();
    this.addRow();
    this.isSubmitting.set(false);
    this.isFormSubmitted.set(false);
    this.inventoryLogForm.markAsPristine();
    this.inventoryLogForm.markAsUntouched();
    this.isManualItemMode = {}; // Corrected
    this.closeAllDropdowns();
  }
}
