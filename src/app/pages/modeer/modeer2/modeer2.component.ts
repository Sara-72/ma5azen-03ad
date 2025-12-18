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

/**
 * Validator for exactly four words
 */
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

  // -------------------- DATA --------------------
  storeTypes = ['مستديم', 'مستهلك'];

  storeKeeperStocks: any[] = [];      // بيانات المخزن من API
  filteredItemsByRow: string[][] = [];
  allCategories: string[] = [];       // 👈 هتتملأ من category (camelCase)

  itemConditions = ['جديدة', 'مستعمل', 'قابل للإصلاح', 'كهنة أو خردة'];
  documentNumbers = [' كشف العجز', ' سند خصم', ' أصناف تالفة', ' محضر بيع', ' إهداءات'];

  consumableForm!: FormGroup;
  isSubmitting = signal(false);

  constructor() {
    this.initForm();
  }

  // -------------------- INIT --------------------
  ngOnInit(): void {
    this.modeerService.getStoreKeeperStocks().subscribe({
      next: (response: any[]) => {

        console.log('Raw API response:', response);

        this.storeKeeperStocks = response || [];

        // ✅ FIX 1: استخدام camelCase بدل PascalCase
        this.allCategories = Array.from(
          new Set(
            this.storeKeeperStocks
              .map(s => s.category)       // 👈 كان Category
              .filter(c => c && c.trim() !== '')
          )
        );

        console.log('All categories:', this.allCategories);

        this.addRow();
      },
      error: err => console.error('Error fetching stocks:', err)
    });
  }

  // -------------------- FORM --------------------
  private initForm() {
    this.consumableForm = this.fb.group({
      destinationName: ['', Validators.required],
      category: ['', Validators.required], // الفئة الرئيسية في الأعلى

      requestDateGroup: ['', Validators.required],
      regularDateGroup: ['', Validators.required],

      requestorName: ['', [Validators.required, fourStringsValidator()]],
      documentNumber: ['', Validators.required],

      // ✅ FIX 2: تغيير اسم control لإمضاء المدير ليكون متطابق مع Backend
      managerSignature: ['', [Validators.required, fourStringsValidator()]],

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

  // -------------------- CATEGORY CHANGE --------------------
  onGlobalCategoryChange(event: Event) {
    const selectedCategory = (event.target as HTMLSelectElement).value;

    this.tableData.controls.forEach((_, index) => {
      this.updateFilteredItemsForSingleRow(selectedCategory, index);
    });
  }

  private updateFilteredItemsForSingleRow(category: string, index: number) {

    // ✅ FIX 3: camelCase في الفلترة
    const itemsForCategory = this.storeKeeperStocks
      .filter(stock => stock.category === category)
      .map(stock => stock.itemName);

    this.filteredItemsByRow[index] = itemsForCategory;

    const row = this.tableData.at(index);
    row.patchValue({
      itemSearchText: '',
      itemName: '',
      unit: '',
      unitPrice: ''
    });
  }

  // -------------------- ROWS --------------------
  addRow(): void {
    const newGroup = this.createTableRowFormGroup();
    this.tableData.push(newGroup);

    const index = this.tableData.length - 1;
    const currentCategory = this.consumableForm.get('category')?.value;

    if (currentCategory) {
      this.updateFilteredItemsForSingleRow(currentCategory, index);
    } else {
      this.filteredItemsByRow.push([]);
    }
  }

  removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.removeAt(this.tableData.length - 1);
      this.filteredItemsByRow.pop();
    }
  }

  // -------------------- SEARCH --------------------
  filterItemOptions(event: any, index: number) {
    const searchTerm = event.target.value.toLowerCase();
    const category = this.consumableForm.get('category')?.value;
    if (!category) return;

    // ✅ FIX 4
    this.filteredItemsByRow[index] = this.storeKeeperStocks
      .filter(s => s.category === category)
      .map(s => s.itemName)
      .filter(name => name.toLowerCase().includes(searchTerm));
  }

  syncItemName(index: number) {
    const row = this.tableData.at(index);
    const searchText = row.get('itemSearchText')?.value;

    // ✅ FIX 5
    const selectedItem = this.storeKeeperStocks.find(
      stock =>
        stock.itemName === searchText &&
        stock.category === this.consumableForm.get('category')?.value
    );

    if (selectedItem) {
      row.patchValue({
        itemName: selectedItem.itemName,
        unit: selectedItem.unit,
        unitPrice: selectedItem.unitPrice 
      });
    } else {
      row.patchValue({
        itemName: searchText,
        unit: '',
        unitPrice: 0
      });
    }
  }

  getFilteredItemsForRow(index: number): string[] {
    return this.filteredItemsByRow[index] || [];
  }

  // -------------------- SUBMIT --------------------
  onSubmit(): void {
    if (this.consumableForm.invalid) {
      this.consumableForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.consumableForm.value;

    // ✅ FIX 6: إضافة الفئة وامضاء المدير في payload
    const basePayload = {
      destinationName: formVal.destinationName,
      category: formVal.category,              // 👈 الفئة الرئيسية
      managerSignature: formVal.managerSignature, // 👈 إمضاء المدير
      storeHouse: formVal.category,            // لو لازمه للـ API
      requestDate: new Date(formVal.requestDateGroup).toISOString(),
      documentDate: new Date(formVal.regularDateGroup).toISOString(),
      requestorName: formVal.requestorName,
      documentNumber: formVal.documentNumber
    };

    const requests = this.tableData.value.map((row: any) => {
      return this.http.post(
        'http://newwinventoryapi.runasp.net/api/SpendPermissions',
        {
          ...basePayload,
          itemName: row.itemName,
          unit: row.unit,
          storeType: row.storeType,
          requestedQuantity: Number(row.quantityRequired),
          approvedQuantity: Number(row.quantityAuthorized || 0),
          issuedQuantity: Number(row.quantityIssued || 0),
          stockStatus: row.itemCondition || 'جديدة',
          unitPrice: Number(row.unitPrice || 0),
          totalValue: Number(row.value)
        }
      );
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
