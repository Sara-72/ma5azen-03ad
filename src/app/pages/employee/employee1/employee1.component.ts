import { Component ,OnInit, inject, signal} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray, AbstractControl,ValidationErrors,ValidatorFn} from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { SpendNotesService } from '../../../services/spend-notes.service';
import { StoreKeeperStockService } from '../../../services/store-keeper-stock.service';

export function fourStringsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    const isValid = words.length === 4;
    return isValid ? null : {
        fourStrings: {
            requiredCount: 4,
            actualCount: words.length
        }
    };
  };
}

@Component({
  selector: 'app-employee1',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee1.component.html',
  styleUrl: './employee1.component.css'
})
export class Employee1Component implements OnInit {
 private stockService = inject(StoreKeeperStockService);
 userCollege: string = '';
 collegeAdmin: string = '';
 todayDate: string = '';
 availableQuantityMap: { [key: string]: number } = {};

 collegeOptions: string[] = [
  'كلية الحاسبات والذكاء الاصطناعي',
  'كلية التربية',
  'كلية الألسن',
  'كلية السياحة والفنادق',
];

collegeAdminMap: { [key: string]: string } = {
  'كلية الحاسبات والذكاء الاصطناعي': 'محمود محمد محمد',
  'كلية التربية': 'شوري جعفر',
  'كلية الألسن': 'أمل عبدالعظيم سنوسي',
  'كلية السياحة والفنادق': 'أبوالسعود حبيشي احمد'
};
allStocks: any[] = [];
categoriesFromStock: string[] = [];
itemDataFromStock: { [key: string]: string[] } = {};
availableItemOptions: string[] = [
  'أقلام جاف',
  'أوراق A4',
  'حاسوب محمول',
  'كرسي مكتبي',
  'طابعة ليزر',
  'مواد تنظيف'
];
categories: string[] = ['أثاث ومفروشات', 'أجهزة إلكترونية', 'مستهلكات مكتبية', 'مواد تنظيف'];
itemData: { [key: string]: string[] } = {
    'أثاث ومفروشات': ['مكاتب', 'كراسي', 'خزائن ملفات', 'أرائك'],
    'أجهزة إلكترونية': ['شاشات عرض', 'طابعات', 'أجهزة كمبيوتر', 'ماوس وكيبورد'],
    'مستهلكات مكتبية': ['أقلام', 'ورق A4', 'دبابيس', 'ملفات بلاستيكية'],
    'مواد تنظيف': ['مطهرات', 'مناديل ورقية', 'مماسح', 'صابون سائل']
};
filteredItemNamesMap: { [key: number]: string[] } = {};
selectedCategory: string = '';
memoContainerForm!: FormGroup;
isSubmitting = signal(false);
statusMessage: string | null = null;
statusType: 'success' | 'error' | null = null;

private fb = inject(FormBuilder);

constructor(private spendNotesService: SpendNotesService) {
  this.memoContainerForm = this.fb.group({
    requests: this.fb.array([])
  });
}

userName: string = '';
displayName: string = '';
private setEmployeeSignatureIfValid(memoGroup: FormGroup): void {
  const words = this.userName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 4) {
    memoGroup.get('employeeSignature')?.setValue(this.userName);
  }
}

ngOnInit(): void {
  this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);
  const role = (localStorage.getItem('role') || 'USER').toUpperCase();

  // أي موظف مخزن أو أمين/مدير مخزن يظهر له "مركزية"
  if (role !== 'USER' && role !== 'ADMIN') {
    this.userCollege = 'مركزية'; // ✅ القيمة المنطقية للعرض
    this.collegeAdmin = 'حمدي محمد علي'; // أو الاسم اللي يخص المركز
  } else {
    this.userCollege = localStorage.getItem('faculty') || 'مركزية';

    this.collegeAdmin = this.collegeAdminMap[this.userCollege] || '';
  }

  this.todayDate = new Date().toISOString().substring(0, 10);

  // باقي الكود لتحميل المخزن
 this.stockService.getAllStocks().subscribe(stocks => {
  this.allStocks = stocks;

  // استخراج الفئات بدون تكرار
  this.categoriesFromStock = [
    ...new Set(stocks.map(s => s.category))
  ];

  // ربط كل فئة بالأصناف الخاصة بها
  this.itemDataFromStock = {};
  this.availableQuantityMap = {};

  stocks.forEach(stock => {
    if (!this.itemDataFromStock[stock.category]) {
      this.itemDataFromStock[stock.category] = [];
    }

    this.itemDataFromStock[stock.category].push(stock.itemName);

    const key = `${stock.category}|${stock.itemName}`;
    this.availableQuantityMap[key] = stock.quantity;
  });

  // إنشاء أول طلب
  const firstMemo = this.createRequestMemoGroup();
  this.fillFixedData(firstMemo);
  this.requests.push(firstMemo);
});

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

  memoGroup.get('collegeName')?.disable();
  memoGroup.get('requestDate')?.disable();
  memoGroup.get('employeeSignature')?.disable();
}



