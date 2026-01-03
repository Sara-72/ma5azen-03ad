import { Component ,OnInit, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { catchError, lastValueFrom, of } from 'rxjs';
import { LedgerService, LedgerEntry } from '../../../services/ledger.service';
import { CentralStoreService, CentralStoreResponse } from '../../../services/central-store.service';

@Component({
  selector: 'app-ameen2',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './ameen2.component.html',
  styleUrls: ['./ameen2.component.css']
})
export class Ameen2Component implements OnInit {

  userName: string = '';
  displayName: string = '';

  assetTypes: string[] = ['مستهلك', 'مستديم'];
  sourceDestinationOptions: string[] = ['وارد من', 'منصرف الى'];

  // ✅ هنا قائمة الأصناف ستأتي من المخزن المركزي
  availableItems: string[] = [];

  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);
  private ledgerService = inject(LedgerService);
  private centralStoreService = inject(CentralStoreService);

  constructor() {
    this.inventoryLogForm = this.fb.group({
      assetType: ['', Validators.required],
      tableData: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userName = localStorage.getItem('name') || '';
    this.displayName = this.getFirstTwoNames(this.userName);

    // جلب الأصناف من المخزن المركزي
    this.loadAvailableItems();

    // Start with one empty row
    this.tableData.push(this.createTableRowFormGroup());
  }

  getFirstTwoNames(fullName: string): string {
    return fullName ? fullName.trim().split(/\s+/).slice(0, 2).join(' ') : '';
  }

  private loadAvailableItems(): void {
  this.centralStoreService.getAll().subscribe({
    next: (data: CentralStoreResponse[]) => {
      // استخدم Set لإزالة التكرارات
      const uniqueItems = new Set<string>();
      data.forEach(d => uniqueItems.add(d.itemName));
      this.availableItems = Array.from(uniqueItems).sort(); // optional: ترتيب الأبجدي
    },
    error: (err) => {
      console.error('Failed to load central store items:', err);
    }
  });
}


  // --- FormArray Helper ---
  get tableData(): FormArray {
    return this.inventoryLogForm.get('tableData') as FormArray;
  }

  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      date: ['', Validators.required],
      itemName: ['', Validators.required],
      sourceOrDestination: ['', Validators.required],
      addedValue: [''],
      issuedValue: [''],
      transactionType: ['added', Validators.required] // 'added' = وارد | 'issued' = منصرف
    });
  }

  addRow(): void {
    this.tableData.push(this.createTableRowFormGroup());
  }

  removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.removeAt(this.tableData.length - 1);
    } else {
      this.tableData.at(0).reset();
    }
  }

  onSubmit(): void {
    if (this.inventoryLogForm.invalid) {
      this.inventoryLogForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const assetTypeIndex = this.assetTypes.indexOf(this.inventoryLogForm.value.assetType);

    const requests = this.tableData.value.map((row: any) => {
      const itemsValue =
        row.transactionType === 'added'
          ? Number(row.addedValue || 0)
          : -(Number(row.issuedValue || 0));

      const entry: LedgerEntry = {
        date: new Date(row.date).toISOString(),
        itemName: row.itemName,
        documentReference: row.sourceOrDestination,
        itemsValue: itemsValue,
        storeType: assetTypeIndex,
        spendPermissionId: null,
        spendPermission: null
      };

      return lastValueFrom(
        this.ledgerService.addLedgerEntry(entry).pipe(
          catchError(err => {
            console.error('API Error:', err);
            throw err;
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
