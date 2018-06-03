import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxNotificationComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxnotification";
import {GlobalComponentsService} from "../../services/global-components.service";
import {AppearanceService} from "../../services/appearance.service";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  @ViewChild("infoNotification") infoNotification: jqxNotificationComponent;
  @ViewChild("errorNotification") errorNotification: jqxNotificationComponent;
  @ViewChild("successNotification") successNotification: jqxNotificationComponent;

  delay = 60;

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (msg) => {
        if (msg.type === MESSAGE_TYPE.UPDATE_UI) {
          this.updateUISettings();
        }
      }
    );
  }

  updateUISettings() {
    let delay = AppearanceService.load()['notification-message-delay'];
    this.delay = parseInt(delay) * 1000;
  }

  ngOnInit() {
    this.updateUISettings();
    this.globalComponentsService.notification = this;
  }

  openSuccess(text: string) {
    document.getElementById('success-notification-text').innerText = text;
    this.successNotification.open();
  }

  openInfo(text: string) {
    document.getElementById('info-notification-text').innerText = text;
    this.infoNotification.open();
  }

  openError(text: string) {
    document.getElementById('error-notification-text').innerText = text;
    this.errorNotification.open();
  }
}
