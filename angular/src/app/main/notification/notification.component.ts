import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxNotificationComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxnotification";
import {GlobalComponentsService} from "../../services/global-components.service";

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {
  @ViewChild("msgNotification") msgNotification: jqxNotificationComponent;

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.notification = this;
  }

  open(text: string) {
    document.getElementById('notification-text').innerText = text;
    this.msgNotification.open();
  }
}
