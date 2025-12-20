import { Component, OnInit, OnDestroy} from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  ValidationErrors,
  AbstractControl,
  FormBuilder,
  ValidatorFn
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';








/**
 * Validates that the input string contains exactly four distinct words (strings separated by spaces).
 */
export function fourStringsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Let Validators.required handle the empty state
    }

    // Trim whitespace and split by one or more spaces, filtering out empty strings.
    const words = String(value).trim().split(/\s+/).filter(Boolean);

    const isValid = words.length === 4;

    // Return the validation error object if the count is not 4
    return isValid ? null : {
        fourStrings: {
            requiredCount: 4,
            actualCount: words.length
        }
    };
  };
}



@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent ,CommonModule,
    ReactiveFormsModule,

  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})





export class AdminComponent implements OnInit, OnDestroy{
  adminForm: FormGroup;
  private roleSubscription: Subscription | undefined;

  roles = ['موظف', 'موظف مخزن', 'أمين مخزن', 'مدير مخزن'];
  colleges = [
  { label: 'كلية التربية', value: 'كلية التربية' },
  { label: 'كلية الحاسبات والذكاء الاصطناعي', value: 'كلية الحاسبات والذكاء الاصطناعي' },
  { label: 'كلية الألسن', value: 'كلية الألسن' },
  { label: 'كلية السياحة والفنادق', value: 'كلية السياحة والفنادق' },
  { label: 'مركزية', value: 'مركزية' }
];

  showCollegeSelection: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.adminForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required],
      college: [''],

      name: ['', [Validators.required, fourStringsValidator()]]

    });
  }

  submit() {
  if (this.adminForm.invalid) {
    this.adminForm.markAllAsTouched();
    return;
  }

  const form = this.adminForm.value;

  this.auth.checkEmailExists(form.email, form.role).subscribe((res: any) => {

    let exists = false;

    if (Array.isArray(res)) {
      exists = res.some((item: any) =>
        item.email?.toLowerCase() === form.email.toLowerCase()
      );
    } else if (res && res.email) {
      exists = res.email.toLowerCase() === form.email.toLowerCase();
    }

    if (exists) {
      alert('الإيميل موجود بالفعل. يرجى إدخال إيميل آخر.');
      return;
    }

    // ✅ الإيميل غير موجود → أضيف
    const body = {
      email: form.email,
      password: form.password,
      faculty: form.college,
      name: form.name
    };

    switch (form.role) {
      case 'موظف':
        this.auth.addUser(body).subscribe(() => alert('تم إضافة الموظف'));
        break;

      case 'موظف مخزن':
        this.auth.addEmployee(body).subscribe(() => alert('تم إضافة موظف مخزن'));
        break;

      case 'أمين مخزن':
        this.auth.addStoreKeeper(body).subscribe(() => alert('تم إضافة أمين مخزن'));
        break;

      case 'مدير مخزن':
        this.auth.addInventoryManager(body).subscribe(() => alert('تم إضافة مدير مخزن'));
        break;
    }

    this.adminForm.reset();
  }, err => {
    console.error(err);
    alert('حصل خطأ أثناء التحقق من الإيميل');
  });
}



  ngOnInit(): void {
    // 🚨 Add subscription to the role control
   this.roleSubscription = this.adminForm.get('role')?.valueChanges.subscribe(selectedRole => {
        // Assuming the value for Employee is 'موظف'
        this.showCollegeSelection = (selectedRole === 'موظف');

        // Optional: If you want to enforce validation only when 'موظف' is selected
        const collegeControl = this.adminForm.get('college');
        if (this.showCollegeSelection) {
            collegeControl?.setValidators(Validators.required);
        } else {
            collegeControl?.clearValidators();
            collegeControl?.setValue(''); // Clear selection when hidden
        }
        collegeControl?.updateValueAndValidity();
    })
}

// 🚨 Add ngOnDestroy to clean up the subscription
  ngOnDestroy(): void {
      this.roleSubscription?.unsubscribe();
  }
}
