import {Component, ViewChild} from '@angular/core';
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {HttpRequestService} from "../../services/http.requests.service";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";


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
  isAdmin = false;

  constructor(private globalComponentsService: GlobalComponentsService, private http: HttpRequestService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.AUTH_CHANGED: {
            this.isAdmin = message.data.isAdmin;
            return;
          }

          case MESSAGE_TYPE.OPEN_GENERATE_TOKEN_WINDOW: {
            this.open();
            return;
          }
        }
      });
  }

  open() {
    if (!this.isAdmin) {
      return;
    }

    this.generateTokenWindow.open();
  }

  onOpen() {
    this.usernameRef.focus();
    this.usernameRef.val('');
    this.token = '';
  }

  generateToken() {
    if (this.usernameRef.val() === '') {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    // generating token
    this.http.post({username: this.username}, '/auth/generate-token', 'json').subscribe(
      (data: any) => {
        this.globalComponentsService.loader.close();
        this.token = data.body.token;
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to generate new token\nReason : ' + err.statusText);
        console.log(err);
      });
  }

  initContent = () => {
    this.okButton.createComponent();
    this.generateButton.createComponent();
  }
}
