import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";
import jqxValidator = jqwidgets.jqxValidator;
import {UtilsService} from "../../services/utils.service";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {LoaderService} from "../../services/loader.service";
import {HttpRequestService} from "../../services/http.requests.service";

export class SettingsService {
  path: any;

  getNexlSourcesPath() {
    return this.path || {};
  }

  setNexlSourcesPath(path) {
    this.path = path;
  }
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  providers: [SettingsService]
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
  @ViewChild('notificationsGrid') notificationsGrid: jqxGridComponent;
  @ViewChild('saveButton') saveButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  settings: any = {};
  isSaving: boolean;
  width = 190;
  encodings = [];
  themes = ['android', 'arctic', 'base', 'black', 'blackberry', 'bootstrap', 'classic', 'dark', 'darkblue', 'energyblue', 'flat', 'fresh', 'glacier', 'highcontrast', 'light', 'metro', 'metrodark', 'mobile', 'office', 'orange', 'shinyblack', 'summer', 'ui-darkness', 'ui-le-frog', 'ui-lightness', 'ui-overcast', 'ui-redmond', 'ui-smoothness', 'ui-start', 'ui-sunny', 'web', 'windowsphone'];
  logLevels = [];
  notificationsSource =
    {
      localdata: [],
      datafields: [
        {name: 'notifications', type: 'string', map: '0'}
      ],
      datatype: 'array'
    };
  notificationsDataAdapter = new jqx.dataAdapter(this.notificationsSource);
  notificationsColumns: any[] =
    [
      {
        text: 'Notifications',
        datafield: 'notifications',
        align: 'center',
        width: '360px'
      },
      {
        text: ' ',
        align: 'center',
        sortable: false,
        editable: false,
        showeverpresentrow: false,
        columntype: 'button',
        cellsrenderer: (): string => {
          return 'Delete';
        },
        buttonclick: (row: number): void => {
          const rowdata = this.notificationsGrid.getrowdata(row);
          this.notificationsGrid.deleterow(rowdata.uid);
        }
      }
    ];

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

  constructor(private http: HttpRequestService, private loaderService: LoaderService, private settingsService: SettingsService) {
  }

  openInner() {
    // loading data
    this.http.json({}, '/settings/load').subscribe(
      (data: any) => {
        this.settings = data.body;
        this.loaderService.loader.close();
        this.logLevel.val(this.settings['log-level']);
        this.nexlSourcesEncoding.val(this.settings['nexl-sources-encoding']);
        UtilsService.arr2DS(this.settings.notifications || [], this.notificationsSource);
        this.notificationsGrid.updatebounddata();
        this.settingsService.setNexlSourcesPath(this.settings['nexl-sources-path']);
        this.settingsWindow.open();
      },
      err => {
        this.loaderService.loader.close();
        alert('Something went wrong !');
        console.log(err);
      });

  }

  open() {
    // opening indicator
    this.loaderService.loader.open();

    if (this.encodings.length > 0 && this.logLevels.length > 0) {
      this.openInner();
      return;
    }

    // loading available values from server
    this.http.json({}, '/settings/avail-values').subscribe(
      (data: any) => {
        this.encodings = data.body.encodings;
        this.logLevels = data.body.logLevels;
        this.openInner();
      },
      err => {
        this.loaderService.loader.close();
        alert('Something went wrong !');
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
    this.validate();
  }

  onValidationSuccess(event) {
    if (!this.isSaving) {
      return;
    }

    this.settingsWindow.close();
    this.loaderService.loader.open();
    this.settings.notifications = UtilsService.arrFromDS(this.notificationsGrid.getrows(), 'notifications');
    this.settings['nexl-sources-path'] = this.settingsService.getNexlSourcesPath();

    this.http.json(this.settings, '/settings/save').subscribe(
      val => {
        this.loaderService.loader.close();
      },
      err => {
        this.loaderService.loader.close();
        alert('Something went wrong !');
        console.log(err);
      });
  }

  onValidationError(event) {
    this.isSaving = false;
  }

  addNewItem() {
    this.notificationsGrid.addrow(1, {});
  }
}
