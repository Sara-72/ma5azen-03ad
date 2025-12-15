import { Component ,OnInit, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { catchError, lastValueFrom, Observable } from 'rxjs';
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


  assetTypes: string[] = ['مستهلك', 'مستديم'];

  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);
  private ledgerService = inject(LedgerService);

  constructor() {
  this.inventoryLogForm = this.fb.group({
    storehouseName: ['', Validators.required],
    assetType: ['', Validators.required],
    tableData: this.fb.array([])
  });
}

  ngOnInit(): void {
    // Start with one empty row
    this.tableData.push(this.createTableRowFormGroup());
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
      assetType: ['', Validators.required]


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
    console.log('Form is invalid', this.inventoryLogForm.value);
    this.inventoryLogForm.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);

  const requests = this.tableData.value.map((row: any, index: number) => {
    const entry: LedgerEntry = {
      date: row.date,
      documentReference: row.sourceOrDestination,
      addedItemsValue: +row.addedValue,
      issuedItemsValue: +row.issuedValue,
      storeType: this.assetTypes.indexOf(row.assetType) + 1,
      spendPermissionId: 0,
      spendPermission: ''
    };

    console.log(`Sending entry #${index + 1}:`, entry);

    return lastValueFrom(
      this.ledgerService.addLedgerEntry(entry).pipe(
        catchError(err => {
          console.error(`Error sending entry #${index + 1}:`, err);
          return []; // ارجع مصفوفة فارغة بدل ما ينهار الكود
        })
      ) as Observable<LedgerEntry>
    );
  });

  Promise.all(requests)
    .then(() => {
      console.log('All entries saved successfully');
      alert('تم حفظ البيانات بنجاح!');
      this.inventoryLogForm.reset();
      this.tableData.clear();
      this.addRow();
    })
    .catch(err => {
      console.error('Error in saving entries:', err);
      alert('حدث خطأ أثناء الحفظ.');
    })
    .finally(() => this.isSubmitting.set(false));
}


}
