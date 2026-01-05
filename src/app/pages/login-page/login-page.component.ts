import { Component, signal, effect, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';

function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';
  const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
  if (!value) return null;
  return passwordPattern.test(value)
    ? null
    : {
        invalidPassword: {
          message: 'يجب أن يتكون من 8 أحرف على الأقل، بما في ذلك حرف كبير ورقم.'
        }
      };
}

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FooterComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = new FormBuilder();

  isSubmitting = signal(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  loginForm: FormGroup<LoginForm> = this.fb.group({
    email: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email
    ]),
    password: this.fb.nonNullable.control('', [
      Validators.required,
      passwordValidator
    ])
  }) as FormGroup<LoginForm>;

  constructor(private loadingService: LoadingService) {
    // Clear message when user types
    effect(() => {
      const email = this.loginForm.controls.email.value;
      const password = this.loginForm.controls.password.value;
      if (email || password) {
        this.message.set(null);
      }
    });
  }

  isInvalid(controlName: keyof LoginForm): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
handleLoginSuccess(res: any) {
  // ✅ ضمان وجود token افتراضي لأي مستخدم
  localStorage.setItem('token', 'dummy-token');

  // ✅ تخزين الدور
  let role = res.role?.toUpperCase() ?? 'USER';

  // ✅ أي دور غير USER يتحول مؤقتًا عشان يروح صفحة المستخدم
  if (role !== 'USER') {
    role = 'USER';
  }

  localStorage.setItem('role', role);
  localStorage.setItem('name', res.name ?? '');
  localStorage.setItem('faculty', res.faculty ?? '');

  this.isSubmitting.set(false);

  // ✅ التوجيه لكل الموظفين غير ADMIN لصفحة المستخدم
  if (res.role?.toUpperCase() === 'ADMIN') {
    this.router.navigate(['/admin']);
  } else {
    this.router.navigate(['/employee1']); // أي موظف آخر يدخل صفحة المستخدم
  }
}

onSubmit() {
  if (this.loginForm.invalid) return;
  this.isSubmitting.set(true);

  const data = this.loginForm.value;

  this.auth.getAllAccounts().subscribe({
    next: (accounts) => {
      const user = accounts.find(u => u.email === data.email && u.password === data.password);

      if (user) {
        if (user.role !== 'موظف') {
          // أي دور غير الموظف العادي
          localStorage.setItem('role', 'USER'); // مؤقتًا كلهم USER
          localStorage.setItem('name', user.name);
          localStorage.setItem('faculty', 'مركزية');          // الكلية مركزية
          localStorage.setItem('collegeAdmin', 'حمدي محمد علي'); // الأمين حمدي محمد علي
        } else {
          // الموظف العادي: البيانات حسب الموجود في الداتا بيز
          localStorage.setItem('role', 'USER');
          localStorage.setItem('name', user.name);
          localStorage.setItem('faculty', user.faculty || ''); 
          localStorage.setItem('collegeAdmin', user.collegeAdmin || ''); 
        }

        this.isSubmitting.set(false);
        this.router.navigate(['/employee1']); // صفحة الموظف
      } else {
        this.isSubmitting.set(false);
        this.message.set({ text: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', type: 'error' });
      }
    },
    error: () => {
      this.isSubmitting.set(false);
      this.message.set({ text: 'حدث خطأ أثناء تسجيل الدخول', type: 'error' });
    }
  });
}




}
