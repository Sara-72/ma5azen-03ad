import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-employee-ma5azen1',
  imports: [
    HeaderComponent,
    FooterComponent,
    ReactiveFormsModule,CommonModule],
  templateUrl: './employee-ma5azen1.component.html',
  styleUrl: './employee-ma5azen1.component.css'
})
export class EmployeeMa5azen1Component {


  ma5azenItemOptions: string[] = [
  'أقلام جاف',
  'أوراق A4',
  'حاسوب محمول',
  'كرسي مكتبي',
  'طابعة ليزر',
  'مواد تنظيف',
  'شاشات عرض',
  'كابلات شبكة'
];

  // The main form group for the page
  inventoryLogForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);

  constructor() {
    this.inventoryLogForm = this.fb.group({
      // You can add a top-level field for Storehouse Name or Date here if needed
      // storehouseName: ['', Validators.required],

      // The FormArray holds the data for the table rows
      tableData: this.fb.array([])
    });
  }


ngOnInit(): void {
  this.userName = localStorage.getItem('name') || '';
  this.displayName = this.getFirstTwoNames(this.userName);

  this.tableData.push(this.createTableRowFormGroup());
}
 userName: string = '';
 displayName: string = '';


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

  // Helper function to create the form group for a single table row
  private createTableRowFormGroup(): FormGroup {
    return this.fb.group({
      // Based on image_522963.png columns (Raqm Al-Idafa, Ism Al-Sinf, etc.)
      additionNumber: [0, [Validators.required, Validators.min(0)]], // رقم الإضافة
      itemName: ['', Validators.required],                       // اسم الصنف
      unit: ['', Validators.required],                           // الوحدة
      quantity: [0, [Validators.required, Validators.min(1)]],     // الكمية
      unitPrice: [0, [Validators.required, Validators.min(0)]], // سعر الوحدة
      value: [0, [Validators.required, Validators.min(0)]],        // القيمة
      itemCondition: ['', Validators.required]                     // حالة الصنف
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
      // If only one row remains, clear it instead of removing it entirely
      this.tableData.at(0).reset();
    }
  }

  // --- SUBMIT BUTTON LOGIC ---
  onSubmit(): void {
    if (this.inventoryLogForm.invalid) {
      this.inventoryLogForm.markAllAsTouched();
      console.warn('Form is invalid. Cannot submit.', this.inventoryLogForm.errors);
      return;
    }

    this.isSubmitting.set(true); // Disable the button
    const formData = this.inventoryLogForm.value;
    console.log('Sending Inventory Log Data:', formData);

    // --- Placeholder API Call ---
    setTimeout(() => {
      console.log('Request submitted successfully!');
      this.isSubmitting.set(false);
      // Optional: Clear form or show success message
    }, 2000);
  }

}
