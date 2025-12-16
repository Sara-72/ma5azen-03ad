import { Component ,OnInit,inject , signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, FormBuilder,ReactiveFormsModule, FormGroup,FormArray,ValidationErrors, ValidatorFn, Validators,AbstractControl} from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
// Assuming you have an ApiService to handle HTTP requests
// import { ApiService } from '../services/api.service';




interface ConsumableRow {

  itemName: string;
  unit: string;
  quantityRequired: string;
  quantityAuthorized: string;
  quantityIssued: string;
  itemCondition: string;
  unitPrice: string;
  value: string;
}

/**
 * Validates that the input string contains exactly four distinct words (strings separated by spaces).
 */
export function fourStringsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Let Validators.required handle the empty state
    }

    // Trim whitespace and split by one or more spaces, filtering out empty strings.
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
  selector: 'app-modeer2',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,

    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './modeer2.component.html',
  styleUrl: './modeer2.component.css'
})

export class Modeer2Component implements OnInit {
// ------------------- SEARCHABLE DROPDOWN PROPERTIES (ADDED) -------------------
// --- DATA PROPERTIES ---
  days: string[] = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  months: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  years: string[] = Array.from({ length: 100 }, (_, i) => String(2000 + i));



  // Define your categories
categories: string[] = ['أثاث', 'أجهزة', 'مستهلكات', 'تنظيف'];

// Define the data mapping (Category to Item List)
itemData: { [key: string]: string[] } = {
    'أثاث': ['مكاتب', 'كراسي', 'خزائن'],
    'أجهزة': ['شاشات', 'طابعات', 'كمبيوتر'],
    'مستهلكات': ['أقلام', 'ورق A4', 'ملفات'],
    'تنظيف': ['مطهرات', 'صابون', 'مناديل']
}

  // Master list of all item names
  itemNames: string[] = ['أثاث', 'قرطاسية', 'إلكترونيات', 'أدوات نظافة', 'خزائن ملفات', 'أجهزة عرض', 'مواد كيميائية'];
  itemConditions: string[] = ['جديدة', 'مستعمل', 'قابل للإصلاح', 'كهنة أو خردة'];
  documentNumbers: string[] = [' كشف العجز', ' سند خصم', ' أصناف تالفة أو تالفة', ' محضر بيع جلب تشغيل-', ' إهداءات ليست للنشاط الرئيسي للجهة'];

  // Array to hold the list of item names currently displayed in the Datalist/Dropdown (updated by the filter)
  filteredItemNames: string[] = [];

  // --- FORM PROPERTIES ---
  tableRows: ConsumableRow[] = [this.createEmptyRow()];
  consumableForm!: FormGroup;
  isSubmitting = signal(false);

  // --- DEPENDENCY INJECTION ---
  private fb = inject(FormBuilder);

  constructor(private http: HttpClient) {
    this.consumableForm = this.fb.group({
      // Top Info Section Fields - ALL REQUIRED
      destinationName: ['', Validators.required],
      storehouse: ['', Validators.required],

      // Date Groups
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

      // Table Data using FormArray
      tableData: this.fb.array([])
    });

    // Initialize the filtered list to show all items initially
    this.filteredItemNames = [...this.itemNames];
  }

  ngOnInit(): void {
    // Initialize the FormArray with the initial row data
    this.tableRows.forEach(() => {
      this.tableData.push(this.createTableRowFormGroup());
    });
  }

  // Helper getter to easily access the FormArray
  get tableData(): FormArray {
    return this.consumableForm.get('tableData') as FormArray;
  }

  // Helper function to create the form group for a single table row
  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      category: ['', Validators.required],
      // MANDATORY FIELDS FOR VALIDATION
      itemName: ['', Validators.required], // Final value of the selected item
      unit: ['', Validators.required],
      quantityRequired: ['', Validators.required],

      // Optional/Default fields
      quantityAuthorized: [''],
      quantityIssued: [''],
      itemCondition: [''],
      unitPrice: [''],
      value: [''],

      // Control to hold the search text (must be defined for the HTML to bind)
      itemSearchText: ['']
    });
  }

  // Helper function to create an empty row object
  private createEmptyRow(): ConsumableRow {
    return {
      itemName: '', unit: '', quantityRequired: '',
      quantityAuthorized: '', quantityIssued: '', itemCondition: '',
      unitPrice: '', value: ''
    };
  }

  // ------------------- SEARCHABLE INPUT METHOD -------------------

  /**
   * Filters the global item list based on the user's input in any row.
   * This is used to populate the Datalist associated with the search input.
   */
