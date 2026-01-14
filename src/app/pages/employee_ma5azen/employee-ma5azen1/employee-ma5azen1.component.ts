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





isManualMode: { [key: number]: boolean } = {};
  // Consistent naming for filter arrays
  filteredItems: { [key: number]: string[] } = {};
  filteredUnits: { [key: number]: string[] } = {}; // Changed from filteredUnitsRows to match addRow logic
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

  /* ===================== Dropdown Logic ===================== */


selectOther(index: number): void {
  const row = this.tableData.at(index) as FormGroup;
  row.get('itemName')?.setValue('');

  this.isManualMode[index] = true; // This triggers the !isManualMode[i] check in HTML

  // Clear the array for this specific row so the length becomes 0
  this.filteredItems[index] = [];

  // This ensures all other dropdowns in the table also close
  this.closeAllDropdowns();

  setTimeout(() => {
    const inputs = document.querySelectorAll('input[formControlName="itemName"]');
    (inputs[index] as HTMLInputElement)?.focus();
  }, 10);
}

  filterUnits(query: string | null, index: number) {
    const q = query ? query.trim() : '';
    // Fix: Using the same variable name initialized in addRow
    this.filteredUnits[index] = this.units.filter(u => u.includes(q));
  }

  filterConditions(query: string | null, index: number) {
    const q = query || '';
    this.filteredConditions[index] = this.conditions.filter(c => c.includes(q));
  }

  filterItems(value: string, index: number): void {
  const searchTerm = (value || '').trim();

  // If user clears the input, allow the dropdown logic to reset
  if (searchTerm === '') {
    this.isManualMode[index] = false;
  }

  // Only filter if we aren't in manual mode OR if the input is empty
  if (!this.isManualMode[index]) {
    this.filteredItems[index] = this.allStockItems
      .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10);
  } else {
    // If in manual mode, keep the list empty
    this.filteredItems[index] = [];
  }
}

  /* ===================== Selection Logic ===================== */

  selectUnit(unit: string, index: number) {
    this.tableData.at(index).get('unit')?.setValue(unit);
    this.closeAllDropdowns();
  }

  selectCondition(condition: string, index: number) {
    this.tableData.at(index).get('itemCondition')?.setValue(condition);
    this.closeAllDropdowns();
  }

 // ✅ Handle choosing an item from the existing stock list
selectItem(item: string, index: number): void {
  const row = this.tableData.at(index) as FormGroup;
  row.get('itemName')?.setValue(item);
  row.get('itemName')?.markAsDirty();
  row.get('itemName')?.updateValueAndValidity();
  this.closeAllDropdowns(); // Closes the list immediately
}



  /* ===================== Table Management ===================== */

  addRow(): void {
    const newIndex = this.tableData.length;
    this.tableData.push(this.createTableRowFormGroup());

    // Initialize the objects so they are ready for the UI
    this.filteredItems[newIndex] = [];
    this.filteredUnits[newIndex] = [];
    this.isManualMode[newIndex] = false;
    this.filteredConditions[newIndex] = [];
  }

  removeRow(): void {
    const lastIndex = this.tableData.length - 1;
    if (this.tableData.length > 1) {
      this.tableData.removeAt(lastIndex);
      delete this.filteredItems[lastIndex];
      delete this.filteredUnits[lastIndex];
      delete this.filteredConditions[lastIndex];
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
      value: [null],
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
  // 1. Reset all filter arrays to empty
  this.filteredItems = {};
  this.filteredUnits = {};
  this.filteredConditions = {};

  // 2. Optional: If you want clicking outside to also reset "Manual Mode"
  // so the dropdowns show up again next time you click the input:
  // this.isManualMode = {};
}

  // ... (Other helper methods remain the same: getFirstTwoNames, get tableData, etc.)
  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  get tableData(): FormArray {
    return this.inventoryLogForm.get('tableData') as FormArray;
  }

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
        if (completedCount === additionsPayload.length) {
          this.finalizeSubmit(hasError);
        }
      },
      error: (err) => {
        console.error('Submit Error:', err);
        hasError = true;
        completedCount++;
        if (completedCount === additionsPayload.length) {
          this.finalizeSubmit(hasError);
        }
      }
    });
  });
}

private finalizeSubmit(hasError: boolean) {
  this.isSubmitting.set(false);
  if (hasError) {
    this.statusType = 'error';
    this.statusMessage = 'حدث خطأ أثناء حفظ بعض البيانات، يرجى المحاولة مرة أخرى ❌';
  } else {
    this.statusType = 'success';
    this.statusMessage = 'تم حفظ جميع البيانات في دفتر المالية بنجاح ✅';
  }
}

  private handleFinish(hasError: boolean) {
    this.isSubmitting.set(false);
    if (hasError) {
      this.statusType = 'error';
      this.statusMessage = 'حدث خطأ أثناء حفظ بعض البيانات ❌';
    } else {
      this.statusType = 'success';
      this.statusMessage = 'تم حفظ جميع الإضافات بنجاح ✅';
    }
  }


  // ✅ Close the modal and reset form if successful
closeStatusMessage(): void {
  const wasSuccess = this.statusType === 'success';

  // Clear the message to hide the modal
  this.statusMessage = null;
  this.statusType = null;

  // If the operation was successful, we usually want to clear the table for new entries
  if (wasSuccess) {
    this.resetForm();
  }
}

// ✅ Helper to reset form state completely
resetForm(): void {
  this.tableData.clear();
  this.addRow(); // Start with one fresh row

  this.isSubmitting.set(false);
  this.isFormSubmitted.set(false);

  // Reset Angular form states
  this.inventoryLogForm.markAsPristine();
  this.inventoryLogForm.markAsUntouched();

  // Clear any leftover dropdown data
  this.closeAllDropdowns();
}
}

