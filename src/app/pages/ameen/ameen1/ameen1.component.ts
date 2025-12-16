import { Component ,OnInit, inject, signal ,OnDestroy} from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';
import { FormsModule, FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  StoreKeeperStockService,
  StockResponse
} from '../../../services/store-keeper-stock.service';

// Assuming you have an ApiService to handle HTTP requests
// import { ApiService } from '../services/api.service';




interface SimpleRow {
  item: string;      // الصنف
  category: string;  // الفئة
  // date: string;      // التاريخ
  count: string;     // العدد
}


interface CategoryItemMap {
  [key: string]: string[];
}

@Component({
  selector: 'app-ameen1',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    ReactiveFormsModule,CommonModule
  ],
  templateUrl: './ameen1.component.html',
  styleUrl: './ameen1.component.css'
})


export class Ameen1Component implements OnInit ,OnDestroy{

    categoryItemMap: CategoryItemMap = {
    'أثاث مكتبي': ['مكتب مدير', 'كرسي دوار', 'خزانة ملفات'],
    'قرطاسية': ['أقلام حبر', 'أوراق A4', 'دفاتر ملاحظات'],
    'إلكترونيات': ['حاسوب محمول', 'طابعة ليزر', 'شاشة عرض'],
    'أدوات نظافة': ['مطهرات', 'مكانس', 'مناشف ورقية']
  };

  categories: string[] = Object.keys(this.categoryItemMap);

  // NEW: Array to hold available items for each *specific* row
  availableItemsByRow: string[][] = [];
  itemTypes: string[] = ['مستهلك', 'مستديم'];

  // NEW: Array to hold subscriptions for cleaning up when the component is destroyed
  private subscriptions: Subscription[] = [];
  userName: string = '';
  displayName: string = '';



  simpleForm!: FormGroup;
  isSubmitting = signal(false);

  // Dependency Injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private stockService = inject(StoreKeeperStockService);


  constructor() {
    this.simpleForm = this.fb.group({
      // The only control is the FormArray for the table data


      tableData: this.fb.array([])
    });



  }
  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    // 1. Create the single instance of the first row
    const initialRowGroup = this.createTableRowFormGroup();

    // 2. Push this instance into the FormArray
    this.tableData.push(initialRowGroup);

    // 3. Initialize available items for index 0
    this.availableItemsByRow.push([]);

    // 4. Attach the listener to the correct instance (initialRowGroup) at the correct index (0)
    this.addCategoryListener(initialRowGroup, 0);
  }
  getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';

    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');
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
      count: ['', Validators.required],
      itemType: ['', Validators.required], // نوع الصنف
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
  private handleComplete(done: number, total: number) {
  if (done === total) {
    this.isSubmitting.set(false);
    alert('تم حفظ البيانات بنجاح');

    this.simpleForm.reset();
    this.tableData.clear();
    this.addRow();
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
    return;
  }

  this.isSubmitting.set(true);

  const rows = this.simpleForm.value.tableData;
  let completed = 0;
  const total = rows.length;

  rows.forEach((row: any) => {
    const itemName = row.item;
    const category = row.category;
    const newQuantity = Number(row.count);

    // جلب كل المخزون بدل getStock إذا getStock بيرجع null
    this.stockService.getAllStocks().pipe(
      catchError(() => of([])) // لو GET رجعت خطأ نحولها لمصفوفة فارغة
    ).subscribe(stocks => {
      // البحث عن الصنف بنفس الاسم والفئة
      const existing = stocks.find((s: any) =>
        s.itemName === itemName && s.category === category
      );

      if (existing) {
        // UPDATE
        const updatedBody = {
          stock: {
            itemName: existing.itemName,
            category: existing.category,
            quantity: existing.quantity + newQuantity
          }
        };

        this.stockService.updateStock(existing.id, updatedBody).subscribe({
          next: () => this.handleComplete(++completed, total),
          error: () => this.handleComplete(++completed, total)
        });
      } else {
        // ADD جديد
        const addBody = {
          stock: {
            itemName: itemName,
            category: category,
            quantity: newQuantity
          }
        };

        this.stockService.addStock(addBody).subscribe({
          next: () => this.handleComplete(++completed, total),
          error: () => this.handleComplete(++completed, total)
        });
      }
    });
  });
}







}
