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
import { AdminComponent } from '../admin/admin.component';


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

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;

}



@Component({
  selector: 'app-login5-page',
  imports: [
      FooterComponent ,CommonModule,
      ReactiveFormsModule,
      AdminComponent],

  templateUrl: './login5-page.component.html',
  styleUrl: './login5-page.component.css'
})
export class Login5PageComponent {



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




    }) as FormGroup<LoginForm>;


    constructor() {
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
      this.message.set(null);

      if (this.loginForm.invalid) {
        // Mark all fields as touched to display errors immediately
        this.loginForm.markAllAsTouched();
        this.message.set({
          text: 'Form contains validation errors. Please correct them.',
          type: 'error',
        });
        return;
      }

      this.isSubmitting.set(true);
      console.log('Form Submitted!', this.loginForm.value);
      this.router.navigate(['/admin']);

      // Simulate API call delay
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.message.set({
          text: `Login successful for ${this.loginForm.value.email}!`,
          type: 'success',
        });
        this.loginForm.reset();
        // Need to reset the pristine/touched state after reset
        Object.keys(this.loginForm.controls).forEach(key => {
          this.loginForm.get(key)?.setErrors(null);
        });
      }, 1500);
    }

}
