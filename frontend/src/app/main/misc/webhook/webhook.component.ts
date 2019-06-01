import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxCheckBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import jqxPasswordInput = jqwidgets.jqxPasswordInput;

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
  @ViewChild('isDisabled') isDisabled: jqxCheckBoxComponent;

  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  width: number = 365;
  title: string = '';

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(message => {
      if (message.type === MESSAGE_TYPE.OPEN_WEBHOOK_DIALOG) {
        this.openWindow(message.data);
      }
    });
  }

  private openWindow(data: any) {
    // this dialog window is being used to create and modify a webhook
    // new webhooks don't have a data.id
    // using different titles
    this.title = (data.id === undefined ) ? 'New Webhook' : 'Modifying a Webhook';
    this.window.setTitle(this.title);

    this.url.val(data.url);
    this.relativePath.val(data.relativePath);
    this.isDisabled.val(data.isDiabled);

    this.window.open();
  }

  private proceed() {
    alert('Okay ;)');
    this.window.close();
  }

  ngOnInit() {
  }

  onClose() {
  }

  open() {
  }
}
