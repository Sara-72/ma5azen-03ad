import { Component ,OnInit,inject , signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, FormBuilder,ReactiveFormsModule, FormGroup, Validators ,FormArray } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
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
@Component({
  selector: 'app-modeer2',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './modeer2.component.html',
  styleUrl: './modeer2.component.css'
})

export class Modeer2Component implements OnInit {

// --- PROPERTIES FOR DROPDOWN OPTIONS (New) ---
  // Date Arrays
  days: string[] = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')); // "01" to "31"
  months: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')); // "01" to "12"
  years: string[] = Array.from({ length: 100 }, (_, i) => String(2000 + i));// "00" to "99" (Last 2 digits of year)

  // Item Name and Condition Arrays (Example data - replace with your actual options)
  itemNames: string[] = ['أثاث', 'قرطاسية', 'إلكترونيات', 'أدوات نظافة'];
  itemConditions: string[] = ['جديدة', 'مستعمل', 'قابل للإصلاح', 'كهنة أو خردة'];
  documentNumbers:string[]=[' كشف العجز',' سند خصم' ,' أصناف تالفة أو تالفة ',' محضر بيع جلب تشغيل-',' إهداءات ليست للنشاط الرئيسي للجهة']


  // --- FORM PROPERTIES ---
  tableRows: ConsumableRow[] = [this.createEmptyRow()];
  consumableForm!: FormGroup;
  isSubmitting = signal(false);

  // --- DEPENDENCY INJECTION ---
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // --- CONSTRUCTOR & INITIALIZATION ---
  constructor() {
    this.consumableForm = this.fb.group({
      // Top Info Section Fields - ALL REQUIRED
      destinationName: ['', Validators.required],
      storehouse: ['', Validators.required],

      // Date Groups - Now relying on selection (dropdowns)
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


      requestorName: ['', Validators.required], // Matches 'اسم الطالب'
      documentNumber: ['', Validators.required], // Matches 'سند الصرف'

      // Table Data using FormArray
      tableData: this.fb.array([])
    });
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
      // MANDATORY FIELDS FOR VALIDATION

      itemName: ['', Validators.required], // اسم الصنف (Dropdown)
      unit: ['', Validators.required], // الوحدة
      quantityRequired: ['', Validators.required], // الكمية المطلوبة

      // OPTIONAL FIELDS
      quantityAuthorized: [''], // الكمية المصرح بها
      quantityIssued: [''], // الكمية المنصرفة
      itemCondition: [''], // حالة الصنف (Dropdown - made optional but selection still works)
      unitPrice: [''], // سعر الوحدة
      value: [''] // القيمة
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

  // --- ROW MANAGEMENT LOGIC ---
  addRow(): void {
    this.tableRows.push(this.createEmptyRow());
    this.tableData.push(this.createTableRowFormGroup());
  }

  removeRow(): void {
    if (this.tableRows.length > 1) {
      this.tableRows.pop();
      this.tableData.removeAt(this.tableData.length - 1);
    } else if (this.tableRows.length === 1) {
      // Clear data in the single remaining FormGroup but don't remove the row
      this.tableData.at(0).reset();
    }
  }

  // --- SAVE BUTTON LOGIC ---
  onSubmit(): void {
    if (this.consumableForm.invalid) {
      // Marks all controls as touched to display validation errors
      this.consumableForm.markAllAsTouched();
      console.warn('Form is invalid. Cannot submit.');
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.consumableForm.value;
    console.log('Sending Form Data:', formData);

    setTimeout(() => {
      console.log('Request submitted successfully!');
      this.isSubmitting.set(false);
    }, 2000);
  }
    // -------------------------------------
  }


