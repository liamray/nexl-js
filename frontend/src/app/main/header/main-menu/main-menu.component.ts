import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";

@Component({
  selector: '.app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements AfterViewInit {
  @ViewChild('mainMenuRef') mainMenu: any;

  tabsCount = 0;
  hasWritePermission = false;

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(message => {
      this.handleMessages(message);
    });
  }

  handleMessages(message) {
    switch (message.type) {
      case MESSAGE_TYPE.AUTH_CHANGED: {
        const status = message.data;
        this.mainMenu.disable('main-menu-permissions', !status.isAdmin);
        this.mainMenu.disable('main-menu-settings', !status.isAdmin);
        this.hasWritePermission = status.hasWritePermission;
        this.updateSaveMenuItem();
        return;
      }

      case MESSAGE_TYPE.TABS_COUNT_CHANGED: {
        this.tabsCount = message.data;
        this.updateSaveMenuItem();
        return;
      }
    }
  }

  updateSaveMenuItem() {
    this.mainMenu.disable('main-menu-save', this.tabsCount < 1 || !this.hasWritePermission);
  }

  ngAfterViewInit(): void {
    this.mainMenu.disable('main-menu-permissions', true);
    this.mainMenu.disable('main-menu-settings', true);
  }

  saveNexlSource() {
    this.messageService.sendMessage(MESSAGE_TYPE.SAVE_NEXL_SOURCE);
  }

  closeAllTabs() {
    this.messageService.sendMessage(MESSAGE_TYPE.CLOSE_ALL_TABS);
  }

  createExamplesFile() {
    this.messageService.sendMessage(MESSAGE_TYPE.CREATE_EXAMPLES_FILE);
  }
}
