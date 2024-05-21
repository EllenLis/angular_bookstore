import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { CheckUniqueEmail } from 'src/app/shared/form-validators/async-email-check';
import { CustomerService } from 'src/app/shared/services/customer/customer.service';
import { switchMap, tap } from 'rxjs';
import { setAccessTokenInCookie } from 'src/app/shared/utils/set-access-token-in-cookie';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { hasSpace } from 'src/app/shared/form-validators/has-space';
import { isEmail } from '../../shared/form-validators/email';
import { GetErrorMassagePipe } from '../../shared/pipes/get-error-massage/get-error-massage.pipe';
import { passwordValidators } from '../../shared/form-validators/password';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        GetErrorMassagePipe,
        MatIconModule,
        RouterLink,
    ],
    providers: [CheckUniqueEmail],
    templateUrl: './login-page.component.html',
    styleUrl: './login-page.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
    private readonly authService = inject(AuthService);
    private readonly customerService = inject(CustomerService);
    private readonly router = inject(Router);

    isPasswordHide = true;

    readonly loginForm = new FormGroup({
        email: new FormControl('', {
            validators: [hasSpace, isEmail],
            nonNullable: true,
        }),
        password: new FormControl('', {
            validators: [...Object.values(passwordValidators)],
            nonNullable: true,
        }),
    });

    readonly controls = this.loginForm.controls;

    loginErrorOutput(): void {
        const formValue = this.loginForm.getRawValue();
        const { email, password } = this.loginForm.controls;
        const err = { error: 'wrong login or password' };

        email.setValue(formValue.email);
        password.setValue('');

        email.setErrors(err);
        password.setErrors(err);
    }

    signIn(): void {
        const formValue = this.loginForm.getRawValue();

        this.authService
            .signInCustomer(formValue)
            .pipe(
                tap(({ customer }) => {
                    this.customerService.setCustomer(customer);
                }),
                switchMap(() => {
                    return this.authService.getPasswordFlowToken(formValue);
                }),
            )
            .subscribe({
                next: passwordFlowToken => {
                    setAccessTokenInCookie(passwordFlowToken, false);

                    this.authService.setLoginStatus(true);
                    this.router.navigateByUrl('/main');
                },
                error: () => {
                    this.loginErrorOutput();
                },
            });
    }
}
