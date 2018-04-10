import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {AdminsComponent} from "./admins/admins.component";
import {AssignPermissionsComponent} from "./assignpermissions/assignpermissions.component";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";
import {HttpRequestService} from "../../services/http.requests.service";


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

  constructor(private globalComponentsService: GlobalComponentsService, private http: HttpRequestService) {
  }

  ngAfterViewInit() {
    this.permissionsWindow.close();
  }

  open() {
    // opening indicator
    this.globalComponentsService.loader.open();

    // loading data
    this.http.post({}, '/permissions/load', 'json').subscribe(
      (data: any) => {
        this.permissions = data.body;
        this.globalComponentsService.loader.close();
        this.admins.set(this.permissions.admins);
        this.assignpermissions.set(this.permissions.assignPermissions);
        this.permissionsWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to load permissions list\nReason : ' + err.statusText);
        console.log(err);
      });
  }

  save() {
    this.permissionsWindow.close();
    this.globalComponentsService.loader.open();

    this.permissions.admins = this.admins.get();
    this.permissions.assignPermissions = this.assignpermissions.get();

    this.http.post(this.permissions, '/permissions/save', 'json').subscribe(
      val => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openInfo('Updated permissions');
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to save permissions list. Reason\n' + err.statusText);
        console.log(err);
      });
  }

  initContent = () => {
    this.ribbon.createComponent();
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  }
}
