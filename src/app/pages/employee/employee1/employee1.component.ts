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

    if (!value) {
      return null; // Let Validators.required handle the empty state
    }

    // Trim whitespace and split by one or more spaces, filtering out empty strings.
    const words = String(value).trim().split(/\s+/).filter(Boolean);

    const isValid = words.length === 4;

    // Return the validation error object if the count is not 4
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

 collegeOptions: string[] = [
  'كلية الحاسبات والذكاء الاصطناعي',
  'كلية التربية',
  'كلية الألسن',
  'كلية السياحة والفنادق',
];

// أسماء أمين الكلية الجديدة حسب طلبك
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



// 🚨 NEW PROPERTY: To hold the currently selected category for the new dropdown
selectedCategory: string = ''

 // 🚨 New name for the top-level form group
  memoContainerForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);

  constructor(
  private spendNotesService: SpendNotesService) {
    this.memoContainerForm = this.fb.group({

      // 🚨 New FormArray: requests is an array of complete memos (papers)
      requests: this.fb.array([]) // نبدأ الفارغ، سنضيف أول مذكرة بعد ngOnInit

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

  // جلب المخزون من الخدمة
  this.stockService.getAllStocks().subscribe(stocks => {
    this.allStocks = stocks;

    // استخراج الفئات
    this.categoriesFromStock = [...new Set(stocks.map(s => s.category))];

    // بناء خريطة الفئة -> الأصناف
    this.itemDataFromStock = {};
    this.categoriesFromStock.forEach(cat => {
      this.itemDataFromStock[cat] = [
        ...new Set(stocks.filter(s => s.category === cat).map(s => s.itemName))
      ];
    });

    // إضافة أول مذكرة بعد معرفة userName
    const firstMemo = this.createRequestMemoGroup();
    this.requests.push(firstMemo);
  });
}



getFirstTwoNames(fullName: string): string {
  if (!fullName) return '';

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}


  // 🚨 Getter for the FormArray holding all the papers
  get requests(): FormArray {
    return this.memoContainerForm.get('requests') as FormArray;
  }

  // Helper function to create the form group for ONE entire request memo (ONE Paper)
private createRequestMemoGroup(): FormGroup {
  return this.fb.group({
    collegeAdminName: [''],
    collegeName: [''],
    category: [null], // 👈 مهم
    itemLines: this.fb.array([]), // 👈 نبدأ فاضي
    requestDate: [''],
    employeeSignature: [
      this.userName || '',
      [Validators.required, fourStringsValidator()]
    ]
  });
}






// --- Employee1Component.ts ---

// ... existing methods ...

/**
 * Helper function to safely extract the value from a change event on a select element.
 * @param event The native DOM event object.
 */
getCategoryValue(event: Event): string {
    // We are sure the target is a select element, so we cast it here in TypeScript
    return (event.target as HTMLSelectElement).value;
}

// 🚨 MISSING METHOD FIX: addItemLine
// --- تعديل addItemLine لإضافة صنف جديد بشكل صحيح ---
addItemLine(memoIndex: number): void {
  const memoGroup = this.requests.at(memoIndex) as FormGroup;
  const category = memoGroup.get('category')?.value;
  

  this.getItemLines(memoIndex).push(this.fb.group({
  itemName: [null, Validators.required], // ✅ user يختار
  count: [1, [Validators.required, Validators.min(1)]]
}));

}




// Helper function to create the form group for ONE item line (Item Name + Count)
private createItemLineGroup(): FormGroup {
    return this.fb.group({
        itemName: ['', Validators.required], // الصنف
        count: [1, [Validators.required, Validators.min(1)]], // العدد
    });
}

// 🚨 Modify the updateFilteredItems function to accept the raw event (Optional, but cleaner)
// If you want to keep updateFilteredItems accepting just the string, that is also fine.
// I will keep your existing function signature, and call the helper function from the template.



// 🚨 UPDATE SIGNATURE: Now accepts the index of the memo that triggered the change
// --- Employee1Component.ts ---

// --- تحديث الدالة updateFilteredItems ---
updateFilteredItems(category: string, memoIndex: number): void {
  if (!category) return;

  const availableItems = this.itemDataFromStock[category] || [];

  const itemLinesArray = this.getItemLines(memoIndex);
  itemLinesArray.clear();

  const firstItemName = availableItems.length > 0 ? availableItems[0] : '';
  itemLinesArray.push(this.fb.group({
    itemName: [null, Validators.required],
    count: [1, [Validators.required, Validators.min(1)]]
  }));
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

  return allItems.filter(item => !selectedItems.includes(item));
}






// --- Employee1Component.ts ---

// Getter to easily access the item lines FormArray for a specific memo (by index)
// New definition: Accepts the index (number)


// --- Employee1Component.ts ---

// 1. Helper to access the nested FormArray
// Helper function to access the nested itemLines FormArray for a specific memo (by index)
// 1. Helper function to access the nested itemLines FormArray
getItemLines(memoIndex: number): FormArray {
    // 1. Get the specific memo group using the outer index
    const memoGroup = this.requests.at(memoIndex);

    // Safety check
    if (!memoGroup) {
        // Returns an empty FormArray if the memo group isn't found, preventing crashes
        return this.fb.array([]);
    }

    // 2. Return the nested FormArray 'itemLines'
    return memoGroup.get('itemLines') as FormArray;
}
// 2. Function to remove a specific item line
// --- Employee1Component.ts ---

// Function to remove a specific item line
// --- Employee1Component.ts ---

removeItemLine(memoIndex: number, itemLineIndex: number): void {

    const itemLinesArray = this.getItemLines(memoIndex);

    // 🚨 Action: Since the button only appears when length > 1,
    // we can remove the item directly using its index.
    itemLinesArray.removeAt(itemLineIndex);

    console.log(`Removed item index ${itemLineIndex} from memo index ${memoIndex}`);
}

onCollegeChange(collegeName: string, memoIndex: number): void {
  if (!collegeName) return;

  const adminName = this.collegeAdminMap[collegeName] || '';

  const memoGroup = this.requests.at(memoIndex) as FormGroup;

  memoGroup.get('collegeAdminName')?.setValue(adminName);
}





  // ➕ Method to add a new paper (New Request Memo)
  addRow(): void {
  const newMemo = this.createRequestMemoGroup();
this.requests.push(newMemo);

}



  // ➖ Method to remove the last paper
  removeRow(): void {
    if (this.requests.length > 1) {
      this.requests.removeAt(this.requests.length - 1);
    } else if (this.requests.length === 1) {
      // Option: Clear the fields of the last paper instead of removing the whole thing
      this.requests.at(0).reset();
    }
  }

  // --- SUBMIT LOGIC (Updated to use memoContainerForm) ---
// --- إرسال الطلب مع جميع الأصناف ---
onSubmit(): void {
  if (this.memoContainerForm.invalid) {
    this.memoContainerForm.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);

  let requestsToSend = 0;
  let successCount = 0;
  let hasError = false;

  this.requests.controls.forEach((memoCtrl, memoIndex) => {
    const memo = memoCtrl as FormGroup;
    const itemLines = memo.get('itemLines')?.value || [];

    itemLines.forEach((item: any) => {
      requestsToSend++;

      const payload = {
        itemName: item.itemName,        // ✅ صنف واحد
        quantity: item.count,           // ✅ كميته فقط
        requestDate: new Date(
          memo.get('requestDate')?.value
        ).toISOString(),
        userSignature: memo.get('employeeSignature')?.value,
        college: memo.get('collegeName')?.value,
        category: memo.get('category')?.value,
        permissinStatus: 'قيد المراجعة',
        collageKeeper: memo.get('collegeAdminName')?.value,
        employeeId: 1
      };

      console.log('🚀 Sending item:', payload);

      this.spendNotesService.createSpendNote(payload).subscribe({
        next: () => {
          successCount++;

          if (successCount === requestsToSend && !hasError) {
            alert('تم إرسال جميع الأصناف بنجاح ✅');

            const employeeSig =
              this.requests.at(0)?.get('employeeSignature')?.value || '';

            this.memoContainerForm.reset();
            this.requests.clear();

            const newMemo = this.createRequestMemoGroup();
            newMemo.get('employeeSignature')?.setValue(employeeSig);
            this.requests.push(newMemo);

            this.isSubmitting.set(false);
          }
        },
        error: err => {
          hasError = true;
          console.error('❌ فشل حفظ الصنف', err);
          alert('حدث خطأ أثناء حفظ أحد الأصناف ❌');
          this.isSubmitting.set(false);
        }
      });
    });
  });
}




}
