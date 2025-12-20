import { Component ,OnInit, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { catchError, lastValueFrom, Observable, of } from 'rxjs';
import { LedgerService, LedgerEntry } from '../../../services/ledger.service';


@Component({
  selector: 'app-ameen2',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './ameen2.component.html',
  styleUrl: './ameen2.component.css'
})
export class Ameen2Component implements OnInit {

 userName: string = '';
  displayName: string = '';


  assetTypes: string[] = ['مستهلك', 'مستديم'];

  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);
  private ledgerService = inject(LedgerService);

  constructor() {
  this.inventoryLogForm = this.fb.group({

    assetType: ['', Validators.required],
    tableData: this.fb.array([])
  });
}

  ngOnInit(): void {
     this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    // Start with one empty row
    this.tableData.push(this.createTableRowFormGroup());
  }
 getFirstTwoNames(fullName: string): string {
    if (!fullName) return '';

    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');
  }

  // Helper getter to easily access the FormArray
  get tableData(): FormArray {
    return this.inventoryLogForm.get('tableData') as FormArray;
  }

  // Helper function to create the form group for a single table row (7 columns)
  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      date: ['',Validators.required],             // التاريخ

      sourceOrDestination: ['',Validators.required], // وارد من / منصرف إلى
      addedValue: ['',Validators.required],       // قيمة الأصناف المضافة
      issuedValue: ['',Validators.required],      // قيمة الأصناف المنصرفة



    });
  }

  //  Method to add a new row
  addRow(): void {
    this.tableData.push(this.createTableRowFormGroup());
  }

  // Method to remove the last row
  removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.removeAt(this.tableData.length - 1);
    } else if (this.tableData.length === 1) {
      this.tableData.at(0).reset();
    }
  }

  // --- SAVE BUTTON LOGIC ---

 onSubmit(): void {
  if (this.inventoryLogForm.invalid) {
    this.inventoryLogForm.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);

  const requests = this.tableData.value.map((row: any, index: number) => {

  const entry: LedgerEntry = {
  date: new Date(row.date).toISOString(),
  documentReference: row.sourceOrDestination,
  addedItemsValue: Number(row.addedValue) || 0,
  issuedItemsValue: Number(row.issuedValue) || 0,
  storeType: this.assetTypes.indexOf(
    this.inventoryLogForm.value.assetType
  ) + 1, // 1 أو 2 زي Swagger
  spendPermissionId: null
};




    return lastValueFrom(
      this.ledgerService.addLedgerEntry(entry).pipe(
        catchError(err => {
          console.error('API Error:', err);
          throw err; // ✅ فشل حقيقي
        })
      )
    );
  });

  Promise.all(requests)
    .then(() => {
      alert('تم حفظ البيانات بنجاح');
      this.inventoryLogForm.reset();
      this.tableData.clear();
      this.addRow();
    })
    .catch(() => {
      alert('فشل حفظ البيانات');
    })
    .finally(() => this.isSubmitting.set(false));
}



}
