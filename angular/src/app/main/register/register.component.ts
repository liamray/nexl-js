import {Component, ElementRef, ViewChild} from '@angular/core';
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
  @ViewChild('messageBox') messageBox: ElementRef;
  @ViewChild('registerButton') registerButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  username = '';
  token = '';
  password = '';
  confirmPassword = '';
  validationRules =
    [];

  constructor(private authService: AuthService, private loaderService: LoaderService) {
  }

  displayErrorMessage(msg?) {
    if (msg === undefined) {
      this.messageBox.nativeElement.style.display = 'none';
      return;
    }

    this.messageBox.nativeElement.innerText = msg;
    this.messageBox.nativeElement.style.display = 'block';
  }

  open() {
    this.displayErrorMessage();

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
    this.loaderService.loader.open();

    this.authService.register(this.username, this.password, this.token)
      .subscribe(
        response => {
          this.loaderService.loader.close();
          this.registerWindow.close();
          alert('Success !!!');
        },
        err => {
          this.loaderService.loader.close();
          this.password = '';
          this.confirmPassword = '';
          this.displayErrorMessage(err.statusText);
        });
  }

  initContent = () => {
    this.registerButton.createComponent();
    this.cancelButton.createComponent();
  }

  onOpen() {
    this.usernameRef.focus();
  }

  onKeyPress(event) {
    this.displayErrorMessage();

    if (event.charCode === 13 && this.username.length > 0 && this.password.length > 0 && this.password === this.confirmPassword) {
      this.register();
      return;
    }
  }
}
