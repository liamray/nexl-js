import {NgModule} from "@angular/core";
import {HttpClientModule} from "@angular/common/http";

import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtree';
import {jqxExpanderComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander';
import {jqxTabsComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs';
import {jqxSplitterComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxsplitter';
import {jqxComboBoxComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxcombobox';
import {jqxButtonComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons';
import {jqxTooltipComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtooltip';
import {jqxWindowComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {jqxRibbonComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon';
import {jqxLoaderComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxloader';
import {jqxInputComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxinput';
import {jqxDropDownListComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxdropdownlist';


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
import {LoginComponent} from './login/login.component';
import {AuthService} from "../services/auth.service";
import {FormsModule} from "@angular/forms";
import {PermissionsComponent} from './permissions/permissions.component';
import {AdminsComponent} from './permissions/admins/admins.component';
import {AssignPermissionsComponent} from './permissions/assignpermissions/assignpermissions.component';
import {PermissionsService} from "../services/permissions.service";
import {LoaderComponent} from './loader/loader.component';
import {LoaderService} from "../services/loader.service";
import {SettingsComponent} from './settings/settings.component';
import {GeneralComponent} from './settings/general/general.component';
import {BindingsComponent} from './settings/bindings/bindings.component';
import {LoggerComponent} from './settings/logger/logger.component';
import {CallbacksComponent} from './settings/callbacks/callbacks.component';
import {UiComponent} from './settings/ui/ui.component';
import {SplashscreenComponent} from './splashscreen/splashscreen.component';
import {PathComponent} from "./settings/general/path/path.component";

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
    jqxGridComponent,
    jqxRibbonComponent,
    jqxLoaderComponent,
    jqxInputComponent,
    jqxDropDownListComponent,

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
    LoginComponent,
    PermissionsComponent,
    AdminsComponent,
    AssignPermissionsComponent,
    LoaderComponent,
    SettingsComponent,
    GeneralComponent,
    BindingsComponent,
    LoggerComponent,
    CallbacksComponent,
    UiComponent,
    SplashscreenComponent,
    PathComponent
  ],

  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule
  ],

  providers: [
    NexlSourcesService,
    AuthService,
    PermissionsService,
    LoaderService
  ],

  exports: [
    MainComponent
  ]
})
export class MainModule {

}
