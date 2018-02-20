import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';

@Component({
  selector: 'app-assign-permissions',
  templateUrl: './assignpermissions.component.html',
  styleUrls: ['./assignpermissions.component.css']
})
export class AssignPermissionsComponent implements AfterViewInit {
  assignPermissions: jqxGridComponent;

  constructor() {
  }

  source =
    {
      localdata: [],
      datafields: [

        {name: 'user', type: 'string', map: '0'},
        {name: 'read', type: 'boolean', map: '1'},
        {name: 'write', type: 'boolean', map: '2'}
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

  ngAfterViewInit(): void {
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

  addNewItem() {
    this.assignPermissions.addrow(1, {});
  }

  set(data) {
    this.source.localdata = [];

    for (let key in data) {
      const value = data[key];
      this.source.localdata.push([key, value.read, value.write]);
    }

    this.assignPermissions.updatebounddata();
  }

  get() {
    // converting rows to normal object
    const rows = this.assignPermissions.getrows();
    const result = {};

    for (let row in rows) {
      const item = rows[row];

      const obj = {};
      obj['read'] = item['read'];
      obj['write'] = item['write'];

      result[item['user'] || ''] = obj;
    }

    return result;
  }
}
