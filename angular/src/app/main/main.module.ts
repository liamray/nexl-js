import {NgModule} from "@angular/core";
import {HttpClientModule} from "@angular/common/http";

import { jqxMenuComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import { jqxTreeComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtree';
import { jqxExpanderComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander';
import { jqxTabsComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs';
import { jqxSplitterComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxsplitter';
import { jqxComboBoxComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxcombobox';
import { jqxButtonComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons';
import { jqxTooltipComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtooltip';
import { jqxWindowComponent } from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';

import {HeaderComponent} from './header/header.component';
import {NexlLogoComponent} from './header/nexl-logo/nexl-logo.component';
import {MainMenuComponent} from './header/main-menu/main-menu.component';
import {AuthMenuComponent} from './header/auth-menu/auth-menu.component';

import {ContentComponent} from './content/content.component';
import {NexlSourcesExplorerComponent} from './content/nexl-sources-explorer/nexl-sources-explorer.component';
import {NexlSourcesEditorComponent} from './content/nexl-source-editor/nexl-sources-editor.component';
import {NexlExpressionsTesterComponent} from './content/nexl-expressions-tester/nexl-expressions-tester.component';

import {NexlSourcesService} from "../services/nexl-sources.service";
import {MainComponent} from "./main.component";
import {BrowserModule} from '@angular/platform-browser';
import { LoginComponent } from './login/login.component';

@NgModule({
	declarations: [
		jqxMenuComponent,
		jqxTreeComponent,
		jqxExpanderComponent,
		jqxTabsComponent,
		jqxSplitterComponent,
		jqxComboBoxComponent,
		jqxButtonComponent,
		jqxTooltipComponent,
    jqxWindowComponent,

		HeaderComponent,
		NexlLogoComponent,
		MainMenuComponent,
		AuthMenuComponent,
		NexlSourcesExplorerComponent,
		NexlSourcesEditorComponent,
		NexlExpressionsTesterComponent,
		HeaderComponent,
		ContentComponent,
		MainComponent,
		LoginComponent
	],

	imports: [
		HttpClientModule,
		BrowserModule
	],

	providers: [
		NexlSourcesService
	],

	exports: [
		MainComponent
	]
})
export class MainModule {

}