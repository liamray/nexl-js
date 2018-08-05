import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

@Component({
  selector: '.app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements AfterViewInit {
  @ViewChild('mainMenuRef') mainMenu: any;

  tabsCount = 0;
  hasReadPermission = false;
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
        this.mainMenu.disable('main-menu-users', !status.isAdmin);
        this.hasReadPermission = status.hasReadPermission;
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
    this.mainMenu.disable('main-menu-find-file', !this.hasReadPermission);
    this.mainMenu.disable('main-menu-save', this.tabsCount < 1 || !this.hasWritePermission);
    this.mainMenu.disable('main-menu-prettify', this.tabsCount < 1 || !this.hasWritePermission);
    this.mainMenu.disable('main-menu-close-all', this.tabsCount < 1);

    this.mainMenu.disable('main-menu-arguments', this.tabsCount < 1 || !this.hasReadPermission);
    this.mainMenu.disable('main-menu-evaluate', this.tabsCount < 1 || !this.hasReadPermission);
  }

  ngAfterViewInit(): void {
    this.mainMenu.disable('main-menu-permissions', true);
    this.mainMenu.disable('main-menu-settings', true);
    this.mainMenu.disable('main-menu-users', true);
    this.mainMenu.disable('main-menu-prettify', true);
  }

  saveJSFile() {
    this.messageService.sendMessage(MESSAGE_TYPE.SAVE_JS_FILE);
  }

  closeAllTabs() {
    this.messageService.sendMessage(MESSAGE_TYPE.CLOSE_ALL_TABS);
  }

  createExamplesFile() {
    this.messageService.sendMessage(MESSAGE_TYPE.VIEW_EXAMPLES);
  }

  toggleArgsWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.TOGGLE_ARGS_WINDOW);
  }

  evaluateNexlExpression() {
    this.messageService.sendMessage(MESSAGE_TYPE.EVAL_NEXL_EXPRESSION);
  }

  openAppearanceWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_APPEARANCE_WINDOW);
  }

  openPermissionsWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_PERMISSIONS_WINDOW);
  }

  openSettingsWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_SETTINGS_WINDOW);
  }

  openAboutWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_ABOUT_WINDOW);
  }

  findFile() {
    this.messageService.sendMessage(MESSAGE_TYPE.FIND_FILE);
  }

  openUsersWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.USERS_WINDOW);
  }

  prettifyFile() {
    this.messageService.sendMessage(MESSAGE_TYPE.PRETTIFY_FILE);
  }
}
