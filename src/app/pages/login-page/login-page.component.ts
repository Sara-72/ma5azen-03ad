import { ChangeDetectionStrategy, Component, OnInit , signal, computed, effect,inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  ValidationErrors,
  AbstractControl,
  FormBuilder,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '../../components/footer/footer.component';
import { Employee1Component } from '../employee/employee1/employee1.component';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service'; // Ensure this path is correct


function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';

  // Regex requirements:
  // 1. At least 8 characters long (.{8,})
  // 2. Contains at least one uppercase letter (?=.*[A-Z])
  // 3. Contains at least one number (?=.*[0-9])
  const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

  if (!value) {
    return null; // Handled by Validators.required
  }

  if (!passwordPattern.test(value)) {
    return {
      invalidPassword: {
        message: 'يجب أن يتكون من 8 أحرف على الأقل , بما في ذلك حرف كبير واحد و رقم واحد.',
      },
    };
  }

  return null;
}

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
  college: FormControl<string | null>;
}


@Component({
  selector: 'app-login-page',
  imports: [
    FooterComponent ,CommonModule,
    ReactiveFormsModule,
    Employee1Component
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})



export class LoginPageComponent {

  showPassword = false; // Initial state: hidden

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Dependency injection
  private auth = inject(AuthService);

  isSubmitting = signal(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

// Form Group initialization using FormBuilder
private fb = new FormBuilder();
private router = inject(Router);

loginForm: FormGroup<LoginForm> = this.fb.group({
  email: this.fb.nonNullable.control('', [
    Validators.required,
    Validators.email,
  ]),
  password: this.fb.nonNullable.control('', [
    Validators.required,
    passwordValidator, // Our custom validator
  ]),

  college: this.fb.control<string | null>(null, [
      Validators.required
  ]),


}) as FormGroup<LoginForm>;


constructor(private loadingService: LoadingService) {

    // Effect to clear messages when user starts typing again
    effect(() => {
        const emailValue = this.loginForm.controls.email.value;
        const passwordValue = this.loginForm.controls.password.value;
        if (emailValue || passwordValue) {
            this.message.set(null);
        }
    }, {allowSignalWrites: true});
  }

  // Helper to check if a control is invalid and should display an error
  isInvalid(controlName: keyof LoginForm): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }



onSubmit() {
  this.loadingService.show();
  if (this.loginForm.invalid) return;

  this.isSubmitting.set(true);

  const { email, password, college } = this.loginForm.value;

  this.auth.userLogin({ email, password }).subscribe({
    next: (res: any) => {
console.log('faculty from API:', res.faculty);
console.log('selected college:', college);
console.log('API type:', typeof res.faculty);
console.log('Form type:', typeof college);

      // ✅ التحقق من الكلية
const apiFaculty = (res.faculty || '').trim().toLowerCase();
const selectedFaculty = (college || '').trim().toLowerCase();

if (apiFaculty !== selectedFaculty) {
  this.isSubmitting.set(false);
  this.message.set({
    text: 'الكلية التي اخترتها غير صحيحة',
    type: 'error'
  });
  return;
}


      // ✅ كل شيء صحيح
      localStorage.setItem('token', res.token ?? '');
      localStorage.setItem('role', res.role ?? 'USER');
      localStorage.setItem('college', res.faculty);
      localStorage.setItem('name', res.name);

      this.router.navigate(['/employee1']);
    },

    error: () => {
      this.isSubmitting.set(false);
      this.message.set({
        text: 'الإيميل أو كلمة السر غير صحيحة',
        type: 'error'
      });
    }
  });
}


}
