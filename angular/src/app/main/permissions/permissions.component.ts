import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {AdminsComponent} from "./admins/admins.component";
import {AssignPermissionsComponent} from "./assignpermissions/assignpermissions.component";
import {Observable} from "rxjs/Observable";
import {LoaderService} from "../../services/loader.service";
import {PermissionsService} from "../../services/permissions.service";
import {UtilsService} from "../../services/utils.service";


@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements AfterViewInit {
  @ViewChild('permissionsWindow')
  permissionsWindow: jqxWindowComponent;

  @ViewChild('admins')
  admins: AdminsComponent;

  @ViewChild('assignpermissions')
  assignpermissions: AssignPermissionsComponent;

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
}
