import {Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {UtilsService} from "../../../../services/utils.service";

@Component({
  selector: 'app-args-window',
  templateUrl: './args.component.html',
  styleUrls: ['./args.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ArgsComponent implements OnInit {
  @ViewChild('argsGrid') argsGrid: jqxGridComponent;
  @ViewChild('argsWindow') argsWindow: jqxWindowComponent;

  @Output('onArgs') argsEE: EventEmitter<any> = new EventEmitter();

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
            height: 27,
            template: 'default',
            imgSrc: './nexl/site/images/toggle.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let toggleButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);
          jqwidgets.createInstance(`#${id}`, 'jqxTooltip', {
            content: 'Toggle disable/enable this arg',
            position: 'mouse'
          });

          toggleButton.addEventHandler('click', (): void => {
            let clickedButton = value;
            row.bounddata.disabled = !row.bounddata.disabled;
            this.argsGrid.refresh();
            this.onChange();
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
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
            height: 27,
            template: 'default',
            imgSrc: './nexl/site/images/delete.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let deleteButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);
          jqwidgets.createInstance(`#${id}`, 'jqxTooltip', {
            content: 'Delete arg',
            position: 'mouse'
          });

          deleteButton.addEventHandler('click', (): void => {
            this.argsGrid.deleterow(row.bounddata.uid);
            this.onChange();
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
        }
      }

    ];

  constructor() {
  }

  addNewItem() {
    this.argsGrid.addrow(1, {});
    this.onChange();
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

  onChange() {
    const data = this.argsGrid.getrows();
    const result = {};
    data.forEach((item) => {
      if (item.disabled || item.key === '') {
        return;
      }

      result[item.key] = item.value;
    });
    this.argsEE.emit(result);
  }
}
