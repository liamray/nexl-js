import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {HttpClient} from "@angular/common/http";
import {environment} from '../../../environments/environment';

const url = environment.nexlRootUrl + '/auth/login';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @ViewChild('loginWindow') loginWindow: jqxWindowComponent;

  constructor(private httpClient: HttpClient) {
  }

  ngOnInit() {

  }

  show() {
    this.loginWindow.open();
  }

  onLogin() {
    console.log('Logging  in...');

    this.httpClient.post(url, {
      username: 'test',
      password: 'test'
    }, {
      responseType: 'text'
    }).subscribe(data => console.log(data));
  }

}
