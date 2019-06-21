import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {HttpRequestService} from "../../services/http.requests.service";
import jqxPasswordInput = jqwidgets.jqxPasswordInput;
import jqxValidator = jqwidgets.jqxValidator;

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
  @ViewChild('webhookValidator') webhookValidator: jqxValidator;

  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;


  isUpdating = false;
  webhookData = {};

  webhookValidationRules =
    [
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
      if (message.type === MESSAGE_TYPE.OPEN_WEBHOOK_DIALOG) {
        this.openWindow(message.data);
      }
    });
  }

  private openWindow(data: any) {
    this.isUpdating = false;
    this.webhookData = data;

    // this dialog window is being used to create and modify a webhook
    // new webhooks don't have a data.id
    // using different titles
    this.title = (data.id === undefined ) ? 'New Webhook' : 'Modifying a Webhook';
    this.window.setTitle(this.title);

    this.url.val(data.url);
    this.relativePath.val(data.relativePath);

    this.window.open();
  }

  private proceed() {
    this.isUpdating = true;
    this.webhookValidator.validate(document.getElementById('webhookForm'));
  }

  onValidationSuccess() {
    if (!this.isUpdating) {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    // loading data
    this.http.post(this.webhookData, REST_URLS.PERMISSIONS.URLS.ADD_MODIFY_WEBHOOK, 'json').subscribe(
      (data: any) => {
        // this.permissions = data.body;
        // this.globalComponentsService.loader.close();
        // this.admins.set(this.permissions.admins);
        // this.assignpermissions.set(this.permissions.assignPermissions);
        // this.permissionsWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to load permissions list. Reason : [${err.statusText}]`);
        console.log(err);
      });
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
