import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";
import {UtilsService} from "../../services/utils.service";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import jqxValidator = jqwidgets.jqxValidator;
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

export class PathService {
  path: any;

  getNexlSourcesPath() {
    return this.path || [];
  }

  setNexlSourcesPath(path) {
    this.path = path;
  }
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  providers: [PathService]
})
export class SettingsComponent {
  @ViewChild('settingsWindow') settingsWindow: jqxWindowComponent;
  @ViewChild('pathWindow') pathWindow: any;
  @ViewChild('ribbon') ribbon: jqxRibbonComponent;
  @ViewChild('validator') validator: jqxValidator;
  @ViewChild('nexlSourcesEncoding') nexlSourcesEncoding: any;
  @ViewChild('httpTimeout') httpTimeout: any;
  @ViewChild('httpBinding') httpBiding: any;
  @ViewChild('httpPort') httpPort: any;
  @ViewChild('httpsBinding') httpsBiding: any;
  @ViewChild('httpsPort') httpsPort: any;
  @ViewChild('sslKeyLocation') sslKeyLocation: any;
  @ViewChild('sslCertLocation') sslCertLocation: any;
  @ViewChild('logLevel') logLevel: any;
  @ViewChild('logRotateFileSize') logRotateFileSize: any;
  @ViewChild('logRotateFilesCount') logRotateFilesCount: any;
  @ViewChild('saveButton') saveButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  settings: any = {};
  isAdmin = false;
  nexlSourcesDirBefore: string;
  isSaving: boolean;
  width = 190;
  encodings = [];
  themes = ['android', 'arctic', 'base', 'black', 'blackberry', 'bootstrap', 'classic', 'dark', 'darkblue', 'energyblue', 'flat', 'fresh', 'glacier', 'highcontrast', 'light', 'metro', 'metrodark', 'mobile', 'office', 'orange', 'shinyblack', 'summer', 'ui-darkness', 'ui-le-frog', 'ui-lightness', 'ui-overcast', 'ui-redmond', 'ui-smoothness', 'ui-start', 'ui-sunny', 'web', 'windowsphone'];
  logLevels = [];

  validationRules =
    [
      {input: '#nexlSourcesDir', message: 'nexl sources dir is required!', action: 'keyup, blur', rule: 'required'},
      {
        input: '#httpTimeout', message: 'HTTP timeout must be a positive integer', action: 'keyup, blur',
        rule: (input: any, commit: any): any => {
          const val = this.httpTimeout.val() || '0';
          return UtilsService.isPositiveIneger(val);
        }
      },
      {input: '#httpBinding', message: 'HTTP bindings is required!', action: 'keyup, blur', rule: 'required'},
      {input: '#httpPort', message: 'HTTP port is required!', action: 'keyup, blur', rule: 'required'},
      {
        input: '#httpPort', message: 'HTTP port must be a positive integer', action: 'keyup, blur',
        rule: (input: any, commit: any): any => {
          const val = this.httpPort.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      },
      {
        input: '#httpsPort', message: 'HTTPS port must be a positive integer', action: 'keyup, blur',
        rule: (input: any, commit: any): any => {
          const val = this.httpsPort.val() || '0';
          return UtilsService.isPositiveIneger(val);
        }
      }
    ];

  constructor(private http: HttpRequestService, private globalComponentsService: GlobalComponentsService, private settingsService: PathService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.AUTH_CHANGED: {
            this.authChanged(message.data);
            return;
          }
        }
      });
  }

  authChanged(status: any) {
    this.isAdmin = status.isAdmin;
  }

  disableAdminItems() {
    this.ribbon.disableAt(0);
    this.ribbon.disableAt(1);
    this.ribbon.disableAt(2);
  }

  enableAdminItems() {
    this.ribbon.enableAt(0);
    this.ribbon.enableAt(1);
    this.ribbon.enableAt(2);
  }

  openInner() {
    this.nexlSourcesDirBefore = undefined;

    // loading data
    this.http.post({}, '/settings/load', 'json').subscribe(
      (data: any) => {
        this.settings = data.body;
        this.globalComponentsService.loader.close();
        this.logLevel.val(this.settings['log-level']);
        this.nexlSourcesEncoding.val(this.settings['nexl-sources-encoding']);
        this.settingsService.setNexlSourcesPath(this.settings['nexl-sources-path']);
        this.nexlSourcesDirBefore = this.settings['nexl-sources-dir'];
        this.settingsWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to load settings\nReason : ' + err.statusText);
        console.log(err);
      });

  }

  open() {
    if (!this.isAdmin) {
      this.settingsWindow.open();
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    if (this.encodings.length > 0 && this.logLevels.length > 0) {
      this.openInner();
      return;
    }

    // loading available values from server
    this.http.post({}, '/settings/avail-values', 'json').subscribe(
      (data: any) => {
        this.encodings = data.body.encodings;
        this.logLevels = data.body.logLevels;
        this.openInner();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to load settings\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }

  initContent = () => {
    this.ribbon.createComponent();
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  }

  validate() {
    this.validator.validate(document.getElementById('settingsForm'));
  }

  save() {
    this.isSaving = true;

    if (!this.isAdmin) {
      this.saveUI();
      this.settingsWindow.close();
      return;
    }

    this.validate();
  }

  saveUI() {

  }

  onValidationSuccess(event) {
    console.log('Okokokok');
    if (!this.isSaving) {
      return;
    }

    this.settingsWindow.close();
    this.globalComponentsService.loader.open();
    this.settings['nexl-sources-path'] = this.settingsService.getNexlSourcesPath();

    this.http.post(this.settings, '/settings/save', 'json').subscribe(
      () => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openSuccess('Updated settings');
        if (this.nexlSourcesDirBefore !== this.settings['nexl-sources-dir']) {
          this.messageService.sendMessage(MESSAGE_TYPE.RELOAD_NEXL_SOURCES);
        }
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to save settings\nReason : ' + err.statusText);
        console.log(err);
      });
  }

  onValidationError(event) {
    this.isSaving = false;
  }

  onOpen() {
    this.isSaving = false;
    if (!this.isAdmin) {
      this.disableAdminItems();
      this.ribbon.selectAt(3);
    } else {
      this.enableAdminItems();
    }
  }
}
