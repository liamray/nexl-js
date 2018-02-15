import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {AdminsComponent} from "./admins/admins.component";
import {PermissionsComponent} from "./permissions/permissions.component";
import {Observable} from "rxjs/Observable";

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class SecurityComponent implements OnInit {
  @ViewChild('securityWindow')
  securityWindow: jqxWindowComponent;

  @ViewChild('admins')
  admins: AdminsComponent;

  @ViewChild('permissions')
  permissions: PermissionsComponent;

  constructor() {
  }

  ngOnInit() {
  }

  open() {
    this.securityWindow.open();
  }

  save() {
    Observable.forkJoin(this.admins.save(), this.permissions.save()).subscribe(
      (val) => {
        console.log('All OK');
      },
      (err) => {
        console.log('ERR :(');
      }
    );
  }
}
