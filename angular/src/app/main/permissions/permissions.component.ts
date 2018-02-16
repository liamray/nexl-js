import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {AdminsComponent} from "./admins/admins.component";
import {PermissionsComponent} from "./permissions/permissions.component";
import {Observable} from "rxjs/Observable";
import {jqxLoaderComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxloader';
import {LoaderService} from "../../services/loader.service";


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

  constructor(private loaderService: LoaderService) {
  }

  ngOnInit() {
  }

  open() {
    this.securityWindow.open();
  }

  save() {
    this.securityWindow.close();
    this.loaderService.loader.open();

    Observable.forkJoin(this.admins.save(), this.permissions.save()).subscribe(
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
