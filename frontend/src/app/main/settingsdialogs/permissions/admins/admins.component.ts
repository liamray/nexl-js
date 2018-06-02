import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import jqxGrid = jqwidgets.jqxGrid;
import {UtilsService} from "../../../services/utils.service";


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
    UtilsService.arr2DS(data, this.source);
    this.adminsGrid.updatebounddata();
  }

  get() {
    return UtilsService.arrFromDS(this.adminsGrid.getrows(), 'admins');
  }
}
