import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormGroup,
  FormArray,
  ValidationErrors,
  ValidatorFn,
  Validators,
  AbstractControl
} from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ModeerSercive } from '../../../services/modeer.service';

/** Validator for exactly four words */
export function fourStringsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    return words.length === 4
      ? null
      : { fourStrings: { requiredCount: 4, actualCount: words.length } };
  };
}
/** Validator يمنع القيم الفاضية أو المسافات فقط */
export function notEmptyTrimmed(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined) return { required: true };

    if (typeof value === 'string' && value.trim() === '') {
      return { emptyTrimmed: true };
    }

    return null;
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



  private scrollToFirstInvalidControl(form: FormGroup) {



  setTimeout(() => {
    const firstInvalidControl = document.querySelector(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid'
    ) as HTMLElement | null;

    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      firstInvalidControl.focus();

      // تغيير لون البوردر الأساسي
      firstInvalidControl.classList.add('error-border');

      // رجوع اللون الطبيعي بعد 3 ثواني
      setTimeout(() => {
        firstInvalidControl.classList.remove('error-border');
      }, 3000);
    }
  });
}

public syncIssuedQuantity(formIndex: number, rowIndex: number): void {
  const row = (this.consumableForms[formIndex]
    .get('tableData') as FormArray).at(rowIndex) as FormGroup;

  const required = Number(row.get('quantityRequired')?.value || 0);
  const approved = Number(row.get('quantityAuthorized')?.value || 0);

  if (required <= approved) {
    row.get('quantityIssued')?.setValue(required, { emitEvent: false });
  } else {
    row.get('quantityIssued')?.setValue(approved, { emitEvent: false });
  }

  // تحديث القيمة الإجمالية
  const unitPrice = Number(row.get('unitPrice')?.value || 0);
  row.patchValue(
    { value: row.get('quantityIssued')?.value * unitPrice },
    { emitEvent: false }
  );
}

  private getAvailableQuantity(itemName: string, storeType: string): number {
  const stockItem = this.storeKeeperStocks.find(
    s => s.itemName === itemName && s.storeType === storeType
  );

  return stockItem?.quantity || 0;
}
public checkStockForForm(form: FormGroup): boolean {

  const tableArray = form.get('tableData') as FormArray;
  let hasError = false;

  // 🔹 مسح أي أخطاء قديمة
  tableArray.controls.forEach(ctrl => {
    (ctrl as FormGroup).setErrors(null);
  });

  // 1️⃣ تجميع الكمية المطلوبة لكل صنف
  const requiredMap = new Map<string, number>();

  tableArray.controls.forEach(ctrl => {
    const row = ctrl as FormGroup;

    const itemName = row.get('itemName')?.value;
    const storeType = row.get('storeType')?.value;
    const category = form.get('category')?.value;
    const qty = Number(row.get('quantityIssued')?.value || 0);

    const key = `${itemName}|${storeType}|${category}`;
    requiredMap.set(key, (requiredMap.get(key) || 0) + qty);
  });

  //  فحص المخزون
  requiredMap.forEach((totalRequired, key) => {
    const [itemName, storeType, category] = key.split('|');

    const matchingStocks = this.storeKeeperStocks.filter(s =>
  s.itemName?.trim() === itemName?.trim() &&
  s.storeType?.trim() === storeType?.trim() &&
  s.category?.trim() === category?.trim()
);


    //  الصنف غير موجود
    if (matchingStocks.length === 0) {
      hasError = true;

      tableArray.controls.forEach(ctrl => {
        const row = ctrl as FormGroup;
        if (row.get('itemName')?.value === itemName) {
          row.setErrors({ stockError: true });
        }
      });

      return;
    }

    const totalAvailable = matchingStocks
      .reduce((sum, s) => sum + Number(s.quantity || 0), 0);

    // ❌ الكمية غير كافية
    if (totalRequired > totalAvailable) {
      hasError = true;

      tableArray.controls.forEach(ctrl => {
        const row = ctrl as FormGroup;
        if (row.get('itemName')?.value === itemName) {
          row.setErrors({
            exceedStock: {
              required: totalRequired,
              available: totalAvailable
            }
          });
        }
      });
    }
  });

  return hasError;
}



  private getItemDefaults(itemName: string): { unit: string; storeType: string } {
  if (!itemName) {
    return { unit: '', storeType: '' };
  }

  const stockItem = this.storeKeeperStocks.find(
    s => s.itemName === itemName
  );

  return {
    unit: stockItem?.unit || '',
    storeType: stockItem?.storeType || ''
  };
}

  private getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private modeerService = inject(ModeerSercive);
  userName: string = '';
  displayName: string = '';

  storeTypes = ['مستديم', 'مستهلك'];
  storeKeeperStocks: any[] = [];
  filteredItemsByRow: string[][][] = []; // مصفوفة لكل فورم لكل صف
  allCategories: string[] = [];
  itemConditions = ['جديدة', 'مستعمل', 'قابل للإصلاح', 'كهنة أو خردة'];
  documentNumbers = ['كشف العجز', 'سند خصم', 'أصناف تالفة', 'محضر بيع', 'إهداءات'];

  consumableForms: FormGroup[] = []; // بدل Form واحد

  isSubmitting = signal(false);

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);
    this.modeerService.getStoreKeeperStocks().subscribe({
      next: (response: any[]) => {
        this.storeKeeperStocks = response || [];
        this.allCategories = Array.from(new Set(this.storeKeeperStocks
          .map(s => s.Category)
          .filter(c => c && c.trim() !== '')
        ));
        this.loadSpendNotes();
      },
      error: err => console.error('Error fetching stocks:', err)
    });
  } getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }


  /** إنشاء فورم جاهز */
  private createForm(): FormGroup {
  return this.fb.group({
    destinationName: ['', Validators.required],
    category: ['', Validators.required],
    requestDateGroup: ['', Validators.required],
    regularDateGroup: [this.getTodayDate(), Validators.required],

    requestorName: ['', [Validators.required, fourStringsValidator()]],

    documentNumber: [
      '',
      [Validators.required, notEmptyTrimmed()]
    ],

    managerSignature: [
      this.userName,
      [Validators.required, fourStringsValidator()]
    ],

    tableData: this.fb.array([])
  });
}


  private createTableRowFormGroup(): FormGroup {
  return this.fb.group({
    storeType: ['', Validators.required],

    itemName: ['', [Validators.required, notEmptyTrimmed()]],
    itemSearchText: ['', [Validators.required, notEmptyTrimmed()]],
    category: ['', Validators.required],
    unit: ['', Validators.required],

    quantityRequired: [
      '',
      [Validators.required, Validators.min(1)]
    ],

    quantityAuthorized: [
      '',
      [Validators.required, Validators.min(1)]
    ],

    quantityIssued: [
      '',
      [Validators.required, Validators.min(1)]
    ],

    itemCondition: ['', Validators.required],

    unitPrice: [
      null,
      [Validators.required, Validators.min(0.01)]
    ],

    value: this.fb.control({ value: 0, disabled: true })
  });
}


  private loadSpendNotes() {
    this.http.get<any[]>('https://newwinventoryapi.runasp.net/api/SpendNotes')
      .subscribe({
        next: (notes) => {
          // فلترة المذكرات الغير مؤكدين والمقبولين
          const filteredNotes = notes.filter(n =>
            n.permissinStatus === 'الطلب مقبول' &&
            n.confirmationStatus === 'لم يؤكد'
          );

          // تجميع حسب الاسم + التاريخ + الفئة + الجهة
          const groupedNotes = this.groupNotes(filteredNotes);

          // ملأ الفورمز
          this.fillFormsFromGroups(groupedNotes);
        },
        error: err => console.error('Error fetching spend notes:', err)
      });
  }
  /** getter آمن لـ tableData لفورم معين */
