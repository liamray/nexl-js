import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";

@Component({
  selector: '.app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements AfterViewInit {
  @ViewChild('mainMenuRef') mainMenu: any;

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(message => {
      if (message.type === MESSAGE_TYPE.AUTH_CHANGED) {
        const status = message.data;
        this.mainMenu.disable('main-menu-permissions', !status.isAdmin);
        this.mainMenu.disable('main-menu-settings', !status.isAdmin);
      }
    });
  }

  ngAfterViewInit(): void {
    this.mainMenu.disable('main-menu-permissions', true);
    this.mainMenu.disable('main-menu-settings', true);
  }

  saveNexlSource() {
    this.messageService.sendMessage({
      type: MESSAGE_TYPE.SAVE_NEXL_SOURCE
    });
  }
}
