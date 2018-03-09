import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";

@Component({
  selector: 'app-path',
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.css']
})
export class PathComponent {
  @ViewChild('pathWindow')
  pathWindow: jqxWindowComponent;

  @ViewChild('pathGrid')
  pathGrid: jqxGridComponent;

  @ViewChild('okButton')
  okButton: jqxButtonComponent;

  @ViewChild('cancelButton')
  cancelButton: jqxButtonComponent;

  pathSource =
    {
      localdata: [],
      datafields: [
        {name: 'admins', type: 'string', map: '0'}
      ],
      datatype: 'array'
    };
  pathDataAdapter = new jqx.dataAdapter(this.pathSource);
  pathColumns: any[] =
    [
      {
        text: 'Path',
        datafield: 'Path',
        align: 'center',
        width: '290px'
      },
      {
        text: ' ',
        align: 'center',
        sortable: false,
        editable: false,
        showeverpresentrow: false,
        columntype: 'button',
        cellsrenderer: (): string => {
          return 'Delete';
        },
        buttonclick: (row: number): void => {
          const rowdata = this.pathGrid.getrowdata(row);
          this.pathGrid.deleterow(rowdata.uid);
        }
      }
    ];

  addNewItem() {
    this.pathGrid.addrow(1, {});
  }

  open() {
    this.pathWindow.open();
  }

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  }

}
