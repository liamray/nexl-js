import {Component, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';

@Component({
  selector: '.app-auth-menu',
  templateUrl: './auth-menu.component.html',
  styleUrls: ['./auth-menu.component.css']
})
export class AuthMenuComponent implements OnInit, AfterViewInit {
  @ViewChild('authMenuRef')
  myMenu: jqxMenuComponent;

  constructor() {
  }

  ngOnInit() {

  }

  ngAfterViewInit(): void {
    this.myMenu.setItemOpenDirection('menu-direction', 'left', 'down');
  }

  isLoginVisible() {
    return true;
  }

  isLoginHidden() {
    return false;
  }

}
