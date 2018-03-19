import {Component, ViewChild, AfterViewInit} from '@angular/core';
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {Subscription} from 'rxjs/Subscription';
import {MessageService} from "../../../services/message.service";

@Component({
  selector: '.app-auth-menu',
  templateUrl: './auth-menu.component.html',
  styleUrls: ['./auth-menu.component.css']
})
export class AuthMenuComponent implements AfterViewInit {
  @ViewChild('authMenuRef') myMenu: jqxMenuComponent;

  subscription: Subscription;
  isLoginVisible = true;
  username = '';

  constructor(private messageService: MessageService) {
    this.subscription = this.messageService.getMessage().subscribe(status => {
      this.isLoginVisible = !status.isLoggedIn;
      this.username = status.username;
    });
  }

  ngAfterViewInit(): void {
    this.myMenu.setItemOpenDirection('menu-direction', 'left', 'down');
  }
}
