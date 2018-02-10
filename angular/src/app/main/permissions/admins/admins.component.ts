import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {PermissionsService} from "../../../services/permissions.service";


@Component({
  selector: 'app-security-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent implements AfterViewInit {
  @ViewChild('myGrid') myGrid: jqxGridComponent;

  constructor(private permissionsService: PermissionsService) {
  }

  source =
    {
      localdata: [
        ['liamr'],
        ['xxx']
      ],
      datafields: [
        {name: 'admins', type: 'string', map: '0'}
      ],
      datatype: 'array'
    };

  dataAdapter = new jqx.dataAdapter(this.source);

  columns: any[] =
    [
      {text: 'Admins', datafield: 'admins'}
    ];

  ngAfterViewInit(): void {
    this.permissionsService.getAdmins().subscribe(response => {
      console.log(response);
    });

    jqwidgets.createInstance('#adminsGrid', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: 400,
      height: 200,
      filterable: false,
      showeverpresentrow: true,
      everpresentrowposition: 'top',
      everpresentrowactionsmode: 'column',
      editable: true,
    });
  }
}
