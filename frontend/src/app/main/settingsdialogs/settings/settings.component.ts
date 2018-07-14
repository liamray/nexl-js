import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";
import {UtilsService} from "../../services/utils.service";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import jqxValidator = jqwidgets.jqxValidator;
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import * as LOG_LEVELS from '../../common/winston-log-levels.json';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @ViewChild('settingsWindow') settingsWindow: jqxWindowComponent;
  @ViewChild('ribbon') ribbon: jqxRibbonComponent;
  @ViewChild('validator') validator: jqxValidator;
  @ViewChild('jsFilesEncoding') jsFilesEncoding: any;
  @ViewChild('httpTimeout') httpTimeout: any;
  @ViewChild('httpBinding') httpBiding: any;
  @ViewChild('httpPort') httpPort: any;
  @ViewChild('httpsBinding') httpsBiding: any;
  @ViewChild('httpsPort') httpsPort: any;
  @ViewChild('sslKeyLocation') sslKeyLocation: any;
  @ViewChild('sslCertLocation') sslCertLocation: any;

  @ViewChild('ldapUrl') ldapUrl: any;
  @ViewChild('ldapBaseDN') ldapBaseDN: any;
  @ViewChild('ldapBindDN') ldapBindDN: any;
  @ViewChild('ldapBindPassword') ldapBindPassword: any;
  @ViewChild('ldapFindBy') ldapFindBy: any;

  @ViewChild('logLevel') logLevel: any;
  @ViewChild('logRotateFileSize') logRotateFileSize: any;
  @ViewChild('logRotateFilesCount') logRotateFilesCount: any;
  @ViewChild('saveButton') saveButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  nexlHomeDirToolTip = `<p style=\'text-align: left;\'>nexl home directory contains nexl settings, authentication data and log file(s)<br/> This directory can be specified in the following way as command line argument:<br/> <span style=\'margin-left:30px; font-style: italic\'>nexl --${CONF_CONSTANTS.NEXL_HOME_DEF}=/path/to/nexl/home/dir</span><br/> This might be useful if you need to start multiple nexl server instances<br/> By default nexl home dir located in [\${HOME}/.nexl] directory </p>`;

  settings: any = {};
  isAdmin = false;
  jsFilesRootDirBefore: string;
  isSaving = false;
  width = 190;
  encodings = CONF_CONSTANTS.AVAILABLE_ENCODINGS;
  logLevels = Object.keys(LOG_LEVELS);

  SETTINGS = CONF_CONSTANTS.SETTINGS;
  NEXL_HOME_DEF = CONF_CONSTANTS.NEXL_HOME_DEF;

  validationRules =
    [
      {input: '#jsFilesRootDir', message: 'JS files root dir is required!', action: 'keyup, blur', rule: 'required'},
      {
        input: '#httpTimeout', message: 'HTTP timeout must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          const val = this.httpTimeout.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      },
      {input: '#httpBinding', message: 'HTTP bindings is required!', action: 'keyup, blur', rule: 'required'},
      {input: '#httpPort', message: 'HTTP port is required!', action: 'keyup, blur', rule: 'required'},
      {
        input: '#httpPort', message: 'HTTP port must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          const val = this.httpPort.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      },
      {
        input: '#httpsPort', message: 'HTTPS port must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          const val = this.httpsPort.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      },

      {input: '#logFileLocation', message: 'Log file location is required!', action: 'keyup, blur', rule: 'required'},
      {
        input: '#logRotateFileSize', message: 'Log rotate file size must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          const val = this.logRotateFileSize.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      },
      {
        input: '#logRotateFilesCount',
        message: 'Log rotate files count must be a positive integer',
        action: 'keyup, blur',
        rule: (): any => {
          const val = this.logRotateFilesCount.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      }
    ];

  constructor(private http: HttpRequestService, private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.AUTH_CHANGED: {
            this.isAdmin = message.data.isAdmin;
            return;
          }

          case MESSAGE_TYPE.OPEN_SETTINGS_WINDOW: {
            this.open();
            return;
          }
        }
      });
  }

  open() {
    if (!this.isAdmin) {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    this.jsFilesRootDirBefore = undefined;

    // loading data
    this.http.post({}, REST_URLS.SETTINGS.URLS.LOAD_SETTINGS, 'json').subscribe(
      (data: any) => {
        this.settings = data.body;
        this.globalComponentsService.loader.close();
        this.logLevel.val(this.settings[this.SETTINGS.LOG_LEVEL]);
        this.jsFilesEncoding.val(this.settings[this.SETTINGS.JS_FILES_ENCODING]);
        this.jsFilesRootDirBefore = this.settings[this.SETTINGS.JS_FILES_ROOT_DIR];
        this.settingsWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple('Error', `Failed to load settings. Reason : [${err.statusText}]`);
        console.log(err);
      });
  }

  initContent = () => {
    this.ribbon.createComponent();
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  };

  validate() {
    this.validator.validate(document.getElementById('validationForm'));
  }

  save() {
    this.isSaving = true;
    this.validate();
  }

  onValidationSuccess() {
    if (!this.isSaving) {
      return;
    }

    this.globalComponentsService.loader.open();

    this.http.post(this.settings, REST_URLS.SETTINGS.URLS.SAVE_SETTINGS, 'json').subscribe(
      () => {
        this.globalComponentsService.loader.close();
        this.settingsWindow.close();
        if (this.jsFilesRootDirBefore !== this.settings[this.SETTINGS.JS_FILES_ROOT_DIR]) {
          this.messageService.sendMessage(MESSAGE_TYPE.RELOAD_JS_FILES);
        }
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.open({
          title: 'Error',
          label: `Failed to save settings. Reason : ${err.statusText}`,
        });
        console.log(err);
      });
  }

  onValidationError() {
    this.isSaving = false;
  }

  onOpen() {
    this.isSaving = false;
  }
}
