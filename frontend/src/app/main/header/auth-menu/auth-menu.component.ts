import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {Subscription} from 'rxjs/Subscription';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {AuthService} from "../../services/auth.service";
import {GlobalComponentsService} from "../../services/global-components.service";
import {ICONS} from "../../misc/messagebox/messagebox.component";

@Component({
  selector: '.app-auth-menu',
  templateUrl: './auth-menu.component.html',
  styleUrls: ['./auth-menu.component.css']
})
export class AuthMenuComponent implements AfterViewInit {
  @ViewChild('authMenuRef') authMenu: jqxMenuComponent;

  subscription: Subscription;
  isLoginVisible = true;
  username = '';
  isAdmin = false;

  constructor(private messageService: MessageService, private authService: AuthService, private globalComponentsService: GlobalComponentsService) {
    this.subscription = this.messageService.getMessage().subscribe(message => {
      if (message.type === MESSAGE_TYPE.AUTH_CHANGED) {
        const status = message.data;
        this.isLoginVisible = !status.isLoggedIn;
        this.username = status.username;
        this.isAdmin = status.isAdmin;
      }
    });
  }

  ngAfterViewInit(): void {
    this.authMenu.setItemOpenDirection('menu-direction', 'left', 'down');
  }

  logout() {
    this.globalComponentsService.loader.open();

    this.authService.logout().subscribe(
      _ => {
        this.globalComponentsService.loader.close();
        this.authService.refreshStatus();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, err.statusText);
        console.log(err);
      }
    );
  }

  openLoginWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_LOGIN_WINDOW);
  }

  openRegisterWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_REGISTER_WINDOW);
  }

  openChangePasswordWindow() {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_CHANGE_PASSWORD_WINDOW);
  }
}
