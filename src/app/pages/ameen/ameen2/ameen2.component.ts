import { Component ,OnInit, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';

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


  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);

  constructor() {
    this.inventoryLogForm = this.fb.group({
      storehouseName: ['',Validators.required], // For the single input field at the top (مخزن)
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
    if (this.tableData.invalid) {
      this.tableData.markAllAsTouched();
      console.warn('Form is invalid. Cannot submit.');
      return;
    }

    this.isSubmitting.set(true); // Disable the button
    const formData = this.tableData.value;
    console.log('Sending Form Data:', formData);

    // --- ACTUAL API CALL OR PLACEHOLDER ---
    // Example: Replace this setTimeout with your apiService call
    setTimeout(() => {
      console.log('Request submitted successfully!');
      this.isSubmitting.set(false);
      // Navigate to a confirmation page or /ameen3

    }, 2000);
    // -------------------------------------
  }

}
