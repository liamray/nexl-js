import {Component, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {AuthService} from "../../../services/auth.service";

@Component({
  selector: '.app-auth-menu',
  templateUrl: './auth-menu.component.html',
  styleUrls: ['./auth-menu.component.css']
})
export class AuthMenuComponent implements OnInit, AfterViewInit {
  @ViewChild('authMenuRef') myMenu: jqxMenuComponent;

  isLoginVisible = true;

  constructor(private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.isLoggedIn().subscribe(
      (response) => {
        const username = response['body'];
        document.getElementById('logged-in-username').innerText = 'Hello, ' + username;
        this.isLoginVisible = false;
      },
      () => {
        this.isLoginVisible = true;
      }
    );
  }

  ngAfterViewInit(): void {
    this.myMenu.setItemOpenDirection('menu-direction', 'left', 'down');
  }

}
