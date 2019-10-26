import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {HttpRequestService} from "../../services/http.requests.service";
import jqxPasswordInput = jqwidgets.jqxPasswordInput;
import jqxValidator = jqwidgets.jqxValidator;
import jqxCheckBox = jqwidgets.jqxCheckBox;

export const ICONS = {
  INFO: {icon: 'msgBoxInfoIcon', title: 'Information'},
  WARNING: {icon: 'msgBoxWarningIcon', title: 'Warning'},
  ERROR: {icon: 'msgBoxErrorIcon', title: 'Error'},
};

@Component({
  selector: 'app-webhook',
  templateUrl: './webhook.component.html',
  styleUrls: ['./webhook.component.css']
})
export class WebhookComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;

  @ViewChild('relativePath') relativePath: jqxInputComponent;
  @ViewChild('url') url: jqxInputComponent;
  @ViewChild('secret') secret: jqxPasswordInput;
  @ViewChild('isDisabled') isDisabled: jqxCheckBox;
  @ViewChild('webhookValidator') webhookValidator: jqxValidator;

  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;


  isUpdating = false;
  webhookData: any = {};
  errorMsg: string;

  webhookValidationRules =
    [
      {
        input: '#relativePath',
        message: 'Path cannot be empty',
        action: 'keyup, blur',
        rule: (): any => {
          const val = this.relativePath.val();
          return val.length > 0;
        }
      },
      {
        input: '#url',
        message: 'URL cannot be empty',
        action: 'keyup, blur',
        rule: (): any => {
          const val = this.url.val();
          return val.length > 0;
        }
      },
      {
        input: '#url',
        message: 'Invalid URL',
        action: 'keyup, blur',
        rule: (): any => {
          const val = this.url.val();
          return val.match(/^https?:\/\/.+/) !== null;
        }
      }
    ];

  width: number = 365;
  title: string = '';

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  constructor(private globalComponentsService: GlobalComponentsService, private http: HttpRequestService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(message => {
      if (message.type === MESSAGE_TYPE.EDIT_WEBHOOK) {
        this.openWindow(message.data);
      }
    });
  }

  onValidationSuccess() {
    if (!this.isUpdating) {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    // loading data
    this.http.post(this.webhookData, REST_URLS.WEBHOOKS.URLS.EDIT_WEBHOOK, 'json').subscribe(
      (data: any) => {
        this.globalComponentsService.loader.close();
        this.window.close();
        this.messageService.sendMessage(MESSAGE_TYPE.WEBHOOK_UPDATED);
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to ${this.errorMsg} . Reason : [${err.statusText}]`);
        console.log(err);
      });
  }

  private proceed() {
    this.isUpdating = true;
    this.webhookValidator.validate(document.getElementById('webhookForm'));
  }

  private openWindow(data: any) {
    this.isUpdating = false;
    this.webhookData = data;

    this.isDisabled.val(this.webhookData.isDisabled);

    // this dialog window is being used to create and modify a webhook
    // new webhooks don't have a data.id
    // using different titles
    this.title = (data.id === undefined ) ? 'New Webhook' : 'Modifying a Webhook';
    this.window.setTitle(this.title);
    this.errorMsg = (data.id === undefined ) ? 'create' : 'update';

    this.url.val(data.url);
    this.relativePath.val(data.relativePath);

    this.window.open();
  }

  onValidationError() {
    this.isUpdating = false;
  }


  ngOnInit() {
  }

  onClose() {
  }

  open() {
  }
}
