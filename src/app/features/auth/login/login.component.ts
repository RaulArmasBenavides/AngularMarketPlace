import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;

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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.notificationService.showError('Please fill all fields correctly');
      return;
    }

    this.isLoading = true;
    this.loadingService.show();

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.notificationService.showSuccess('Login successful!');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.notificationService.showError(error.error?.message || 'Login failed');
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

  socialLogin(provider: string): void {
    this.notificationService.showInfo(`${provider} login coming soon...`);
  }
}
