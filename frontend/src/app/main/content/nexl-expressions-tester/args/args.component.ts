import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";

@Component({
  selector: 'app-args-window',
  templateUrl: './args.component.html',
  styleUrls: ['./args.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ArgsComponent implements OnInit {
  @ViewChild('argsGrid') argsGrid: jqxGridComponent;
  @ViewChild('argsWindow') argsWindow: jqxWindowComponent;

  counter = 0;

  argsSource =
    {
      localdata: [],
      datafields: [
        {name: 'key', type: 'string'},
        {name: 'value', type: 'string'},
        {name: 'disabled', type: 'boolean'}
      ],
      datatype: 'array'
    };
  argsDataAdapter = new jqx.dataAdapter(this.argsSource);
  argsColumns: any[] =
    [
      {
        text: 'Key',
        datafield: 'key',
        align: 'center',
        width: '150px',
        cellclassname: function (row, column, value, data) {
          return data.disabled ? 'disabledItem' : '';
        }
      },
      {
        text: 'Value',
        datafield: 'value',
        align: 'center',
        width: '150px',
        cellclassname: function (row, column, value, data) {
          return data.disabled ? 'disabledItem' : '';
        }
      },
      {
        text: '',
        width: 50,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `myButton${this.counter}`;
          container.id = id;
          container.style.border = 'none';
          htmlElement.appendChild(container);

          let options = {
            width: '100%',
            height: 16,
            template: 'default',
            imgSrc: './nexl/site/images/no.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let myButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);

          myButton.addEventHandler('click', (): void => {
            let clickedButton = value;
            row.bounddata.disabled = !row.bounddata.disabled;
            this.argsGrid.refresh();
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
        }
      }, {
      text: ' ',
      align: 'center',
      sortable: false,
      editable: false,
      showeverpresentrow: false,
      columntype: 'button',
      cellsrenderer: (): string => {
        return 'Disable';
      },
      buttonclick: (row: number): void => {
        const rowdata = this.argsGrid.getrowdata(row);
        rowdata.disabled = !rowdata.disabled;
        this.argsGrid.refresh();
      }
    }
    ];

  constructor() {
  }

  addNewItem() {
    this.argsGrid.addrow(1, {});
  }

  initContent = () => {
  };

  ngOnInit() {
  }

  toggleOpen() {
    if (this.argsWindow.isOpen()) {
      this.argsWindow.close();
    } else {
      this.argsWindow.open();
    }
  }
}
