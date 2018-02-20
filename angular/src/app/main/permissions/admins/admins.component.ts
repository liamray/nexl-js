import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import jqxGrid = jqwidgets.jqxGrid;


@Component({
  selector: 'app-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent implements AfterViewInit {
  adminsGrid: jqxGridComponent;

  constructor() {
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

  addNewItem() {
    this.adminsGrid.addrow(1, {});
  }

  ngAfterViewInit() {
    this.adminsGrid = jqwidgets.createInstance('#adminsGrid', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: '100%',
      height: 210,
      filterable: false,
      sortable: true,
      editable: true
    });
  }

  set(data) {
    this.source.localdata = [];

    for (let index in data) {
      const item = data[index];
      this.source.localdata.push([item]);
    }

    this.adminsGrid.updatebounddata();
  }

  get() {
    // converting rows to normal object
    const rows = this.adminsGrid.getrows();
    const result = [];
    for (let row in rows) {
      result.push(rows[row]['admins']);
    }

    return result;
  }
}
