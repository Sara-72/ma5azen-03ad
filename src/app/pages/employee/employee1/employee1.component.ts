import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { SpendNotesService } from '../../../services/spend-notes.service';
import { StoreKeeperStockService } from '../../../services/store-keeper-stock.service';

export function fourStringsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    return words.length === 4 ? null : { fourStrings: true };
  };
}

@Component({
  selector: 'app-employee1',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './employee1.component.html',
  styleUrl: './employee1.component.css'
})
export class Employee1Component implements OnInit {
  private stockService = inject(StoreKeeperStockService);
  private fb = inject(FormBuilder);
  private spendNotesService = inject(SpendNotesService);

  userCollege: string = '';
  collegeAdmin: string = '';
  todayDate: string = '';
  userName: string = '';
  displayName: string = '';

  allStocks: any[] = [];
  categoriesFromStock: string[] = [];
  itemDataFromStock: { [key: string]: string[] } = {};
  availableQuantityMap: { [key: string]: number } = {};

  collegeAdminMap: { [key: string]: string } = {
    'كلية الحاسبات والذكاء الاصطناعي': 'محمود محمد محمد',
    'كلية التربية': 'شوري جعفر',
    'كلية الألسن': 'أمل عبدالعظيم سنوسي',
    'كلية السياحة والفنادق': 'أبوالسعود حبيشي احمد'
  };

  memoContainerForm: FormGroup;
  isSubmitting = signal(false);
  statusMessage: string | null = null;
  statusType: 'success' | 'error' | null = null;

