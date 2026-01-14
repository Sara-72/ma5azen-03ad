import { Component, OnInit, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdditionsService } from '../../../services/additions.service';
import { StoreKeeperStockService, StockResponse } from '../../../services/store-keeper-stock.service';

@Component({
  selector: 'app-employee-ma5azen1',
  standalone: true, // Assuming standalone based on imports
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
  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;
  allStockItems: string[] = [];
  filteredItems: { [key: number]: string[] } = {};
  isFormSubmitted = signal(false);
  isSubmitting = signal(false);
  userName: string = '';
  displayName: string = '';
  inventoryLogForm!: FormGroup;

  private stockService = inject(StoreKeeperStockService);
  private additionsService = inject(AdditionsService);
  private fb = inject(FormBuilder);

  constructor() {
    this.inventoryLogForm = this.fb.group({
      tableData: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    // Get unique items from stock
    this.stockService.getAllStocks().subscribe((stocks: StockResponse[]) => {
      const uniqueItems = Array.from(new Set(stocks.map(s => s.itemName)));
      this.allStockItems = uniqueItems;
    });

    // Add first row
    this.addRow();
  }

  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  get tableData(): FormArray {
    return this.inventoryLogForm.get('tableData') as FormArray;
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

  filterItems(value: string, index: number): void {
    if (!value || value.trim() === '') {
      this.filteredItems[index] = [];
      return;
    }

    this.filteredItems[index] = this.allStockItems
      .filter(item => item.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 10);
  }

  selectItem(item: string, index: number): void {
    const row = this.tableData.at(index) as FormGroup;
    row.get('itemName')?.setValue(item);
    this.filteredItems[index] = [];
    row.get('itemName')?.updateValueAndValidity();
  }

  selectOther(index: number): void {
    const row = this.tableData.at(index) as FormGroup;
    const itemField = row.get('itemName');
    if (!itemField) return;

    itemField.setValue('');
    itemField.markAsTouched();
    this.filteredItems[index] = [];
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

  closeStatusMessage(): void {
    const wasSuccess = this.statusType === 'success';
    this.statusMessage = null;
    this.statusType = null;

    if (wasSuccess) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.tableData.clear();
    this.addRow();
    this.isSubmitting.set(false);
    this.isFormSubmitted.set(false); // Reset validation state
    this.inventoryLogForm.markAsPristine();
    this.inventoryLogForm.markAsUntouched();
  }

  onItemChange(index: number): void {
    const row = this.tableData.at(index) as FormGroup;
    row.get('itemName')?.updateValueAndValidity();
  }

  onSubmit(): void {
    this.isFormSubmitted.set(true);

    if (this.inventoryLogForm.invalid) {
      this.inventoryLogForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const additionsPayload = this.tableData.getRawValue();
    let total = additionsPayload.length;
    let completed = 0;
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
          completed++;
          checkFinish();
        },
        error: () => {
          hasError = true;
          completed++;
          checkFinish();
        }
      });
    });

    const checkFinish = () => {
      if (completed === total) {
        this.isSubmitting.set(false);
        if (hasError) {
          this.statusType = 'error';
          this.statusMessage = 'حدث خطأ أثناء حفظ بعض البيانات ❌';
        } else {
          this.statusType = 'success';
          this.statusMessage = 'تم حفظ جميع الإضافات بنجاح ✅';
        }
      }
    };
  }
}
