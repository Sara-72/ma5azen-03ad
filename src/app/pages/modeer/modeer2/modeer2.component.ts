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
      regularDateGroup: ['', Validators.required],
      requestorName: ['', [Validators.required, fourStringsValidator()]],
      documentNumber: ['', Validators.required],
      managerSignature: ['', [Validators.required, fourStringsValidator()]],
      tableData: this.fb.array([])
    });
  }

  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      storeType: ['', Validators.required],
      itemName: [''],
      itemSearchText: [''],
      category: [''],
      unit: [''], 
      quantityRequired: [''],
      quantityAuthorized: [''],
      quantityIssued: [''],
      itemCondition: [''],
      unitPrice: [''],
      value: this.fb.control({ value: 0, disabled: true })
    });
  }

  private loadSpendNotes() {
    this.http.get<any[]>('http://newwinventoryapi.runasp.net/api/SpendNotes')
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
          unit: '',
          storeType: '',
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
  if (form.invalid) {
    form.markAllAsTouched();
    return;
  }

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

  const tableData = formVal.tableData;

  // حفظ كل صفوف الفورم الحالي
  const saveRequests = tableData.map((row: any) => {
    return this.http.post('http://newwinventoryapi.runasp.net/api/SpendPermissions', {
      ...basePayload,
      itemName: row.itemName,
      unit: row.unit,
      storeType: row.storeType,
      requestedQuantity: Number(row.quantityRequired || 0),
      approvedQuantity: Number(row.quantityAuthorized || 0),
      issuedQuantity: Number(row.quantityIssued || 0),
      storeHouse: row.storeType,
      stockStatus: row.itemCondition || 'جديدة',
      unitPrice: Number(row.unitPrice || 0),
      totalValue: Number(row.quantityIssued || 0) * Number(row.unitPrice || 0)
    }).toPromise();
  });

  Promise.all(saveRequests)
    .then(() => this.http.get<any[]>('http://newwinventoryapi.runasp.net/api/SpendNotes').toPromise())
    .then(notes => {
      if (!notes) return;

      // فلترة المذكرات المرتبطة فقط بالفورم الحالي
      const notesToUpdate = notes.filter(n =>
        n.permissinStatus === 'الطلب مقبول' &&
        n.confirmationStatus === 'لم يؤكد' &&
        n.category === formVal.category &&
        n.college === formVal.destinationName &&
        n.requestDate?.slice(0,10) === formVal.requestDateGroup
      );

      // تحديث الحالة فقط لهذه المذكرات
      const updateRequests = notesToUpdate.map(note =>
        this.http.put(`http://newwinventoryapi.runasp.net/api/SpendNotes/${note.id}`, {
          ...note,
          confirmationStatus: 'مؤكد'
        }).toPromise()
      );

      return Promise.all(updateRequests);
    })
    .then(() => {
  alert('تم الحفظ وتأكيد المذكرات بنجاح ✅');

  // إزالة الفورم الحالي من الصفحة
  const index = this.consumableForms.indexOf(form);
  if (index > -1) {
    this.consumableForms.splice(index, 1);
  }

  this.isSubmitting.set(false);
})

    .catch(err => {
      console.error('Save error:', err);
      alert('حدث خطأ أثناء الحفظ ❌');
      this.isSubmitting.set(false);
    });
}


  /** إضافة صف لفورم معين */
  addRowToForm(form: FormGroup) {
    const tableArray = form.get('tableData') as FormArray;
    tableArray.push(this.createTableRowFormGroup());
  }

}
