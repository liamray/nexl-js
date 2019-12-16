import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import * as LOG_LEVELS from '../../common/winston-log-levels.json';
import {ICONS} from "../../misc/messagebox/messagebox.component";
import jqxValidator = jqwidgets.jqxValidator;

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @ViewChild('settingsWindow') settingsWindow: jqxWindowComponent;
  @ViewChild('ribbon') ribbon: jqxRibbonComponent;
  @ViewChild('validator') validator: jqxValidator;
  @ViewChild('storageFilesEncoding') storageFilesEncoding: any;
  @ViewChild('rawOutput') rawOutput: any;

  @ViewChild('httpBinding') httpBiding: any;
  @ViewChild('httpPort') httpPort: any;
  @ViewChild('httpsBinding') httpsBiding: any;
  @ViewChild('httpsPort') httpsPort: any;

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
  @ViewChild('reindexFiles') reindexFiles: jqxButtonComponent;
  @ViewChild('backupNow') backupNow: jqxButtonComponent;

  nexlHomeDirToolTip = `<p style=\'text-align: left;\'>nexl home dir contains nexl server configuration, logs and storage files<br/> By default nexl home dir located in your OS home dir ( $HOME or %userprofile% )<br/> Use [--nexl-home] command line argument to specify different nexl home :<br/><span style='margin-left:30px; font-style: italic'>nexl --${CONF_CONSTANTS.NEXL_HOME_DEF}=/path/to/nexl/home/dir</span><br/> This might be useful if you need to run multiple nexl server instances</p>`;

  settings: any = {};
  isAdmin = false;
  storageFilesRootDirBefore: string;
  isSaving = false;
  width = 190;
  encodings = CONF_CONSTANTS.AVAILABLE_ENCODINGS;
  logLevels = Object.keys(LOG_LEVELS);

  SETTINGS = CONF_CONSTANTS.SETTINGS;
  NEXL_HOME_DEF = CONF_CONSTANTS.NEXL_HOME_DEF;

  validationRules =
    [
      {input: '#nexlStorageDir', message: 'nexl storage dir is required!', action: 'keyup, blur', rule: 'required'},
      {input: '#httpTimeout', message: 'HTTP timeout is required !', action: 'keyup, blur', rule: 'required'},
      {
        input: '#httpTimeout', message: 'HTTP timeout must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          return this.validateMandatoryInt(CONF_CONSTANTS.SETTINGS.HTTP_TIMEOUT, 1);
        }
      },
      {input: '#sessionTimeout', message: 'Session timeout is required !', action: 'keyup, blur', rule: 'required'},
      {
        input: '#sessionTimeout', message: 'Session timeout must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          return this.validateMandatoryInt(CONF_CONSTANTS.SETTINGS.SESSION_TIMEOUT, 1);
        }
      },
      {
        input: '#httpPort', message: 'HTTP port must be a positive integer between 1 and 65535', action: 'keyup, blur',
        rule: (): any => {
          return this.validateNotMandatoryInt(CONF_CONSTANTS.SETTINGS.HTTP_PORT, 1, 65535);
        }
      },
      {
        input: '#httpsPort',
        message: 'HTTPS port must be a positive integer between 1 and 65535',
        action: 'keyup, blur',
        rule: (): any => {
          return this.validateNotMandatoryInt(CONF_CONSTANTS.SETTINGS.HTTPS_PORT, 1, 65535);
        }
      },
      {
        input: '#ldapUrl',
        message: 'LDAP URL must be started with [ldap://] and ended with port number',
        action: 'keyup, blur',
        rule: (): any => {
          const val = this.settings[CONF_CONSTANTS.SETTINGS.LDAP_URL];
          if (val === '' || val === undefined || val === null) {
            return true;
          }

          return val.indexOf('ldap://') === 0 && val.match(/[0-9]$/) !== null;
        }
      },
      {
        input: '#logRotateFileSize', message: 'Log rotate file size must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          return this.validateMandatoryInt(CONF_CONSTANTS.SETTINGS.LOG_ROTATE_FILE_SIZE, 0);
        }
      },
      {
        input: '#logRotateFilesCount',
        message: 'Log rotate files count must be a positive integer',
        action: 'keyup, blur',
        rule: (): any => {
          return this.validateMandatoryInt(CONF_CONSTANTS.SETTINGS.LOG_ROTATE_FILES_COUNT, 0);
        }

      },
      {
        input: '#backupStorageMaxBackups',
        message: 'The max storage backups must be a valid positive integer',
        action: 'keyup, blur',
        rule: (): any => {
          return this.validateNotMandatoryInt(CONF_CONSTANTS.SETTINGS.BACKUP_STORAGE_MAX_BACKUPS, 0);
        }
      },

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

  validateMandatoryInt(field: string, min?: number, max?: number) {
    const val = parseInt(this.settings[field]);

    // is NaN ?
    if (val !== val) {
      return false;
    }

    if (min !== undefined && val < min) {
      return false;
    }

    if (max !== undefined && val > max) {
      return false;
    }

    this.settings[field] = val;

    return true;
  }

  validateNotMandatoryInt(field: string, min?: number, max?: number) {
    const val = this.settings[field];
    if (val === undefined || val === null || val === '') {
      return true;
    }

    return this.validateMandatoryInt(field, min, max);
  }


  open() {
    if (!this.isAdmin) {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    this.storageFilesRootDirBefore = undefined;

    // loading data
    this.http.post({}, REST_URLS.SETTINGS.URLS.LOAD_SETTINGS, 'json').subscribe(
      (data: any) => {
        this.settings = data.body;
        this.globalComponentsService.loader.close();
        this.logLevel.val(this.settings[this.SETTINGS.LOG_LEVEL]);
        this.storageFilesEncoding.val(this.settings[this.SETTINGS.STORAGE_FILES_ENCODING]);
        this.rawOutput.val(this.settings[this.SETTINGS.RAW_OUTPUT]);
        this.storageFilesRootDirBefore = this.settings[this.SETTINGS.STORAGE_DIR];
        this.settingsWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, err.statusText);
        console.log(err);
      });
  }

  initContent = () => {
    this.ribbon.createComponent();
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
    this.reindexFiles.createComponent();
    this.backupNow.createComponent();
  };

  onRibbonSelect() {
    this.validator.validate(document.getElementById('validationForm'));

    // todo: hack ! jqx framework doesn't positioning text in the center in the hidden tab, so doing it manually
    this.backupNow.textPosition('center');
  }

  save() {
    this.isSaving = true;
    this.onRibbonSelect();
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
        if (this.storageFilesRootDirBefore !== this.settings[this.SETTINGS.STORAGE_DIR]) {
          this.messageService.sendMessage(MESSAGE_TYPE.RELOAD_FILES);
        }
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, err.statusText);
        console.log(err);
      });
  }

  onValidationError() {
    this.isSaving = false;
  }

  onOpen() {
    this.isSaving = false;
  }

  doReIndexFiles() {
    this.globalComponentsService.loader.open();

    this.http.post(this.settings, REST_URLS.STORAGE.URLS.REINDEX_FILES, 'json').subscribe(
      () => {
        this.globalComponentsService.loader.close();
        this.messageService.sendMessage(MESSAGE_TYPE.RELOAD_FILES);
        this.globalComponentsService.messageBox.openSimple(ICONS.INFO, 'Successfully reindexed !');
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, err.statusText);
        console.log(err);
      });
  }

  doBackupNow() {
    this.http.post(this.settings, REST_URLS.STORAGE.URLS.BACKUP_STORAGE, 'json').subscribe(
      () => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.INFO, 'Successfully performed a backup !');
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, err.statusText);
        console.log(err);
      });
  }
}
