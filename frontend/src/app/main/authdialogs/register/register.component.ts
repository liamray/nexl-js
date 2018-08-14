import {Component, ElementRef, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {jqxPasswordInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxpasswordinput";
import jqxValidator = jqwidgets.jqxValidator;
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {ICONS} from "../../misc/messagebox/messagebox.component";


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

  isLoggedIn = false;
  username = '';
  token = '';
  password = '';
  confirmPassword = '';
  validationRules =
    [];

  constructor(private authService: AuthService, private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.AUTH_CHANGED: {
            this.isLoggedIn = message.data.isLoggedIn;
            return;
          }


          case MESSAGE_TYPE.OPEN_REGISTER_WINDOW: {
            this.open();
            return;
          }
        }
      });
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
    if (this.isLoggedIn) {
      return;
    }

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
    if (this.registerButton.disabled()) {
      return;
    }

    if (!COMMON_UTILS.validateUsernameStrength(this.username)) {
      this.displayErrorMessage('Username must contain at least three [A-z0-9] characters and might contain hyphen and underscore characters');
      return;
    }

    if (!COMMON_UTILS.validatePasswordStrength(this.password)) {
      this.displayErrorMessage('Password must contain at least one [A-z] character, one number character and must be at least 5 characters');
      return;
    }

    this.globalComponentsService.loader.open();

    this.authService.register(this.username, this.password, this.token)
      .subscribe(
        response => {
          this.globalComponentsService.loader.close();
          this.registerWindow.close();
          this.globalComponentsService.messageBox.openSimple(ICONS.INFO, `User registered/reset password successfully !`);
        },
        err => {
          this.globalComponentsService.loader.close();
          this.password = '';
          this.confirmPassword = '';
          this.displayErrorMessage(err.statusText);
        });
  }

  initContent = () => {
    this.registerButton.createComponent();
    this.cancelButton.createComponent();
  };

  onOpen() {
    this.usernameRef.focus();
  }

  onKeyPress(event) {
    this.displayErrorMessage();

    if (event.keyCode === 13 && this.username.length > 0 && this.password.length > 0 && this.password === this.confirmPassword) {
      this.register();
      return;
    }
  }
}
