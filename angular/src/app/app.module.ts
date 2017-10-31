import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {MainMenuComponent} from './main-menu/main-menu.component';
import {AuthMenuComponent} from './auth-menu/auth-menu.component';
import {NexlLogoComponent} from './nexl-logo/nexl-logo.component';
import {NexlSourcesExplorer} from './nexl-sources-explorer/nexl-sources-explorer.component';

import {jqxMenuComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxtree';

@NgModule({
	declarations: [
		AppComponent,
		jqxMenuComponent,
		jqxTreeComponent,
		NexlLogoComponent,
		MainMenuComponent,
		AuthMenuComponent,
		NexlSourcesExplorer
	],
	imports: [
		BrowserModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}