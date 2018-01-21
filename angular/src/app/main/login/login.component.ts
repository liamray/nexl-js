import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";
import {NgForm} from "@angular/forms";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('loginWindow') loginWindow: jqxWindowComponent;

  constructor(private authService: AuthService) {
  }

  ngOnInit() {

  }

  show() {
    this.loginWindow.open();
  }

  onLogin(loginForm: NgForm) {
    const username = loginForm.form.controls['username'].value;
    const password = loginForm.form.controls['password'].value;

    console.log('Logging in with %s:%s', username, password);

    this.authService.login(username, password);
  }
}
