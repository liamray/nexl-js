import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {MainMenuComponent} from './main-menu/main-menu.component';
import {AuthMenuComponent} from './auth-menu/auth-menu.component';
import {NexlLogoComponent} from './nexl-logo/nexl-logo.component';
import {NexlSourcesExplorer} from './nexl-sources-explorer/nexl-sources-explorer.component';
import {NexlSourcesEditor} from './nexl-source-editor/nexl-sources-editor.component';
import {NexlExpressionsTester} from './nexl-expressions-tester/nexl-expressions-tester.component';

import {jqxMenuComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxtree';
import {jqxExpanderComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxexpander';

@NgModule({
	declarations: [
		AppComponent,
		jqxMenuComponent,
		jqxTreeComponent,
		jqxExpanderComponent,
		NexlLogoComponent,
		MainMenuComponent,
		AuthMenuComponent,
		NexlSourcesExplorer,
		NexlSourcesEditor,
		NexlExpressionsTester
	],
	imports: [
		BrowserModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {
}