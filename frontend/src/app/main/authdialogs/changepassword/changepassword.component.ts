import {Component, ElementRef, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {jqxPasswordInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxpasswordinput";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {ICONS} from "../../misc/messagebox/messagebox.component";


@Component({
  selector: 'app-change-password',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.css']
})
export class ChangePasswordComponent {
  @ViewChild('changePasswordWindow') changePasswordWindow: jqxWindowComponent;
  @ViewChild('currentPasswordRef') currentPasswordRef: jqxPasswordInputComponent;
  @ViewChild('newPasswordRef') newPasswordRef: jqxPasswordInputComponent;
  @ViewChild('confirmPasswordRef') confirmPasswordRef: jqxInputComponent;
  @ViewChild('messageBox') messageBox: ElementRef;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  width = 205;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  validationRules = [];
  isLoggedIn = false;

  constructor(private authService: AuthService, private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.AUTH_CHANGED: {
            this.isLoggedIn = message.data.isLoggedIn;
            return;
          }

          case MESSAGE_TYPE.OPEN_CHANGE_PASSWORD_WINDOW: {
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
    if (!this.isLoggedIn) {
      return;
    }

    this.displayErrorMessage();

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    // WTF BUG ???
    this.currentPasswordRef.val(this.newPassword);
    this.newPasswordRef.val(this.newPassword);
    this.confirmPasswordRef.val(this.confirmPassword);
    this.changePasswordWindow.open();
  }

  changePassword() {
    if (this.okButton.disabled()) {
      return;
    }

    this.globalComponentsService.loader.open();

    this.authService.changePassword(this.currentPassword, this.newPassword)
      .subscribe(
        _ => {
          this.globalComponentsService.loader.close();
          this.changePasswordWindow.close();
          this.globalComponentsService.messageBox.openSimple(ICONS.INFO, 'Password changed !');
        },
        err => {
          this.globalComponentsService.loader.close();
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.displayErrorMessage(err.statusText);
        });
  }

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  onKeyPress(event) {
    this.displayErrorMessage();

    if (event.keyCode === 13 && this.currentPassword.length > 0 && this.newPassword.length > 0 && this.newPassword === this.confirmPassword) {
      this.changePassword();
      return;
    }
  }
}
