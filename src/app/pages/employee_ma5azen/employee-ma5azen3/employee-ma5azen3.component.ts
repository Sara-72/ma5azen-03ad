import { Component ,OnDestroy,OnInit, inject, signal} from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormsModule, FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
// Assuming you have an ApiService to handle HTTP requests
// import { ApiService } from '../services/api.service';




interface SimpleRow {
  item: string;      // الصنف
  category: string;  // الفئة
  // date: string;      // الكود
  count: string;     // العدد
}

interface CategoryItemMap {
  [key: string]: string[];
}


@Component({
  selector: 'app-employee-ma5azen3',
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-ma5azen3.component.html',
  styleUrl: './employee-ma5azen3.component.css'
})
export class EmployeeMa5azen3Component implements OnInit,OnDestroy{

    // days: string[] = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')); // "01" to "31"
    // months: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')); // "01" to "12"
    // years: string[] = Array.from({ length: 100 }, (_, i) => String(2000 + i));// "00" to "99" (Last 2 digits of year)


    categoryItemMap: CategoryItemMap = {
    'أثاث مكتبي': ['مكتب مدير', 'كرسي دوار', 'خزانة ملفات'],
    'قرطاسية': ['أقلام حبر', 'أوراق A4', 'دفاتر ملاحظات'],
    'إلكترونيات': ['حاسوب محمول', 'طابعة ليزر', 'شاشة عرض'],
    'أدوات نظافة': ['مطهرات', 'مكانس', 'مناشف ورقية']
  };

  categories: string[] = Object.keys(this.categoryItemMap);

  // NEW: Array to hold available items for each *specific* row
  availableItemsByRow: string[][] = [];

  // NEW: Array to hold subscriptions for cleaning up when the component is destroyed
  private subscriptions: Subscription[] = [];


  simpleForm!: FormGroup;
  isSubmitting = signal(false);

  // Dependency Injection
  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.simpleForm = this.fb.group({
      // The only control is the FormArray for the table data


      tableData: this.fb.array([])
    });



  }
ngOnInit(): void {
    // 1. Create the single instance of the first row
    const initialRowGroup = this.createTableRowFormGroup();

    // 2. Push this instance into the FormArray
    this.tableData.push(initialRowGroup);

    // 3. Initialize available items for index 0
    this.availableItemsByRow.push([]);

    // 4. Attach the listener to the correct instance (initialRowGroup) at the correct index (0)
    this.addCategoryListener(initialRowGroup, 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Helper getter to easily access the FormArray
  get tableData(): FormArray {
    return this.simpleForm.get('tableData') as FormArray;
  }

  // Helper function to create the form group for a single table row (4 columns)
  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      item: [null,Validators.required],
      category: ['',Validators.required],

    //   dateGroup: this.fb.group({
    //     yy: ['', Validators.required],
    //     mm: ['', Validators.required],
    //     dd: ['', Validators.required]
    // }),
      count: ['', Validators.required]
    });
  }



  // Helper function to handle the cascading logic
  private addCategoryListener(rowGroup: FormGroup, index: number): void {
    const sub = rowGroup.get('category')?.valueChanges.subscribe(selectedCategory => {
      // 1. Get the list of items for the selected category
      const items = this.categoryItemMap[selectedCategory] || [];

      // 2. Update the available items list for this specific row index
      this.availableItemsByRow[index] = items;

      // 3. Reset the itemName dropdown for this row, forcing the user to select a new item
      rowGroup.get('item')?.reset(null, { emitEvent: false });
    });

    if (sub) {
        this.subscriptions.push(sub);
    }
  }

  // ➕ Method to add a new row
  addRow(): void {
    const newRowGroup = this.createTableRowFormGroup();
    const newIndex = this.tableData.length; // Get the index BEFORE pushing

    this.tableData.push(newRowGroup);

    //  Initialize new slot for items
    this.availableItemsByRow.push([]);

    // Attach listener to the new row
    this.addCategoryListener(newRowGroup, newIndex);
  }


// ➖ Method to remove the last row
    removeRow(): void {
      if (this.tableData.length > 1) {
        const lastIndex = this.tableData.length - 1;

        // Clean up the subscription
        if (this.subscriptions.length > 0) {
          this.subscriptions.pop()?.unsubscribe();
        }

        // Remove the available items array slot
        this.availableItemsByRow.pop();

        this.tableData.removeAt(lastIndex);
      } else if (this.tableData.length === 1) {
        this.tableData.at(0).reset();
      }
    }

  // --- SAVE BUTTON LOGIC ---

onSubmit(): void {
      if (this.simpleForm.invalid) {
        this.simpleForm.markAllAsTouched();
        console.warn('Form is invalid. Cannot submit.');
        return;
      }

      this.isSubmitting.set(true);
      const formData = this.simpleForm.value;
      console.log('Sending Form Data:', formData);

      setTimeout(() => {
        console.log('Request submitted successfully!');
        this.isSubmitting.set(false);
        // router navigation logic here
      }, 2000);
    }
}
