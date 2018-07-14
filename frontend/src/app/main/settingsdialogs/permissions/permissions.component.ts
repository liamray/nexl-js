import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {AdminsComponent} from "./admins/admins.component";
import {AssignPermissionsComponent} from "./assignpermissions/assignpermissions.component";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";
import {HttpRequestService} from "../../services/http.requests.service";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";


@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements AfterViewInit {
  @ViewChild('ribbon') ribbon: jqxRibbonComponent;
  @ViewChild('permissionsWindow') permissionsWindow: jqxWindowComponent;
  @ViewChild('admins') admins: AdminsComponent;
  @ViewChild('assignpermissions') assignpermissions: AssignPermissionsComponent;
  @ViewChild('saveButton') saveButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  permissions: any;
  isAdmin = false;

  constructor(private globalComponentsService: GlobalComponentsService, private http: HttpRequestService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.AUTH_CHANGED: {
            this.isAdmin = message.data.isAdmin;
            return;
          }

          case MESSAGE_TYPE.OPEN_PERMISSIONS_WINDOW: {
            this.open();
            return;
          }
        }
      });
  }

  ngAfterViewInit() {
    this.permissionsWindow.close();
  }

  open() {
    if (!this.isAdmin) {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    // loading data
    this.http.post({}, REST_URLS.PERMISSIONS.URLS.LOAD_PERMISSIONS, 'json').subscribe(
      (data: any) => {
        this.permissions = data.body;
        this.globalComponentsService.loader.close();
        this.admins.set(this.permissions.admins);
        this.assignpermissions.set(this.permissions.assignPermissions);
        this.permissionsWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple('Error', `Failed to load permissions list. Reason : [${err.statusText}]`);
        console.log(err);
      });
  }

  save() {
    this.globalComponentsService.loader.open();

    this.permissions.admins = this.admins.get();
    this.permissions.assignPermissions = this.assignpermissions.get();

    this.http.post(this.permissions, REST_URLS.PERMISSIONS.URLS.SAVE_PERMISSIONS, 'json').subscribe(
      val => {
        this.globalComponentsService.loader.close();
        this.permissionsWindow.close();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.open({
          title: 'Error',
          label: `Failed to update permissions. Reason : ${err.statusText}`,
        });
        console.log(err);
      });
  }

  initContent = () => {
    this.ribbon.createComponent();
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  }
}
