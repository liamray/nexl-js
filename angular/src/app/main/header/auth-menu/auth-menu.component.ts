import {Component, ViewChild, AfterViewInit} from '@angular/core';
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {Subscription} from 'rxjs/Subscription';
import {MessageService} from "../../../services/message.service";
import {AuthService} from "../../../services/auth.service";

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

  constructor(private messageService: MessageService, private authService: AuthService) {
    this.subscription = this.messageService.getMessage().subscribe(status => {
      this.isLoginVisible = !status.isLoggedIn;
      this.username = status.username;
      this.authMenu.disable('menu-generate-token', !status.isAdmin);
    });
  }

  ngAfterViewInit(): void {
    this.authMenu.setItemOpenDirection('menu-direction', 'left', 'down');
  }

  logout() {
    this.authService.logout();
  }
}