getFirstTwoNames(fullName: string): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
}

get requests(): FormArray {
  return this.memoContainerForm.get('requests') as FormArray;
}

private createRequestMemoGroup(): FormGroup {
  return this.fb.group({
    collegeAdminName: [''],
    collegeName: [''],
    category: [null],
    itemLines: this.fb.array([]),
    requestDate: [''],
    employeeSignature: ['', [Validators.required, fourStringsValidator()]]
  });
}

getCategoryValue(event: Event): string {
  return (event.target as HTMLSelectElement).value;
}

addItemLine(memoIndex: number): void {
  const itemGroup = this.fb.group({
    itemName: [null, Validators.required],
    customItemName: [''],
    count: [1, [Validators.required, Validators.min(1)]]
  });

  // مراقبة اختيار الصنف
  itemGroup.get('itemName')?.valueChanges.subscribe(value => {
    const customCtrl = itemGroup.get('customItemName');

    if (value === 'OTHER') {
      customCtrl?.setValidators([Validators.required]);
    } else {
      customCtrl?.clearValidators();
      customCtrl?.setValue('');
    }

    customCtrl?.updateValueAndValidity();
  });

  this.getItemLines(memoIndex).push(itemGroup);
}


private createItemLineGroup(): FormGroup {
  return this.fb.group({
    itemName: ['', Validators.required],
    count: [1, [Validators.required, Validators.min(1)]],
  });
}

updateFilteredItems(category: string, memoIndex: number): void {
  if (!category) return;

  const availableItems = [
    ...(this.itemDataFromStock[category] || []),
    'OTHER'
  ];

  const itemLinesArray = this.getItemLines(memoIndex);
  itemLinesArray.clear();

  itemLinesArray.push(this.fb.group({
    itemName: [null, Validators.required],
    customItemName: [''],
    count: [1, [Validators.required, Validators.min(1)]]
  }));
}

closeStatusMessage(): void {
  this.statusMessage = null;
  this.statusType = null;
}

getAvailableItems(memoIndex: number, itemLineIndex: number): string[] {
  const memoGroup = this.requests.at(memoIndex) as FormGroup;
  const category = memoGroup.get('category')?.value;
  if (!category) return [];

  const allItems = this.itemDataFromStock[category] || [];

  const itemLines = this.getItemLines(memoIndex).controls;
  const selectedItems = itemLines
    .map((ctrl, idx) => idx !== itemLineIndex ? ctrl.get('itemName')?.value : null)
    .filter(Boolean);

  return [
    ...allItems.filter(item => !selectedItems.includes(item)),
    'OTHER'   // ✅ هنا الحل
  ];
}


getItemLines(memoIndex: number): FormArray {
  const memoGroup = this.requests.at(memoIndex);
  if (!memoGroup) return this.fb.array([]);
  return memoGroup.get('itemLines') as FormArray;
}

removeItemLine(memoIndex: number, itemLineIndex: number): void {
  const itemLinesArray = this.getItemLines(memoIndex);
  itemLinesArray.removeAt(itemLineIndex);
}

onCollegeChange(collegeName: string, memoIndex: number): void {
  if (!collegeName) return;
  const adminName = this.collegeAdminMap[collegeName] || '';
  const memoGroup = this.requests.at(memoIndex) as FormGroup;
  memoGroup.get('collegeAdminName')?.setValue(adminName);
}

addRow(): void {
  const newMemo = this.createRequestMemoGroup();
  this.fillFixedData(newMemo);
  this.requests.push(newMemo);
}

removeRow(): void {
  if (this.requests.length > 1) {
    this.requests.removeAt(this.requests.length - 1);
  } else if (this.requests.length === 1) {
    this.requests.at(0).reset();
  }
}

