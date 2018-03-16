import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {NgForm} from "@angular/forms";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import jqxValidator = jqwidgets.jqxValidator;
import {LoaderService} from "../../services/loader.service";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  @ViewChild('validator') validator: jqxValidator;
  @ViewChild('loginWindow') loginWindow: jqxWindowComponent;
  @ViewChild('loginButton') loginButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;


  username: string = '';
  password: string = '';
  isValidCredentials: boolean = false;
  validationRules =
    [
      {
        input: '#password', message: 'Bad credentials', action: 'null',
        rule: (input: any, commit: any): any => {
          return this.isValidCredentials;
        }
      }
    ];

  constructor(private authService: AuthService, private loaderService: LoaderService) {
  }

  open() {
    this.username = '';
    this.password = '';
    this.loginWindow.open();
  }

  login(loginForm: NgForm) {
    this.isValidCredentials = false;

    this.loaderService.loader.open();

    this.authService.login(this.username, this.password)
      .subscribe(
        response => {
          this.loaderService.loader.close();
          this.isValidCredentials = true;
          this.validator.validate(document.getElementById('loginForm'));
        },
        err => {
          this.loaderService.loader.close();
          this.isValidCredentials = false;
          this.password = '';
          this.validator.validate(document.getElementById('loginForm'));
        });
  }

  onValidationSuccess() {
    this.loginWindow.close();
  }

  initContent = () => {
    this.loginButton.createComponent();
    this.cancelButton.createComponent();
  }

}
