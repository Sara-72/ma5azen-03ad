import { Component ,OnInit, inject, signal} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';


@Component({
  selector: 'app-employee1',
  imports: [
    HeaderComponent,
    FooterComponent,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee1.component.html',
  styleUrl: './employee1.component.css'
})
export class Employee1Component implements OnInit {

  // 🚨 Define the list of colleges for the dropdown
collegeOptions: string[] = [
  'كلية الحاسبات والذكاء الاصطناعي',
  'كلية التربية',
  'كلية الألسن',
  'كلية السياحة والفنادق',
  'مركزي'
];

availableItemOptions: string[] = [
  'أقلام جاف',
  'أوراق A4',
  'حاسوب محمول',
  'كرسي مكتبي',
  'طابعة ليزر',
  'مواد تنظيف'
];

 // 🚨 New name for the top-level form group
  memoContainerForm!: FormGroup;
  isSubmitting = signal(false);

  private fb = inject(FormBuilder);

  constructor() {
    this.memoContainerForm = this.fb.group({
      // 🚨 New FormArray: requests is an array of complete memos (papers)
      requests: this.fb.array([
        this.createRequestMemoGroup() // Start with the first paper
      ])
    });
  }

  ngOnInit(): void {
    // Initialization logic
  }

  // 🚨 Getter for the FormArray holding all the papers
  get requests(): FormArray {
    return this.memoContainerForm.get('requests') as FormArray;
  }

  // Helper function to create the form group for ONE entire request memo (ONE Paper)
  private createRequestMemoGroup(): FormGroup {
    return this.fb.group({
      // 1. Context Info (Top of the Paper)
      collegeAdminName: ['أبو السعود الحبيشي', Validators.required],
      collegeName: ['', Validators.required],

      // 2. Main Request Content (Item details)
      itemName: ['', Validators.required], // الصنف
      count: [1, [Validators.required, Validators.min(1)]], // العدد

      // 3. Signature/Date Info (Bottom of the Paper)
      requestDate: ['', Validators.required], // تاريخ الطلب (Now a single input)
      employeeSignature: ['', Validators.required] // توقيع الموظف
    });
  }

  // ➕ Method to add a new paper (New Request Memo)
  addRow(): void {
    this.requests.push(this.createRequestMemoGroup());
  }

  // ➖ Method to remove the last paper
  removeRow(): void {
    if (this.requests.length > 1) {
      this.requests.removeAt(this.requests.length - 1);
    } else if (this.requests.length === 1) {
      // Option: Clear the fields of the last paper instead of removing the whole thing
      this.requests.at(0).reset();
    }
  }

  // --- SUBMIT LOGIC (Updated to use memoContainerForm) ---
  onSubmit(): void {
    if (this.memoContainerForm.invalid) {
        this.memoContainerForm.markAllAsTouched();

        // 🚨 DIAGNOSTIC CODE 🚨
        console.log('Form is invalid. Errors:');
        this.requests.controls.forEach((memo, index) => {
            if (memo.invalid) {
                console.warn(`Memo #${index + 1} is invalid. Errors:`, memo.errors, memo.value);
            }
        });

        return;

    }}
}
