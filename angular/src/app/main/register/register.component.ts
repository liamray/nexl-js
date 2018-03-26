import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import jqxValidator = jqwidgets.jqxValidator;
import {LoaderService} from "../../services/loader.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {jqxPasswordInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxpasswordinput";


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @ViewChild('validator') validator: jqxValidator;
  @ViewChild('registerWindow') registerWindow: jqxWindowComponent;
  @ViewChild('usernameRef') usernameRef: jqxInputComponent;
  @ViewChild('tokenRef') tokenRef: jqxPasswordInputComponent;
  @ViewChild('passwordRef') passwordRef: jqxPasswordInputComponent;
  @ViewChild('confirmPasswordRef') confirmPasswordRef: jqxInputComponent;
  @ViewChild('registerButton') registerButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  username = '';
  token = '';
  password = '';
  confirmPassword = '';
  isTokenValid = false;
  validationRules =
    [
      {
        input: '#password', message: 'Bad token', action: 'null',
        rule: (input: any, commit: any): any => {
          return this.isTokenValid;
        }
      }
    ];

  constructor(private authService: AuthService, private loaderService: LoaderService) {
  }

  open() {
    this.username = '';
    this.token = '';
    this.password = '';
    this.confirmPassword = '';

    // WTF BUG ???
    this.usernameRef.val(this.username);
    this.tokenRef.val(this.token);
    this.passwordRef.val(this.password);
    this.confirmPasswordRef.val(this.confirmPassword);
    this.registerWindow.open();
  }

  register() {
    this.isTokenValid = false;

    this.loaderService.loader.open();

    this.authService.register(this.username, this.password, this.token)
      .subscribe(
        response => {
          this.loaderService.loader.close();
          this.isTokenValid = true;
          this.validator.validate(document.getElementById('registerForm'));
        },
        err => {
          this.loaderService.loader.close();
          this.isTokenValid = false;
          this.password = '';
          this.confirmPassword = '';
          this.validator.validate(document.getElementById('registerForm'));
        });
  }

  onValidationSuccess() {
    this.registerWindow.close();
    alert('Success !!!');
  }

  initContent = () => {
    this.registerButton.createComponent();
    this.cancelButton.createComponent();
  }

  onOpen() {
    this.usernameRef.focus();
  }

  onEnterPress(event) {
    if (event.charCode !== 13) {
      return;
    }

    if (this.username.length < 1 || this.password.length < 1) {
      return;
    }

    this.register();
  }
}
