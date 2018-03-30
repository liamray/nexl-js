import {Component, ElementRef, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../../services/auth.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import jqxValidator = jqwidgets.jqxValidator;
import {LoaderService} from "../../../services/loader.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {jqxPasswordInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxpasswordinput";


@Component({
  selector: 'app-change-password',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.css']
})
export class ChangePasswordComponent {
  @ViewChild('changePasswordWindow') changePasswordWindow: jqxWindowComponent;
  @ViewChild('oldPasswordRef') oldPasswordRef: jqxPasswordInputComponent;
  @ViewChild('newPasswordRef') newPasswordRef: jqxPasswordInputComponent;
  @ViewChild('confirmPasswordRef') confirmPasswordRef: jqxInputComponent;
  @ViewChild('messageBox') messageBox: ElementRef;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  width = 205;
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

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

    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    // WTF BUG ???
    this.oldPasswordRef.val(this.newPassword);
    this.newPasswordRef.val(this.newPassword);
    this.confirmPasswordRef.val(this.confirmPassword);
    this.changePasswordWindow.open();
  }

  changePassword() {
    this.loaderService.loader.open();

    this.authService.changePassword(this.oldPassword, this.newPassword)
      .subscribe(
        response => {
          this.loaderService.loader.close();
          this.changePasswordWindow.close();
          alert('Success !!!');
        },
        err => {
          this.loaderService.loader.close();
          this.oldPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.displayErrorMessage(err.statusText);
        });
  }

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  }

  onKeyPress(event) {
    this.displayErrorMessage();

    if (event.keyCode === 13 && this.oldPassword.length > 0 && this.newPassword.length > 0 && this.newPassword === this.confirmPassword) {
      this.changePassword();
      return;
    }
  }
}