getTableData(form: FormGroup): FormArray {
  return form.get('tableData') as FormArray;
}

/** إزالة صف من فورم */
removeRowFromForm(form: FormGroup) {
  const tableArray = this.getTableData(form);
  if (tableArray.length > 1) {
    tableArray.removeAt(tableArray.length - 1);
  }
}

  /** تجميع المذكرات */
  private groupNotes(notes: any[]): any[][] {
    const groups: { [key: string]: any[] } = {};
    notes.forEach(note => {
      const key = `${note.userSignature}|${note.requestDate.slice(0,10)}|${note.category}|${note.college}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(note);
    });
    return Object.values(groups);
  }

  /** ملأ الفورمز */
  private fillFormsFromGroups(groups: any[][]) {
    this.consumableForms = [];
    this.filteredItemsByRow = [];

    groups.forEach(group => {
      const form = this.createForm();
      const firstNote = group[0];

      form.patchValue({
        destinationName: firstNote.college,
        category: firstNote.category,
        requestDateGroup: firstNote.requestDate.slice(0,10),
        requestorName: firstNote.userSignature
      });

      const tableArray = form.get('tableData') as FormArray;

      group.forEach(note => {
        const rowGroup = this.createTableRowFormGroup();
        rowGroup.patchValue({
          itemName: note.itemName,
          itemSearchText: note.itemName,
          category: note.category,
          quantityRequired: note.quantity,
          unit: this.getItemDefaults(note.itemName).unit,
          storeType: this.getItemDefaults(note.itemName).storeType,
          itemCondition: 'جديدة',
          quantityAuthorized: '',
          quantityIssued: '',
          unitPrice: '',
          value: 0
        });
        tableArray.push(rowGroup);
      });

      this.consumableForms.push(form);
      this.filteredItemsByRow.push(tableArray.controls.map(() => []));
    });
  }

  /** كالكوليشن للقيمة */
  updateValue(formIndex: number, rowIndex: number) {
    const row = (this.consumableForms[formIndex].get('tableData') as FormArray).at(rowIndex);
    const quantity = Number(row.get('quantityIssued')?.value || 0);
    const unitPrice = Number(row.get('unitPrice')?.value || 0);
    row.patchValue({ value: quantity * unitPrice }, { emitEvent: false });
  }

  /** حفظ الفورم */
onSubmitForm(form: FormGroup) {

  // 1️⃣ فاليديشن الفورم الأساسي
  if (form.invalid) {
    form.markAllAsTouched();
    this.scrollToFirstInvalidControl(form);
    return;
  }

  // 2️⃣ فاليديشن الصفوف (tableData)
  const tableArray = form.get('tableData') as FormArray;

  let hasRowError = false;

  tableArray.controls.forEach(control => {
  const row = control as FormGroup; // 👈 الحل هنا

  Object.values(row.controls).forEach(ctrl => {
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity();
  });

  if (row.invalid) {
    hasRowError = true;
  }
});


  if (hasRowError) {
    this.scrollToFirstInvalidControl(form);
    return;
  }

  // ===============================
  // لو وصلنا هنا → كله VALID ✅
  // ===============================

  this.isSubmitting.set(true);
  const formVal = form.value;

  const basePayload = {
    destinationName: formVal.destinationName,
    category: formVal.category,
    managerSignature: formVal.managerSignature,
    storeHouse: formVal.category,
    requestDate: new Date(formVal.requestDateGroup).toISOString(),
    documentDate: new Date(formVal.regularDateGroup + 'T00:00:00').toISOString(),
    requestorName: formVal.requestorName,
    documentNumber: formVal.documentNumber
  };

  // اسم مختلف عشان مايحصلش redeclare
  const tableRows = formVal.tableData;

  const saveRequests = tableRows.map((row: any) => {
    return this.http.post(
      'https://newwinventoryapi.runasp.net/api/SpendPermissions',
      {
        ...basePayload,
        itemName: row.itemName,
        unit: row.unit,
        storeType: row.storeType,
        requestedQuantity: Number(row.quantityRequired),
        approvedQuantity: Number(row.quantityAuthorized),
        issuedQuantity: Number(row.quantityIssued),
        storeHouse: row.storeType,
        stockStatus: row.itemCondition,
        unitPrice: Number(row.unitPrice),
        totalValue: Number(row.quantityIssued) * Number(row.unitPrice)
      }
    ).toPromise();
  });

  Promise.all(saveRequests)
    .then(() =>
      this.http
        .get<any[]>('https://newwinventoryapi.runasp.net/api/SpendNotes')
        .toPromise()
    )
    .then(notes => {
      if (!notes) return;

      const notesToUpdate = notes.filter(n =>
        n.permissinStatus === 'الطلب مقبول' &&
        n.confirmationStatus === 'لم يؤكد' &&
        n.category === formVal.category &&
        n.college === formVal.destinationName &&
        n.requestDate?.slice(0, 10) === formVal.requestDateGroup
      );

      const updateRequests = notesToUpdate.map(note =>
        this.http.put(
          `https://newwinventoryapi.runasp.net/api/SpendNotes/${note.id}`,
          {
            ...note,
            confirmationStatus: 'مؤكد'
          }
        ).toPromise()
      );

      return Promise.all(updateRequests);
    })
    .then(() => {
      this.statusMessage = 'تم الحفظ وتأكيد الاذن بنجاح ✅';
      this.statusType = 'success';

      const index = this.consumableForms.indexOf(form);
      if (index > -1) {
        this.consumableForms.splice(index, 1);
      }

      this.isSubmitting.set(false);
    })
    .catch(err => {
      console.error('Save error:', err);
      this.statusMessage = 'حدث خطأ أثناء الحفظ ❌';
      this.statusType = 'error';
      const hasStockError = this.checkStockForForm(form);

if (hasStockError) {
  this.scrollToFirstInvalidControl(form);
  return;
}

      this.isSubmitting.set(false);
    });
}




  /** إضافة صف لفورم معين */
  addRowToForm(form: FormGroup) {
    const tableArray = form.get('tableData') as FormArray;
    tableArray.push(this.createTableRowFormGroup());
  }


  // Inside your class properties:
statusMessage: string | null = null;
statusType: 'success' | 'error' | null = null;

// Method to close
closeStatusMessage(): void {
  this.statusMessage = null;
  this.statusType = null;
}


}
