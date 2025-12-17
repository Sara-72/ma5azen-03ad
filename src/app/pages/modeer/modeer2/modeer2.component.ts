import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup, FormArray, ValidationErrors, ValidatorFn, Validators, AbstractControl } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

/**
 * Validator for exactly four words
 */
export function fourStringsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    return words.length === 4 ? null : { fourStrings: { requiredCount: 4, actualCount: words.length } };
  };
}

@Component({
  selector: 'app-modeer2',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ReactiveFormsModule, CommonModule],
  templateUrl: './modeer2.component.html',
  styleUrl: './modeer2.component.css'
})
export class Modeer2Component implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  // --- DATA PROPERTIES ---
  days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  years = Array.from({ length: 100 }, (_, i) => String(2025 - i));

  storeTypes = ['مستديم', 'مستهلك'];

  allItemsByCategory: { [key: string]: string[] } = {
    'أدوات مكتبية': ['قلم جاف', 'ورق A4', 'دباسة', 'ممحاة', 'مسطرة', 'مقص'],
    'أجهزة حاسب': ['شاشة 24 بوصة', 'لوحة مفاتيح', 'ماوس لاسلكي', 'طابعة HP'],
    'أثاث': ['كرسي مكتب', 'طاولة اجتماعات', 'خزانة ملفات', 'مكتب مدير']
  };

  categories = Object.keys(this.allItemsByCategory);
  itemConditions = ['جديدة', 'مستعمل', 'قابل للإصلاح', 'كهنة أو خردة'];
  documentNumbers = [' كشف العجز', ' سند خصم', ' أصناف تالفة', ' محضر بيع', ' إهداءات'];

  rowFilteredItems: string[][] = [];
  consumableForm!: FormGroup;
  isSubmitting = signal(false);

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.addRow();
  }

  private initForm() {
    this.consumableForm = this.fb.group({
      destinationName: ['', Validators.required],
      category: ['', Validators.required], // الفئة الرئيسية في الأعلى
      requestDateGroup: this.fb.group({
        yy: ['', Validators.required],
        mm: ['', Validators.required],
        dd: ['', Validators.required]
      }),
      regularDateGroup: this.fb.group({
        yy: ['', Validators.required],
        mm: ['', Validators.required],
        dd: ['', Validators.required]
      }),

      requestorName: ['', [Validators.required, fourStringsValidator()]],
      documentNumber: ['', Validators.required],
      managerApprovalName: ['', [Validators.required, fourStringsValidator()]],
      tableData: this.fb.array([])
    });
  }

  get tableData(): FormArray {
    return this.consumableForm.get('tableData') as FormArray;
  }

  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      storeType: ['', Validators.required],
      itemName: ['', Validators.required],
      itemSearchText: [''],
      unit: ['', Validators.required],
      quantityRequired: ['', Validators.required],
      quantityAuthorized: [''],
      quantityIssued: [''],
      itemCondition: [''],
      unitPrice: [''],
      value: ['']
    });
  }

  // ------------------- NEW & UPDATED LOGIC FUNCTIONS -------------------

  /**
   * تُستدعى عند تغيير الفئة من القائمة العلوية
   */
  onGlobalCategoryChange(event: Event) {
    const selectedCategory = (event.target as HTMLSelectElement).value;

    // تحديث قائمة الأصناف المتاحة لكل صف في الجدول بناءً على الفئة الجديدة
    this.tableData.controls.forEach((_, index) => {
      this.updateFilteredItemsForSingleRow(selectedCategory, index);
    });
  }

  /**
   * تحديث الأصناف المفلترة لصف واحد محدد
   */
  private updateFilteredItemsForSingleRow(category: string, index: number) {
    const cleanCategory = category.trim();

    if (this.allItemsByCategory[cleanCategory]) {
      this.rowFilteredItems[index] = [...this.allItemsByCategory[cleanCategory]];
    } else {
      this.rowFilteredItems[index] = [];
    }

    // إعادة ضبط قيم البحث لضمان عدم بقاء صنف من فئة قديمة
    const row = this.tableData.at(index);
    row.patchValue({
      itemSearchText: '',
      itemName: ''
    });
  }

  addRow(): void {
    const newGroup = this.createTableRowFormGroup();
    this.tableData.push(newGroup);

    const index = this.tableData.length - 1;
    const currentCategory = this.consumableForm.get('category')?.value;

    // إذا كانت الفئة مختارة مسبقاً، جهز قائمة الأصناف لهذا الصف الجديد
    if (currentCategory) {
      this.updateFilteredItemsForSingleRow(currentCategory, index);
    } else {
      this.rowFilteredItems.push([]);
    }
  }

  removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.removeAt(this.tableData.length - 1);
      this.rowFilteredItems.pop();
    }
  }

  filterItemOptions(event: any, index: number) {
    const searchTerm = event.target.value.toLowerCase();
    const selectedCategory = this.consumableForm.get('category')?.value; // البحث يعتمد على الفئة الرئيسية

    if (selectedCategory) {
      const originalItems = this.allItemsByCategory[selectedCategory] || [];
      if (!searchTerm) {
        this.rowFilteredItems[index] = [...originalItems];
      } else {
        this.rowFilteredItems[index] = originalItems.filter(item =>
          item.toLowerCase().includes(searchTerm)
        );
      }
    }
  }

  syncItemName(index: number) {
    const row = this.tableData.at(index);
    const searchText = row.get('itemSearchText')?.value;
    row.get('itemName')?.setValue(searchText);
  }

  getFilteredItemsForRow(index: number): string[] {
    return this.rowFilteredItems[index] || [];
  }

  // ------------------- SUBMISSION -------------------

  onSubmit(): void {
    if (this.consumableForm.invalid) {
      this.consumableForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.consumableForm.value;

    const basePayload = {
      destinationName: formVal.destinationName,
      storeHouse: formVal.category, // الفئة تُرسل كـ storeHouse
      requestDate: new Date(Number(formVal.requestDateGroup.yy), Number(formVal.requestDateGroup.mm) - 1, Number(formVal.requestDateGroup.dd)).toISOString(),
      documentDate: new Date(Number(formVal.regularDateGroup.yy), Number(formVal.regularDateGroup.mm) - 1, Number(formVal.regularDateGroup.dd)).toISOString(),
      requestorName: formVal.requestorName,
      documentNumber: formVal.documentNumber
    };

    const requests = this.tableData.value.map((row: any) => {
      return this.http.post('http://newwinventoryapi.runasp.net/api/SpendPermissions', {
        ...basePayload,
        itemName: row.itemName,
        unit: row.unit,
        storeType: row.storeType,
        requestedQuantity: Number(row.quantityRequired),
        approvedQuantity: Number(row.quantityAuthorized || 0),
        issuedQuantity: Number(row.quantityIssued || 0),
        stockStatus: row.itemCondition || 'جديدة',
        unitPrice: Number(row.unitPrice || 0),
        totalValue: Number(row.value || 0)
      });
    });

    Promise.all(requests.map((r: Observable<any>) => r.toPromise()))
      .then(() => {
        alert('تم الحفظ بنجاح ✅');
        this.consumableForm.reset();
        this.isSubmitting.set(false);
      })
      .catch(err => {
        console.error(err);
        alert('حصل خطأ أثناء الحفظ ❌');
        this.isSubmitting.set(false);
      });
  }
}
