import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {AdminsComponent} from "./admins/admins.component";
import {AssignPermissionsComponent} from "./assignpermissions/assignpermissions.component";
import {LoaderService} from "../../services/loader.service";
import {PermissionsService} from "../../services/permissions.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";


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

  constructor(private loaderService: LoaderService, private permissionsService: PermissionsService) {
  }

  ngAfterViewInit() {
    this.permissionsWindow.close();
  }

  open() {
    // opening indicator
    this.loaderService.loader.open();

    // loading data
    this.permissionsService.load().subscribe(
      (data: any) => {
        this.permissions = data.body;
        this.loaderService.loader.close();
        this.admins.set(this.permissions.admins);
        this.assignpermissions.set(this.permissions.assignPermissions);
        this.permissionsWindow.open();
      },
      err => {
        this.loaderService.loader.close();
        alert('Something went wrong !');
        console.log(err);
      });
  }

  save() {
    this.permissionsWindow.close();
    this.loaderService.loader.open();

    this.permissions.admins = this.admins.get();
    this.permissions.assignPermissions = this.assignpermissions.get();

    this.permissionsService.save(this.permissions).subscribe(
      val => {
        this.loaderService.loader.close();
      },
      err => {
        this.loaderService.loader.close();
        alert('Something went wrong !');
        console.log(err);
      });
  }

  initContent = () => {
    this.ribbon.createComponent();
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  }
}
