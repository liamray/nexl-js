import {Component, ViewChild} from '@angular/core';
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {LoaderService} from "../../../services/loader.service";
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {HttpRequestService} from "../../../services/http.requests.service";


@Component({
  selector: 'app-generate-token',
  templateUrl: './generatetoken.component.html',
  styleUrls: ['./generatetoken.component.css']
})
export class GenerateTokenComponent {
  @ViewChild('generateTokenWindow') generateTokenWindow: jqxWindowComponent;
  @ViewChild('usernameRef') usernameRef: jqxInputComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('generateButton') generateButton: jqxButtonComponent;

  token = '';
  username = '';

  constructor(private loaderService: LoaderService, private http: HttpRequestService) {
  }

  open() {
    this.generateTokenWindow.open();
  }

  onOpen() {
    this.usernameRef.focus();
  }

  generateToken() {
    // opening indicator
    this.loaderService.loader.open();

    // generating token
    this.http.post({username: this.username}, '/auth/generate-token', 'json').subscribe(
      (data: any) => {
        this.loaderService.loader.close();
        this.token = data.body.token;
      },
      err => {
        this.loaderService.loader.close();
        alert('Something went wrong !');
        console.log(err);
      });
  }

  initContent = () => {
    this.okButton.createComponent();
    this.generateButton.createComponent();
  }
}
