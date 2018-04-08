import {Component, ElementRef, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {jqxPasswordInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxpasswordinput";
import jqxValidator = jqwidgets.jqxValidator;


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  @ViewChild('validator') validator: jqxValidator;
  @ViewChild('loginWindow') loginWindow: jqxWindowComponent;
  @ViewChild('usernameRef') usernameRef: jqxInputComponent;
  @ViewChild('passwordRef') passwordRef: jqxPasswordInputComponent;
  @ViewChild('messageBox') messageBox: ElementRef;
  @ViewChild('loginButton') loginButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  username = '';
  password = '';
  validationRules =
    [];

  constructor(private authService: AuthService, private globalComponentsService: GlobalComponentsService) {
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
    this.password = '';
    // WTF BUG ???
    this.usernameRef.val(this.username);
    this.passwordRef.val(this.password);
    this.loginWindow.open();
  }

  login() {
    this.globalComponentsService.loader.open();

    this.authService.login(this.username, this.password)
      .subscribe(
        response => {
          this.globalComponentsService.loader.close();
          this.loginWindow.close();
          this.authService.refreshStatus();
        },
        err => {
          this.globalComponentsService.loader.close();
          this.password = '';
          this.displayErrorMessage(err.statusText);
        });
  }

  initContent = () => {
    this.loginButton.createComponent();
    this.cancelButton.createComponent();
  }

  onOpen() {
    this.usernameRef.focus();
  }

  onKeyPress(event) {
    if (event.keyCode === 13 && this.username.length > 0 && this.password.length > 0) {
      this.login();
      return;
    }
  }
}