  constructor() {
    this.memoContainerForm = this.fb.group({
      requests: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);
    const role = (localStorage.getItem('role') || 'USER').toUpperCase();

if (role === 'USER') {
  // موظف عادي
  this.userCollege = localStorage.getItem('faculty') || 'مركزية';
  this.collegeAdmin = this.collegeAdminMap[this.userCollege] || '';
} else {
  // أي حد غير الموظف
  this.userCollege = 'مركزية';
  this.collegeAdmin = 'حمدي محمد علي';
}

    this.todayDate = new Date().toISOString().substring(0, 10);

    this.stockService.getAllStocks().subscribe(stocks => {
      this.allStocks = stocks;
      this.categoriesFromStock = [...new Set(stocks.map(s => s.category)), 'OTHER'];
      this.itemDataFromStock = {};
      this.availableQuantityMap = {};

      stocks.forEach(stock => {
        if (!this.itemDataFromStock[stock.category]) this.itemDataFromStock[stock.category] = [];
        this.itemDataFromStock[stock.category].push(stock.itemName);
        this.availableQuantityMap[`${stock.category}|${stock.itemName}`] = stock.quantity;
      });

      this.addRow();
    });
  }

  get requests(): FormArray {
    return this.memoContainerForm.get('requests') as FormArray;
  }

  getItemLines(memoIndex: number): FormArray {
    return this.requests.at(memoIndex).get('itemLines') as FormArray;
  }

  asGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  private createRequestMemoGroup(): FormGroup {
    const group = this.fb.group({
      collegeAdminName: [''],
      collegeName: [''],
      category: [null, Validators.required],
      customCategory: [''],
      itemLines: this.fb.array([]),
      requestDate: [this.todayDate],
      employeeSignature: [this.userName, [Validators.required, fourStringsValidator()]]
    });

    group.get('category')?.valueChanges.subscribe(value => {
      const customCatCtrl = group.get('customCategory');
      const lines = group.get('itemLines') as FormArray;
      lines.clear();

      if (value === 'OTHER') {
        customCatCtrl?.setValidators([Validators.required]);
        this.addItemLine(this.requests.controls.indexOf(group), true);
      } else {
        customCatCtrl?.clearValidators();
        customCatCtrl?.setValue('');
        this.addItemLine(this.requests.controls.indexOf(group), false);
      }
      customCatCtrl?.updateValueAndValidity({ emitEvent: false });
    });

    return group;
  }

  addItemLine(memoIndex: number, isOtherCategory: boolean = false): void {
    const itemGroup = this.fb.group({
      itemName: [null, Validators.required],
      customItemName: [null],
      count: [1, [Validators.required, Validators.min(1)]]
    });

    if (!isOtherCategory) {
      itemGroup.get('itemName')?.valueChanges.subscribe(value => {
        const customCtrl = itemGroup.get('customItemName');
        if (value === 'OTHER') {
          customCtrl?.setValidators([Validators.required]);
        } else {
          customCtrl?.clearValidators();
          customCtrl?.setValue(null);
        }
        customCtrl?.updateValueAndValidity({ emitEvent: false });
      });
    }

    this.getItemLines(memoIndex).push(itemGroup);
  }

  getAvailableItems(memoIndex: number, itemLineIndex: number): string[] {
    const memoGroup = this.requests.at(memoIndex) as FormGroup;
    const category = memoGroup.get('category')?.value;
    if (!category || category === 'OTHER') return [];

    const allItems = this.itemDataFromStock[category] || [];
    const itemLines = this.getItemLines(memoIndex).controls;
    const selectedItems = itemLines
      .map((ctrl, idx) => idx !== itemLineIndex ? ctrl.get('itemName')?.value : null)
      .filter(Boolean);

    return [...allItems.filter(item => !selectedItems.includes(item)), 'OTHER'];
  }

  private fillFixedData(memoGroup: FormGroup): void {
    const displayCollege = this.userCollege === 'مركزية' ? 'المركز الرئيسي' : this.userCollege;
    const adminName = this.userCollege === 'مركزية' ? 'حمدي محمد علي' : this.collegeAdmin;

    memoGroup.patchValue({
      employeeSignature: this.userName,
      collegeName: displayCollege,
      collegeAdminName: adminName,
      requestDate: this.todayDate
    });
  }

  onSubmit(): void {
    this.statusMessage = null;
    this.statusType = null;

    // --- DEBUGGER START ---
    this.requests.controls.forEach((memo, i) => {
      const m = memo as FormGroup;
      m.get('customCategory')?.updateValueAndValidity();
      const lines = m.get('itemLines') as FormArray;
      lines.controls.forEach((line, j) => {
        line.get('itemName')?.updateValueAndValidity();
        line.get('customItemName')?.updateValueAndValidity();
        if (line.invalid) console.log(`Invalid Line: Request ${i}, Item ${j}`, line.errors, line.value);
      });
      if (m.invalid) console.log(`Invalid Request Memo ${i}:`, m.errors, m.value);
    });
    // --- DEBUGGER END ---

    if (this.memoContainerForm.invalid) {
      this.statusType = 'error';
      this.statusMessage = 'الرجاء التأكد من ملء جميع الحقول المطلوبة بشكل صحيح';
      return;
    }

    if (this.hasInvalidQuantity()) {
      this.statusType = 'error';
      this.statusMessage = 'الكمية المطلوبة غير متاحة في المخزن';
      return;
    }

    this.isSubmitting.set(true);
    let totalRequests = 0;
    let successCount = 0;
    let hasError = false;

    // Use .getRawValue() to include disabled fields in the payload
    const formValues = this.memoContainerForm.getRawValue();

    formValues.requests.forEach((memo: any) => {
      const categoryValue = memo.category;

      memo.itemLines.forEach((item: any) => {
        totalRequests++;
        let finalItemName = item.itemName;
        if (categoryValue !== 'OTHER' && item.itemName === 'OTHER') {
          finalItemName = item.customItemName;
        }

        const payload = {
          itemName: finalItemName,
          quantity: item.count,
          requestDate: new Date(memo.requestDate).toISOString(),
          userSignature: memo.employeeSignature,
          college: memo.collegeName,
          category: categoryValue === 'OTHER' ? 'أخرى' : categoryValue,
          permissinStatus: 'قيد المراجعة',
          collageKeeper: memo.collegeAdminName,
          employeeId: 1
        };

        this.spendNotesService.createSpendNote(payload).subscribe({
          next: () => {
            successCount++;
            if (successCount === totalRequests && !hasError) {
              this.statusMessage = 'تم إرسال جميع الأصناف بنجاح ✅';
              this.statusType = 'success';
              this.resetForm();
            }
          },
          error: (err) => {
            hasError = true;
            this.statusMessage = 'حدث خطأ أثناء الاتصال بالخادم ❌';
            this.statusType = 'error';
            this.isSubmitting.set(false);
          }
        });
      });
    });
  }

  private hasInvalidQuantity(): boolean {
    let hasError = false;
    this.requests.controls.forEach((memoCtrl) => {
      const memo = memoCtrl as FormGroup;
      const category = memo.get('category')?.value;
      if (category === 'OTHER') return;

      const itemLines = (memo.get('itemLines') as FormArray).controls;
      itemLines.forEach((itemCtrl) => {
        const itemGroup = itemCtrl as FormGroup;
        const itemName = itemGroup.get('itemName')?.value;
        const count = itemGroup.get('count')?.value;
        if (itemName === 'OTHER') return;

        const available = this.availableQuantityMap[`${category}|${itemName}`] ?? 0;
        if (count > available) {
          itemGroup.get('count')?.setErrors({ exceedStock: true });
          hasError = true;
        }
      });
    });
    return hasError;
  }

  resetForm() {
    this.requests.clear();
    this.addRow();
    this.isSubmitting.set(false);
    this.memoContainerForm.markAsPristine();
    this.memoContainerForm.markAsUntouched();
  }

  addRow(): void {
    const newMemo = this.createRequestMemoGroup();
    this.fillFixedData(newMemo);
    this.requests.push(newMemo);
  }

  removeRow(): void {
    if (this.requests.length > 1) this.requests.removeAt(this.requests.length - 1);
  }

  removeItemLine(memoIndex: number, itemLineIndex: number): void {
    this.getItemLines(memoIndex).removeAt(itemLineIndex);
  }

  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }

  closeStatusMessage(): void {
    this.statusMessage = null;
    this.statusType = null;
  }
}