private hasInvalidQuantity(): boolean {
  let hasError = false;

  this.requests.controls.forEach((memoCtrl) => {
    const memo = memoCtrl as FormGroup;
    const category = memo.get('category')?.value;
    const itemLines = memo.get('itemLines') as FormArray;

    itemLines.controls.forEach((itemCtrl) => {
      const itemGroup = itemCtrl as FormGroup;
      const itemName = itemGroup.get('itemName')?.value;
      const count = itemGroup.get('count')?.value;
      const control = itemGroup.get('count');

      if (!category || !itemName) return;

      // ✅ تجاهل الأصناف الجديدة (OTHER)
      if (itemName === 'OTHER') {
        // امسحي أي error قديم
        if (control?.hasError('exceedStock')) {
          const errors = { ...control.errors };
          delete errors['exceedStock'];
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
        return;
      }

      const key = `${category}|${itemName}`;
      const available = this.availableQuantityMap[key] ?? 0;

      if (count > available) {
        control?.setErrors({ ...control.errors, exceedStock: true });
        control?.markAsTouched();
        control?.markAsDirty();
        hasError = true;
      } else {
        if (control?.hasError('exceedStock')) {
          const errors = { ...control.errors };
          delete errors['exceedStock'];
          control.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    });
  });

  return hasError;
}


onSubmit(): void {
  this.statusMessage = null;
  this.statusType = null;

  // 1️⃣ نعلم كل الحقول بأنها تم لمسها
  this.memoContainerForm.markAllAsTouched();

  // 2️⃣ تحقق من كمية المخزن لكل الأصناف
  if (this.hasInvalidQuantity()) {
    
    this.statusType = 'error';
    return;
  }

  // 3️⃣ تحقق من صحة الفورم ككل
  let invalidCategory = false;
  let invalidItem = false;

  this.requests.controls.forEach((memoCtrl, memoIndex) => {
    const memo = memoCtrl as FormGroup;

    // تحقق من الفئة
    if (!memo.get('category')?.value) {
      invalidCategory = true;
      memo.get('category')?.setErrors({ required: true });
    }

    // تحقق من الأصناف
    const itemLines = memo.get('itemLines') as FormArray;
    itemLines.controls.forEach((itemCtrl: AbstractControl, itemIndex) => {
      const itemGroup = itemCtrl as FormGroup;
      if (!itemGroup.get('itemName')?.value) {
        invalidItem = true;
        itemGroup.get('itemName')?.setErrors({ required: true });
      }
    });
  });

  

  if (this.memoContainerForm.invalid) {
    return;
  }

  // 4️⃣ إرسال البيانات
  this.isSubmitting.set(true);
  let requestsToSend = 0;
  let successCount = 0;
  let hasError = false;

  this.requests.controls.forEach((memoCtrl) => {
    const memo = memoCtrl as FormGroup;
    const itemLines = memo.get('itemLines')?.value || [];
    itemLines.forEach((item: any) => {
      requestsToSend++;
      const finalItemName =
  item.itemName === 'OTHER'
    ? item.customItemName
    : item.itemName;

const payload = {
  itemName: finalItemName,
  quantity: item.count,
  requestDate: new Date(memo.get('requestDate')?.value).toISOString(),
  userSignature: memo.get('employeeSignature')?.value,
  college: memo.get('collegeName')?.value,
  category: memo.get('category')?.value,
  permissinStatus: 'قيد المراجعة',
  collageKeeper: memo.get('collegeAdminName')?.value,
  employeeId: 1
};


      this.spendNotesService.createSpendNote(payload).subscribe({
        next: () => {
          successCount++;
          if (successCount === requestsToSend && !hasError) {
            this.statusMessage = 'تم إرسال جميع الأصناف بنجاح ✅';
            this.statusType = 'success';
            this.memoContainerForm.reset();
            this.requests.clear();
            const newMemo = this.createRequestMemoGroup();
            this.fillFixedData(newMemo);
            this.requests.push(newMemo);
            this.isSubmitting.set(false);
          }
        },
        error: () => {
          hasError = true;
          this.statusMessage = 'حدث خطأ أثناء حفظ أحد الأصناف ❌';
          this.statusType = 'error';
          this.isSubmitting.set(false);
        }
      });
    });
  });
}




}
