import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {ACTIONS, PermissionsService} from "../../../services/permissions.service";
import {Observable} from "rxjs/Observable";


@Component({
  selector: 'app-security-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.css']
})
export class PermissionsComponent implements AfterViewInit {
  assignPermissions: jqxGridComponent;
  changed = false;

  constructor(private permissionsService: PermissionsService) {
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
    this.changed = false;

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

    (<any>this.assignPermissions).addEventHandler('cellvaluechanged', () => {
      this.changed = true;
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
    if (!this.changed) {
      return Observable.create(function (obs) {
        obs.next();
        obs.complete();
      });
    }

    // converting rows to normal object
    const rows = this.assignPermissions.getrows();
    const data = {};
    for (let row in rows) {
      const item = rows[row];

      const obj = {};
      obj['read'] = item['read'];
      obj['write'] = item['write'];

      data[item['user']] = obj;
    }

    return this.permissionsService.service(data, ACTIONS.SET_PERMISSIONS);
  }
}
