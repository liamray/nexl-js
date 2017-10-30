import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {MainMenuComponent} from './main-menu/main-menu.component';
import {AuthMenuComponent} from './auth-menu/auth-menu.component';

import {jqxMenuComponent} from 'jqwidgets-framework/jqwidgets-ts/angular_jqxmenu';

@NgModule({
    declarations: [
        AppComponent,
        MainMenuComponent,
        AuthMenuComponent,
        jqxMenuComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
