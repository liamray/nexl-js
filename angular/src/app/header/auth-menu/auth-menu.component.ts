import {Component, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {jqxMenuComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxmenu';


@Component({
	selector: '.app-auth-menu',
	templateUrl: './auth-menu.component.html',
	styleUrls: ['./auth-menu.component.css']
})
export class AuthMenuComponent implements OnInit, AfterViewInit {
	@ViewChild('authMenuRef')
	myMenu: jqxMenuComponent;

	user: string;

	constructor() {
	}

	ngOnInit() {

	}

	ngAfterViewInit(): void {
		this.myMenu.setItemOpenDirection('menu-direction', 'left', 'down');
	}

	isLoggedIn() {
		return this.user !== undefined;
	}

	isLoginVisible() {
		return this.isLoggedIn() ? 'none' : '';
	}

	isLoginHidden() {
		return !this.isLoggedIn() ? 'none' : '';
	}
}
