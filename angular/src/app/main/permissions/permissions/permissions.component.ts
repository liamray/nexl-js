import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {ACTIONS, PermissionsService} from "../../../services/permissions.service";


@Component({
  selector: 'app-security-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements AfterViewInit {
  assignPermissions: jqxGridComponent;

  constructor(private permissionsService: PermissionsService) {
  }

  source =
    {
      localdata: [],
      datafields: [

        {name: 'user', type: 'string', map: '0'},
        {name: 'read', type: 'string', map: '1'},
        {name: 'write', type: 'string', map: '2'}
      ],
      datatype: 'array'
    };

  dataAdapter = new jqx.dataAdapter(this.source);
  columns: any[] =
    [
      {
        text: 'User',
        datafield: 'user',
        align: 'center',
        width: 100
      },
      {
        text: 'Read sources',
        datafield: 'read',
        columntype: 'checkbox',
        align: 'center',
        width: 100
      },
      {
        text: 'Write sources',
        datafield: 'write',
        columntype: 'checkbox',
        align: 'center',
        width: 100
      },
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
          const rowdata = this.assignPermissions.getrowdata(row);
          this.assignPermissions.deleterow(rowdata.uid);
        }
      }
    ];

  packItems(items) {
    if (!items) {
      return;
    }

    for (let key in items) {
      const value = items[key];
      this.source.localdata.push([key, value.read, value.write]);
    }
  }

  initGrid(items) {
    this.packItems(items);

    this.assignPermissions = jqwidgets.createInstance('#assignPermissions', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: '100%',
      height: 210,
      filterable: false,
      sortable: true,
      editable: true
    });
  }

  ngAfterViewInit(): void {
    this.permissionsService.service({}, ACTIONS.GET_PERMISSIONS).subscribe(response => {
      this.initGrid(response);
    });
  }

  addNewItem() {
    this.assignPermissions.addrow(1, {});
  }

  save() {
    this.permissionsService.service(this.assignPermissions.getrows(), ACTIONS.SET_PERMISSIONS).subscribe(response => {
      console.log('updated permissions');
    });
  }
}
