import { Component, OnInit, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdditionsService } from '../../../services/additions.service';
import { StoreKeeperStockService, StockResponse } from '../../../services/store-keeper-stock.service';
@Component({
  selector: 'app-employee-ma5azen1',
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
dropdownStyles: { [key: number]: any } = {};
isFormSubmitted = signal(false);

private stockService = inject(StoreKeeperStockService);
private additionsService = inject(AdditionsService);
closeStatusMessage(): void {
  console.log('ضغطت موافق');
  const wasSuccess = this.statusType === 'success';
  this.statusMessage = null;
  this.statusType = null;

  if (wasSuccess) {
    this.resetForm();
  }
}





  ma5azenItemOptions: string[] = [
    'أقلام جاف',
    'أوراق A4',
    'حاسوب محمول',
    'كرسي مكتبي',
    'طابعة ليزر',
    'مواد تنظيف',
    'شاشات عرض',
    'كابلات شبكة'
  ];

  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  userName: string = '';
  displayName: string = '';

  private fb = inject(FormBuilder);


  constructor() {
    this.inventoryLogForm = this.fb.group({
      tableData: this.fb.array([])
    });
  }

  ngOnInit(): void {
  this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);

  // جلب كل الأصناف من المخزن
  this.stockService.getAllStocks().subscribe((stocks: StockResponse[]) => {
    this.allStockItems = stocks.map(s => s.itemName);
  });
  this.stockService.getAllStocks().subscribe((stocks: StockResponse[]) => {
  // خليه يظهر اسم صنف واحد فقط لكل اسم
  const uniqueItems = Array.from(new Set(stocks.map(s => s.itemName)));
  this.allStockItems = uniqueItems;
});


  // ضيف أول صف في الجدول
  this.tableData.push(this.createTableRowFormGroup());
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
    additionNumber: [1, [Validators.required, Validators.min(1)]],
    itemName: [null, Validators.required],
    customItemName: [''], // هنضيف validator ديناميكي لاحقاً
    unit: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [1, [Validators.required, Validators.min(1)]],
    value: [1, [Validators.required, Validators.min(1)]],
    itemCondition: ['', Validators.required]
  });
}


filterItems(value: string, index: number): void {
  if (!value) {
    this.filteredItems[index] = [];
    return;
  }

  const input = document.querySelectorAll(
    'input[formControlName="itemName"]'
  )[index] as HTMLElement;

  if (input) {
    const rect = input.getBoundingClientRect();

this.dropdownStyles[index] = {
  top: rect.bottom + window.scrollY + 'px', // 🔥 دي الحل
  left: rect.left + window.scrollX + 'px',
  width: rect.width + 'px'
};

  }

  this.filteredItems[index] = this.allStockItems
    .filter(item =>
      item.toLowerCase().includes(value.toLowerCase())
    )
    .slice(0, 10);
}

selectItem(item: string, index: number): void {
  const row = this.tableData.at(index) as FormGroup;
  row.get('itemName')?.setValue(item);
  row.get('customItemName')?.reset();
  this.filteredItems[index] = [];
}
// لما يضغط على "أخرى"
selectOther(index: number): void {
  const row = this.tableData.at(index) as FormGroup;
  const itemField = row.get('itemName');
  if (!itemField) return;

  itemField.setValue(''); // خلي الحقل فاضي
  itemField.setValidators([Validators.required, Validators.minLength(1)]); // لازم يكتب الاسم
  itemField.markAsTouched(); // عشان يظهر الخطأ
  itemField.updateValueAndValidity();

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
 resetForm(): void {
  // امسح كل صفوف الجدول
  this.tableData.clear();

  // ضيف صف جديد فارغ
  this.tableData.push(this.createTableRowFormGroup());

  // رجع حالة الإرسال false
  this.isSubmitting.set(false);

  // رجع الفورم كـ pristine و untouched
  this.inventoryLogForm.markAsPristine();
  this.inventoryLogForm.markAsUntouched();
}

onItemChange(index: number): void {
  const row = this.tableData.at(index) as FormGroup;
  const itemField = row.get('itemName');

  if (!itemField) return;

  // لو القيمة فاضية → مطلوب
  if (!itemField.value || itemField.value === 'أخرى') {
    itemField.setValidators([Validators.required, Validators.minLength(1)]);
  } else {
    itemField.setValidators([Validators.required]);
  }

  itemField.updateValueAndValidity();
}




  // ✅ SUBMIT
onSubmit(): void {
  this.isFormSubmitted.set(true); // علامة بدأ محاولة الحفظ

  if (this.inventoryLogForm.invalid) {
    // الفورم مش كامل → الرسائل تظهر للحقول المطلوبة
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
      itemName: row.itemName === 'OTHER' ? row.customItemName : row.itemName,
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

        // ⚡ بعد الحفظ الناجح، امسح الفورم ورجع isFormSubmitted = false
        this.resetForm();
        this.isFormSubmitted.set(false);
      }
    }
  };
}





}