// 🚨 UPDATE filterItemOptions to use the selected category for the master list
filterItemOptions(event: Event, rowIndex: number): void {
    const searchText = (event.target as HTMLInputElement).value;

    // 1. Get the category for the current row
    const categoryControl = this.tableData.at(rowIndex).get('category');
    const selectedCategory = categoryControl ? categoryControl.value : '';

    // 2. Determine the master list based on the category
    const masterList = this.itemData[selectedCategory] || this.itemNames;

    if (!searchText) {
        this.filteredItemNames = [...masterList]; // Show all items for that category
        return;
    }
    const term = searchText.toLowerCase();

    // 3. Filter and update the global list (still affects all rows)
    this.filteredItemNames = masterList.filter(name =>
        name.toLowerCase().includes(term)
    );
}




  // 🚨 Add this helper function
/**
 * Helper function to safely extract the value from a change event on a select element.
 * @param event The native DOM event object.
 */
getCategoryValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
}


// 🚨 Add the category change logic
/**
 * Handles the change event on the Category select.
 * 1. Resets the Item Name and Search Text controls for the affected row.
 * 2. Updates the global filteredItemNames list based on the new category (temporarily).
 * @param category The newly selected category string.
 * @param rowIndex The index of the row being edited.
 */
updateFilteredItems(category: string, rowIndex: number): void {
    // 1. Update the global list of available items based on the selected category
    // NOTE: This array is global, meaning changing the category in ONE row affects the Datalist options in ALL rows.
    // This is a known limitation of using a single global list for Datalist.
    this.filteredItemNames = this.itemData[category] || [];

    // 2. Get the specific row group
    const rowGroup = this.tableData.at(rowIndex);

    // 3. Reset related controls in that row (critical for validation)
    rowGroup.get('itemName')?.setValue('');
    rowGroup.get('itemSearchText')?.setValue('');
}



/**
 * Gets the list of available items for a specific row based on its selected category.
 * This is used to populate the Datalist options in the HTML.
 * @param rowIndex The index of the table row being rendered.
 * @returns An array of item names for that category, or an empty array.
 */
getFilteredItemsForRow(rowIndex: number): string[] {
    const rowGroup = this.tableData.at(rowIndex);

    // Check if the row exists
    if (!rowGroup) {
        return [];
    }

    // Get the category value for this specific row
    const category = rowGroup.get('category')?.value;

    // Return the list of items mapped to that category from itemData
    if (!category || !this.itemData[category]) {
        return [];
    }

    // Return the master list for that specific category
    return this.itemData[category];
}




  // ------------------- ROW MANAGEMENT LOGIC -------------------

  addRow(): void {
    this.tableRows.push(this.createEmptyRow());
    this.tableData.push(this.createTableRowFormGroup());
  }

  removeRow(): void {
    if (this.tableRows.length > 1) {
      this.tableRows.pop();
      this.tableData.removeAt(this.tableData.length - 1);
    } else if (this.tableRows.length === 1) {
      this.tableData.at(0).reset();
    }
  }

  // ------------------- SUBMISSION LOGIC -------------------

  onSubmit(): void {
    if (this.consumableForm.invalid) {
      this.consumableForm.markAllAsTouched();
      console.warn('Form is invalid. Cannot submit.');
      return;
    }

    this.isSubmitting.set(true);

    const reqDate = this.consumableForm.value.requestDateGroup;
    const docDate = this.consumableForm.value.regularDateGroup;

    const basePayload = {
      destinationName: this.consumableForm.value.destinationName,
      storeHouse: this.consumableForm.value.storehouse,

      // Construct Date objects and convert to ISO string format
      requestDate: new Date(reqDate.yy, reqDate.mm - 1, reqDate.dd).toISOString(),
      documentDate: new Date(docDate.yy, docDate.mm - 1, docDate.dd).toISOString(),

      requestorName: this.consumableForm.value.requestorName,
      documentNumber: this.consumableForm.value.documentNumber
    };

    const requests = this.tableData.value.map((row: any) => {
      const payload = {
        ...basePayload,

        itemName: row.itemName,
        unit: row.unit,
        requestedQuantity: Number(row.quantityRequired),
        approvedQuantity: Number(row.quantityAuthorized || 0),
        issuedQuantity: Number(row.quantityIssued || 0),
        stockStatus: row.itemCondition || 'جديدة',
        unitPrice: Number(row.unitPrice || 0),
        totalValue: Number(row.value || 0)
      };

      return this.http.post(
        'http://newwinventoryapi.runasp.net/api/SpendPermissions',
        payload
      );
    });

    Promise.all(requests.map((r: any) => r.toPromise()))
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


