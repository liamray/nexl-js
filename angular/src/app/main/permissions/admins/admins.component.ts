import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {ACTIONS, PermissionsService} from "../../../services/permissions.service";
import jqxGrid = jqwidgets.jqxGrid;
import {Observable} from "rxjs/Observable";


@Component({
  selector: 'app-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent implements AfterViewInit {
  adminsGrid: jqxGridComponent;
  changed = false;

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
      {
        text: 'Admins',
        datafield: 'admins',
        align: 'center'
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
    this.changed = false;

    this.packItems(items);

    this.adminsGrid = jqwidgets.createInstance('#adminsGrid', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: '100%',
      height: 210,
      filterable: false,
      sortable: true,
      editable: true
    });

    (<any>this.adminsGrid).addEventHandler('cellvaluechanged', () => {
      this.changed = true;
    });
  }

  ngAfterViewInit(): void {
    this.permissionsService.service({}, ACTIONS.GET_ADMINS).subscribe(response => {
      this.initGrid(response);
    });
  }

  addNewItem() {
    this.adminsGrid.addrow(1, {});
  }

  save() {
    if (!this.changed) {
      return Observable.create(function (obs) {
        obs.next();
        obs.complete();
      });
    }

    // converting rows to normal object
    const rows = this.adminsGrid.getrows();
    const data = [];
    for (let row in rows) {
      data.push(rows[row]['admins']);
    }

    return this.permissionsService.service(data, ACTIONS.SET_ADMINS);
  }
}
