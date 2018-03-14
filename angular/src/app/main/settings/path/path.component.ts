import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {UtilsService} from "../../../services/utils.service";
import {PathService} from "../settings.component";

@Component({
  selector: 'app-path',
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.css']
})
export class PathComponent {
  @ViewChild('pathWindow') pathWindow: jqxWindowComponent;
  @ViewChild('pathGrid') pathGrid: jqxGridComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  path: any;
  pathSource =
    {
      localdata: [],
      datafields: [
        {name: 'path', type: 'string', map: '0'}
      ],
      datatype: 'array'
    };
  pathDataAdapter = new jqx.dataAdapter(this.pathSource);
  pathColumns: any[] =
    [
      {
        text: 'Path',
        datafield: 'path',
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

  constructor(private settingsService: PathService) {
  }

  addNewItem() {
    this.pathGrid.addrow(1, {});
  }

  open() {
    UtilsService.arr2DS(this.settingsService.getNexlSourcesPath(), this.pathSource);
    this.pathGrid.updatebounddata();
    this.pathWindow.open();
  }

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  }

  save() {
    this.settingsService.setNexlSourcesPath(UtilsService.arrFromDS(this.pathGrid.getrows(), 'path'));
    this.pathWindow.close();
  }
}
