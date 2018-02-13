import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {PermissionsService} from "../../../services/permissions.service";


@Component({
  selector: 'app-security-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent implements AfterViewInit {
  adminsGrid: jqxGridComponent;

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
        sortable: false,
        editable: false,
        showeverpresentrow: false,
        columntype: 'button',
        cellsrenderer: (): string => {
          return 'Delete';
        },
        buttonclick: (row: number): void => {
          const rowdata = this.adminsGrid.getrowdata(row);
          this.adminsGrid.deleterow(rowdata.uid);
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

    this.adminsGrid = jqwidgets.createInstance('#adminsGrid', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: '100%',
      height: 230,
      filterable: false,
      sortable: true,
      editable: true
    });
  }

  ngAfterViewInit(): void {
    this.permissionsService.getAdmins().subscribe(response => {
      this.initGrid(response.admins);
    });
  }

  addNewItem() {
    this.adminsGrid.addrow(1, {});
  }
}
