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

categories: string[] = ['أثاث ومفروشات', 'أجهزة إلكترونية', 'مستهلكات مكتبية', 'مواد تنظيف'];

itemData: { [key: string]: string[] } = {
    'أثاث ومفروشات': ['مكاتب', 'كراسي', 'خزائن ملفات', 'أرائك'],
    'أجهزة إلكترونية': ['شاشات عرض', 'طابعات', 'أجهزة كمبيوتر', 'ماوس وكيبورد'],
    'مستهلكات مكتبية': ['أقلام', 'ورق A4', 'دبابيس', 'ملفات بلاستيكية'],
    'مواد تنظيف': ['مطهرات', 'مناديل ورقية', 'مماسح', 'صابون سائل']
};

filteredItemNames: string[] = [];

// 🚨 NEW PROPERTY: To hold the currently selected category for the new dropdown
selectedCategory: string = ''

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
    this.filteredItemNames = this.itemData[this.categories[0]] || [];
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

      category: ['', Validators.required],
      itemLines: this.fb.array([
            this.createItemLineGroup() // Start with one item line
        ]),

      // 2. Main Request Content (Item details)
      // itemName: ['', Validators.required], // الصنف
      // count: [1, [Validators.required, Validators.min(1)]], // العدد

      // 3. Signature/Date Info (Bottom of the Paper)
      requestDate: ['', Validators.required], // تاريخ الطلب (Now a single input)
      employeeSignature: ['', Validators.required] // توقيع الموظف
    });
  }

// --- Employee1Component.ts ---

// ... existing methods ...

/**
 * Helper function to safely extract the value from a change event on a select element.
 * @param event The native DOM event object.
 */
getCategoryValue(event: Event): string {
    // We are sure the target is a select element, so we cast it here in TypeScript
    return (event.target as HTMLSelectElement).value;
}

// 🚨 MISSING METHOD FIX: addItemLine
addItemLine(memoIndex: number): void {
    // Get the correct nested FormArray using the memo's index
    const itemLinesArray = this.getItemLines(memoIndex);

    // Push the new item line FormGroup
    itemLinesArray.push(this.createItemLineGroup());
}

// Helper function to create the form group for ONE item line (Item Name + Count)
private createItemLineGroup(): FormGroup {
    return this.fb.group({
        itemName: ['', Validators.required], // الصنف
        count: [1, [Validators.required, Validators.min(1)]], // العدد
    });
}

// 🚨 Modify the updateFilteredItems function to accept the raw event (Optional, but cleaner)
// If you want to keep updateFilteredItems accepting just the string, that is also fine.
// I will keep your existing function signature, and call the helper function from the template.



// 🚨 UPDATE SIGNATURE: Now accepts the index of the memo that triggered the change
// --- Employee1Component.ts ---

updateFilteredItems(category: string, memoIndex: number): void { // Note: memoIndex is received here
    this.selectedCategory = category;

    // 1. Update the global filtered list
    this.filteredItemNames = this.itemData[category] || [];

    // 2. Access the item lines FormArray using the received index
    // 🚨 FIX HERE: Pass the index, not the group object.
    const itemLinesArray = this.getItemLines(memoIndex);

    // We no longer need to check for currentMemoGroup since getItemLines does the check internally.

    // 3. Clear all item line values in this memo
    itemLinesArray.controls.forEach(itemLine => {
        itemLine.get('itemName')?.setValue('');
        itemLine.get('count')?.setValue(1);
    });
}



// --- Employee1Component.ts ---

// Getter to easily access the item lines FormArray for a specific memo (by index)
// New definition: Accepts the index (number)


// --- Employee1Component.ts ---

// 1. Helper to access the nested FormArray
// Helper function to access the nested itemLines FormArray for a specific memo (by index)
// 1. Helper function to access the nested itemLines FormArray
getItemLines(memoIndex: number): FormArray {
    // 1. Get the specific memo group using the outer index
    const memoGroup = this.requests.at(memoIndex);

    // Safety check
    if (!memoGroup) {
        // Returns an empty FormArray if the memo group isn't found, preventing crashes
        return this.fb.array([]);
    }

    // 2. Return the nested FormArray 'itemLines'
    return memoGroup.get('itemLines') as FormArray;
}
// 2. Function to remove a specific item line
// --- Employee1Component.ts ---

// Function to remove a specific item line
// --- Employee1Component.ts ---

removeItemLine(memoIndex: number, itemLineIndex: number): void {

    const itemLinesArray = this.getItemLines(memoIndex);

    // 🚨 Action: Since the button only appears when length > 1,
    // we can remove the item directly using its index.
    itemLinesArray.removeAt(itemLineIndex);

    console.log(`Removed item index ${itemLineIndex} from memo index ${memoIndex}`);
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
