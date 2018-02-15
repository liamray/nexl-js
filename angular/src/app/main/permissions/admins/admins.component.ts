import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {ACTIONS, PermissionsService} from "../../../services/permissions.service";
import jqxGrid = jqwidgets.jqxGrid;


@Component({
  selector: 'app-security-admins',
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
      height: 260,
      filterable: false,
      sortable: true,
      editable: true
    });

    (<any>this.adminsGrid).addEventHandler('cellvaluechanged', () => {
      console.log('changed !');
    });
  }

  ngAfterViewInit(): void {
    this.permissionsService.service({}, ACTIONS.GET_ADMINS).subscribe(response => {
      this.initGrid(response);
    });
  }

  addNewItem() {
    this.changed = false;
  }

  save() {
    if (!this.changed) {
      return;
    }

    this.permissionsService.service(this.adminsGrid.getrows(), ACTIONS.SET_ADMINS).subscribe(response => {
      console.log('updated admins');
    });
  }
}
