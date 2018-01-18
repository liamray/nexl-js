import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('loginWindow') loginWindow: jqxWindowComponent;

  constructor() {
  }

  ngOnInit() {

  }

  show() {
    this.loginWindow.open();
  }

}
