import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {AdminsComponent} from "./admins/admins.component";
import {AssignPermissionsComponent} from "./assignpermissions/assignpermissions.component";
import {Observable} from "rxjs/Observable";
import {LoaderService} from "../../services/loader.service";


@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements OnInit {
  @ViewChild('permissionsWindow')
  permissionsWindow: jqxWindowComponent;

  @ViewChild('admins')
  admins: AdminsComponent;

  @ViewChild('assignpermissions')
  assignpermissions: AssignPermissionsComponent;

  constructor(private loaderService: LoaderService) {
  }

  ngOnInit() {
  }

  open() {
    this.permissionsWindow.open();
  }

  save() {
    this.permissionsWindow.close();
    this.loaderService.loader.open();

    Observable.forkJoin(this.admins.save(), this.assignpermissions.save()).subscribe(
      () => {
        this.loaderService.loader.close();
      },
      (err) => {
        this.loaderService.loader.close();
        console.log(err);
        alert('Error occurred !');
      }
    );
  }
}
