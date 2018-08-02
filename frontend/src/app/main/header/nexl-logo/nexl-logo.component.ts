import {Component} from "@angular/core";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

@Component({
  selector: '.app-nexl-logo',
  templateUrl: './nexl-logo.component.html',
  styleUrls: ['./nexl-logo.component.css']
})
export class NexlLogoComponent {
  constructor(private messageService: MessageService) {
  }

  openAboutWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_ABOUT_WINDOW);
  }
}
