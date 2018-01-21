import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {AuthService} from "../../services/auth.service";


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

  onLogin() {
    console.log('Logging  in...');
    this.authService.login('test', 'test');
  }
}
