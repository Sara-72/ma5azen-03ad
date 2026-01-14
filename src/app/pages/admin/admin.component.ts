import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormGroup,
  Validators,
  ValidationErrors,
  AbstractControl,
  FormBuilder,
  ValidatorFn,
  AsyncValidatorFn,
  ReactiveFormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, of, map } from 'rxjs';
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
  const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
  if (!value) return null;
  if (!passwordPattern.test(value)) {
    return { invalidPassword: { message: 'يجب أن تتكون كلمة السر من 8 أحرف على الأقل، تشمل حرف كبير ورقم.' } };
  }
  return null;
}

/** Async validator للتحقق من تكرار الإيميل */
export function emailExistsValidator(auth: AuthService, getRole: () => string): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return of(null);
    const role = getRole();
    if (!role) return of(null);

    return auth.checkEmailExists(control.value, role).pipe(
      map((res: any) => {
        const exists = Array.isArray(res)
          ? res.some((item: any) => item.email?.toLowerCase() === control.value.toLowerCase())
          : res?.email?.toLowerCase() === control.value.toLowerCase();

        return exists ? { emailExists: true } : null;
      })
    );
  };
}
export function nameExistsValidator(auth: AuthService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return of(null);
    return auth.checkNameExists(control.value).pipe(
      map(exists => (exists ? { nameExists: true } : null))
    );
  };
}
export function emailExistsValidatorAllRoles(auth: AuthService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return of(null);

    return auth.checkEmailExistsAllRoles(control.value).pipe(
      map(exists => (exists ? { emailExists: true } : null))
    );
  };
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, CommonModule, ReactiveFormsModule, RouterModule],
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
 email: [
  '',
  {
    validators: [Validators.required, Validators.email],
    asyncValidators: [emailExistsValidatorAllRoles(this.auth)],
    updateOn: 'change'
  }
]
,
  password: ['', [Validators.required, strongPasswordValidator]],
  role: ['', Validators.required],
  college: [''],
  name: [
  '',
  [Validators.required, fourStringsValidator()],
  [nameExistsValidator(this.auth)] // <- Async Validator للاسم
]
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

      // تحديث Async validator للإيميل مع الدور الجديد
      const emailControl = this.adminForm.get('email');
      emailControl?.updateValueAndValidity();
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
    const body = { email: form.email, password: form.password, faculty: form.college, name: form.name };

    switch (form.role) {
      case 'موظف':
        this.auth.addUser(body).subscribe(); break;
      case 'موظف مخزن':
        this.auth.addEmployee(body).subscribe(); break;
      case 'أمين مخزن':
        this.auth.addStoreKeeper(body).subscribe(); break;
      case 'مدير مخزن':
        this.auth.addInventoryManager(body).subscribe(); break;
    }

    this.adminForm.reset();
  }
}
