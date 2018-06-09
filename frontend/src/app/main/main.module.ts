import {NgModule} from "@angular/core";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";

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
import {jqxNumberInputComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxnumberinput';
import {jqxValidatorComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxvalidator';
import {jqxCheckBoxComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox';
import {jqxPasswordInputComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxpasswordinput';
import {jqxNotificationComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxnotification';


import {HeaderComponent} from './header/header.component';
import {NexlLogoComponent} from './header/nexl-logo/nexl-logo.component';
import {MainMenuComponent} from './header/main-menu/main-menu.component';
import {AuthMenuComponent} from './header/auth-menu/auth-menu.component';

import {ContentComponent} from './filemanager/content.component';
import {NexlSourcesExplorerComponent} from './filemanager/nexl-sources-explorer/nexl-sources-explorer.component';
import {NexlSourcesEditorComponent} from './filemanager/nexl-sources-editor/nexl-sources-editor.component';
import {NexlExpressionsTesterComponent} from './filemanager/nexl-expressions-tester/nexl-expressions-tester.component';

import {MainComponent} from "./main.component";
import {BrowserModule} from '@angular/platform-browser';
import {LoginComponent} from './authdialogs/login/login.component';
import {FormsModule} from "@angular/forms";
import {PermissionsComponent} from './settingsdialogs/permissions/permissions.component';
import {AdminsComponent} from './settingsdialogs/permissions/admins/admins.component';
import {AssignPermissionsComponent} from './settingsdialogs/permissions/assignpermissions/assignpermissions.component';
import {LoaderComponent} from './misc/loader/loader.component';
import {GlobalComponentsService} from "./services/global-components.service";
import {SettingsComponent} from './settingsdialogs/settings/settings.component';
import {SplashscreenComponent} from './misc/splashscreen/splashscreen.component';
import {HttpRequestService} from "./services/http.requests.service";
import {AuthService} from "./services/auth.service";
import {NexlSourcesService} from "./services/nexl-sources.service";
import {MessageService} from "./services/message.service";
import {RegisterComponent} from "./authdialogs/register/register.component";
import {GenerateTokenComponent} from "./authdialogs/generatetoken/generatetoken.component";
import {ChangePasswordComponent} from "./authdialogs/changepassword/changepassword.component";
import {NotificationComponent} from './misc/notification/notification.component';
import {InputBoxComponent} from './misc/inputbox/inputbox.component';
import {ConfirmBoxComponent} from "./misc/confirmbox/confirmbox.component";
import {LocalStorageService} from "./services/localstorage.service";
import {ArgsComponent} from './filemanager/nexl-expressions-tester/args/args.component';
import {AppearanceComponent} from "./settingsdialogs/appearance/appearance.component";
import {AuthHttpInterceptor} from "./services/auth.http.interceptor";
import {jqxPanelComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxpanel";
import {MessageBoxComponent} from "./misc/messagebox/messagebox.component";
import {jqxToggleButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtogglebutton";


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
    jqxNumberInputComponent,
    jqxValidatorComponent,
    jqxCheckBoxComponent,
    jqxPasswordInputComponent,
    jqxNotificationComponent,
    jqxPanelComponent,
    jqxToggleButtonComponent,

    HeaderComponent,
    NexlLogoComponent,
    MainMenuComponent,
    AuthMenuComponent,
    GenerateTokenComponent,
    ChangePasswordComponent,
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
    AppearanceComponent,
    SplashscreenComponent,
    RegisterComponent,
    NotificationComponent,
    InputBoxComponent,
    MessageBoxComponent,
    ConfirmBoxComponent,
    ArgsComponent
  ],

  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule
  ],

  providers: [
    GlobalComponentsService,
    AuthService,
    NexlSourcesService,
    HttpRequestService,
    MessageService,
    LocalStorageService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true
    }
  ],

  entryComponents: [],

  exports: [
    MainComponent
  ]
})
export class MainModule {

}
