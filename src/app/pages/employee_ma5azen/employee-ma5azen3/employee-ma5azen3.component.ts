import { Component ,OnInit, inject, signal} from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormsModule, FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
// Assuming you have an ApiService to handle HTTP requests
// import { ApiService } from '../services/api.service';




interface SimpleRow {
  item: string;      // الصنف
  category: string;  // الفئة
  code: string;      // الكود
  count: string;     // العدد
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
export class EmployeeMa5azen3Component implements OnInit{

   simpleForm!: FormGroup;
  isSubmitting = signal(false);

  // Dependency Injection
  private fb = inject(FormBuilder);

  constructor() {
    this.simpleForm = this.fb.group({
      // The only control is the FormArray for the table data
      tableData: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Start with one empty row
    this.tableData.push(this.createTableRowFormGroup());
  }

  // Helper getter to easily access the FormArray
  get tableData(): FormArray {
    return this.simpleForm.get('tableData') as FormArray;
  }

  // Helper function to create the form group for a single table row (4 columns)
  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      item: ['',Validators.required],
      category: ['',Validators.required],
      code: ['',Validators.required],
      count: ['', Validators.required]
    });
  }

  // ➕ Method to add a new row
  addRow(): void {
    this.tableData.push(this.createTableRowFormGroup());
  }

  // ➖ Method to remove the last row
  removeRow(): void {
    if (this.tableData.length > 1) {
      this.tableData.removeAt(this.tableData.length - 1);
    } else if (this.tableData.length === 1) {
      // If only one row remains, clear its data
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
