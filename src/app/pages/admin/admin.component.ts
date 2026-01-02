import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormGroup,
  Validators,
  ValidationErrors,
  AbstractControl,
  FormBuilder,
  ValidatorFn,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from '../../components/header/header.component';
import { AuthService } from '../../services/auth.service';

/** اسم رباعي */
export function fourStringsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    return words.length === 4 ? null : { fourStrings: { requiredCount: 4, actualCount: words.length } };
  };
}

/** كلمة سر قوية */
export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';
  const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/; // حرف كبير + رقم + 8 أحرف على الأقل
  if (!value) return null;
  if (!passwordPattern.test(value)) {
    return {
      invalidPassword: {
        message: 'يجب أن تتكون كلمة السر من 8 أحرف على الأقل، تشمل حرف كبير ورقم.'
      }
    };
  }
  return null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent ,CommonModule,
    ReactiveFormsModule,
    RouterModule

  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
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

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.adminForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, strongPasswordValidator]],
      role: ['', Validators.required],
      college: [''],
      name: ['', [Validators.required, fourStringsValidator()]]
    });
  }
completeEmail() {
  const emailControl = this.adminForm.get('email');
  if (emailControl && emailControl.value) {
    const localPart = emailControl.value.replace(/@hu\.edu\.eg$/i, '').trim();
    emailControl.setValue(localPart + '@hu.edu.eg');
  }
}

ngOnInit(): void {
  // متابعة تغييرات الدور لإظهار/اخفاء الكلية
  this.roleSubscription = this.adminForm.get('role')?.valueChanges.subscribe(selectedRole => {
    this.showCollegeSelection = (selectedRole === 'موظف');
    const collegeControl = this.adminForm.get('college');
    if (this.showCollegeSelection) {
      collegeControl?.setValidators(Validators.required);
    } else {
      collegeControl?.clearValidators();
      collegeControl?.setValue('');
    }
    collegeControl?.updateValueAndValidity();
  });

}


  ngOnDestroy(): void {
    this.roleSubscription?.unsubscribe();
  }

  submit() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const form = this.adminForm.value;

    this.auth.checkEmailExists(form.email, form.role).subscribe((res: any) => {
      const exists = Array.isArray(res)
        ? res.some((item: any) => item.email?.toLowerCase() === form.email.toLowerCase())
        : res?.email?.toLowerCase() === form.email.toLowerCase();

      if (exists) {
        alert('الإيميل موجود بالفعل. يرجى إدخال إيميل آخر.');
        return;
      }

      const body = { email: form.email, password: form.password, faculty: form.college, name: form.name };

      switch (form.role) {
        case 'موظف':
          this.auth.addUser(body).subscribe(() => alert('تم إضافة الموظف')); break;
        case 'موظف مخزن':
          this.auth.addEmployee(body).subscribe(() => alert('تم إضافة موظف مخزن')); break;
        case 'أمين مخزن':
          this.auth.addStoreKeeper(body).subscribe(() => alert('تم إضافة أمين مخزن')); break;
        case 'مدير مخزن':
          this.auth.addInventoryManager(body).subscribe(() => alert('تم إضافة مدير مخزن')); break;
      }

      this.adminForm.reset();
    }, err => {
      console.error(err);
      alert('حدث خطأ أثناء التحقق من الإيميل');
    });
  }
}
