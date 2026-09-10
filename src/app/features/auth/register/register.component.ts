import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  agreedToTerms = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingService: LoadingService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid || !this.agreedToTerms) {
      this.notificationService.showError('Please fill all fields and agree to terms');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    const { firstName, lastName, email, password } = this.registerForm.value;

    this.authService.register({ firstName, lastName, email, password }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Registration successful! Welcome aboard.');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.notificationService.showError(error.error?.message || 'Registration failed');
      },
      complete: () => {
        this.isLoading = false;
        this.loadingService.hide();
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (password.length < 8) return '';
    if (password.length < 12) return 'weak';
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'medium';
    return 'strong';
  }
}
