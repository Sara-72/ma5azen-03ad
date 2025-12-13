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
        message: 'Must be at least 8 chars, including 1 uppercase letter and 1 number.',
      },
    };
  }

  return null;
}
function collegeValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return { required: true };
  }

  const allowedColleges = ['education', 'csai', 'alsun', 'tourism'];

  if (!allowedColleges.includes(value)) {
    return {
      invalidCollege: {
        message: 'الكلية غير صحيحة'
      }
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

  isSubmitting = signal(false);
  message = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form Group initialization using FormBuilder
  private fb = new FormBuilder();
 // private router = inject(Router);

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
      Validators.required,
      collegeValidator
  ]),


  }) as FormGroup<LoginForm>;


  constructor(private auth: AuthService, private router: Router) {
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
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.isSubmitting.set(true);

  const data = {
    email: this.loginForm.value.email!,
    password: this.loginForm.value.password!
  };

  this.auth.userLogin(data).subscribe({
    next: (res: any) => {
      console.log('Login response:', res);

      const selectedCollege = this.auth.normalizeFaculty(
        this.loginForm.value.college
      );

      const actualFaculty = this.auth.normalizeFaculty(
        res.faculty
      );

      if (selectedCollege !== actualFaculty) {
        this.isSubmitting.set(false);
        this.message.set({
          text: 'الكلية المختارة لا تطابق الكلية المسجلة لهذا الحساب',
          type: 'error'
        });
        return;
      }

      localStorage.setItem('token', res.token);
      localStorage.setItem('role', 'USER');
      localStorage.setItem('college', selectedCollege as string);

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
