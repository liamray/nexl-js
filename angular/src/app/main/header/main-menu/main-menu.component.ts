import {Component, ViewChild, AfterViewInit} from '@angular/core';

@Component({
	selector: '.app-main-menu',
	templateUrl: './main-menu.component.html',
	styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements AfterViewInit {
  @ViewChild('mainMenuRef') mainMenu: any;

	constructor() {
	}

  ngAfterViewInit(): void {
    this.mainMenu.disable('main-menu-permissions', true);
    this.mainMenu.disable('main-menu-settings', true);
  }
}
