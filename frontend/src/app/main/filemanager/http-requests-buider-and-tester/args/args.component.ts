import {AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {ARGS_WINDOW, LocalStorageService} from "../../../services/localstorage.service";
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";

@Component({
  selector: 'app-args-window',
  templateUrl: './args.component.html',
  styleUrls: ['./args.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ArgsComponent implements OnInit, AfterViewInit {

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
        text: 'Enable/<br/>Disable',
        align: 'center',
        sortable: false,
        editable: false,
        width: 70,
        height: 50,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `argsEnableDisableButton${this.counter}`;
          container.id = id;
          container.style.border = 'none';
          htmlElement.appendChild(container);

          let options = {
            width: '100%',
            height: 27,
            template: 'default',
            imgSrc: './nexl/site/icons/mute.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let toggleButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);

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
        text: 'Remove',
        align: 'center',
        width: 70,
        sortable: false,
        editable: false,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `argsRemoveButton${this.counter}`;
          container.id = id;
          container.style.border = 'none';
          htmlElement.appendChild(container);

          let options = {
            width: '100%',
            height: 27,
            template: 'default',
            imgSrc: './nexl/site/icons/remove.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let deleteButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);

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

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(msg => {
      switch (msg.type) {
        case MESSAGE_TYPE.SET_ARGS: {
          this.argsSource.localdata = msg.data;
          this.argsGrid.updatebounddata();
          return;
        }
      }
    });
  }

  addNewItem() {
    this.argsGrid.addrow(1, {});
    this.onChange();
  }

  initContent = () => {
  };

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this.loadArgsWindow();
  }

  loadArgsWindow() {
    const args = LocalStorageService.loadObj(ARGS_WINDOW, {});
    if (Object.keys(args).length < 1) {
      return;
    }

    this.argsWindow.move(args.pos.left, args.pos.top);
    if (args.isOpened) {
      this.argsWindow.open();
    }
  }

  toggleOpen() {
    if (this.argsWindow.isOpen()) {
      this.argsWindow.close();
    } else {
      this.argsWindow.open();
    }
  }


  onChange() {
    const filteredData = [];
    this.argsGrid.getrows().forEach(item => {
      const filteredItem = {
        disabled: item.disabled,
        key: item.key,
        value: item.value
      };
      filteredData.push(filteredItem);
    });
    this.messageService.sendMessage(MESSAGE_TYPE.ARGS_CHANGED, filteredData);
    this.storeArgsWindow();
  }

  onMoved() {
    this.storeArgsWindow();
  }

  storeArgsWindow() {
    const data = {
      pos: $('#argsWindow').parent().offset(),
      isOpened: this.argsWindow.isOpen()
    };
    LocalStorageService.storeObj(ARGS_WINDOW, data);
  }

  getAllArgs() {
    const data = this.argsGrid.getrows();

    const result = [];
    data.forEach((item) => {
      result.push(
        {
          key: item.key,
          value: item.value,
          disabled: item.disabled
        }
      );
    });

    return result;
  }
}
