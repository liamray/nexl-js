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

  grid: jqxGridComponent;

  constructor(private permissionsService: PermissionsService) {
  }

  source =
    {
      localdata: [],
      datafields: [

        {name: 'admins', type: 'string', map: '0'}
      ],
      datatype: 'array'
    };

  dataAdapter = new jqx.dataAdapter(this.source);
  columns: any[] =
    [
      {text: 'Admins', datafield: 'admins'},
      {
        text: ' ',
        datafield: 'Delete',
        sortable: false,
        columntype: 'button',
        cellsrenderer: (): string => {
          return 'Delete';
        },
        buttonclick: (row: number): void => {
          const rowdata = this.grid.getrowdata(row);
          this.grid.deleterow(rowdata.uid);
        }
      }
    ];

  packItems(items) {
    if (!items) {
      return;
    }

    for (let index in items) {
      const item = items[index];
      this.source.localdata.push([item]);
    }
  }

  initGrid(items) {
    this.packItems(items);

    this.grid = jqwidgets.createInstance('#adminsGrid', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: 400,
      height: 200,
      filterable: false,
      // showeverpresentrow: true,
      // everpresentrowposition: 'top',
      sortable: true,
      // everpresentrowactionsmode: 'column',
      editable: true
    });
  }

  ngAfterViewInit(): void {
    this.permissionsService.getAdmins().subscribe(response => {
      this.initGrid(response.admins);
    });
  }
}
