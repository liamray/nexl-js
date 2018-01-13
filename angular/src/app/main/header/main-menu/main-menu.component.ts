import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { jqxMenuComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';

@Component({
	selector: '.app-main-menu',
	templateUrl: './main-menu.component.html',
	styleUrls: ['./main-menu.component.css']
})
export class MainMenuComponent implements OnInit {
	@ViewChild('mainMenuRef') myMenu: jqxMenuComponent;

	constructor() {
	}

	ngOnInit() {
	}

}
