import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {ICONS} from "../../misc/messagebox/messagebox.component";
import {UtilsService} from "../../services/utils.service";


@Component({
  selector: 'app-webhooks',
  templateUrl: './webhooks.component.html',
  styleUrls: ['./webhooks.component.css']
})
export class WebhooksComponent {
  @ViewChild('webhooksWindow') webhooksWindow: jqxWindowComponent;
  @ViewChild('closeButton') closeButton: jqxButtonComponent;
  @ViewChild('webhooksGrid') webhooksGrid: jqxGridComponent;

  isAdmin = false;
  counter = 0;

  webhooksSource =
    {
      localdata: [],
      datafields: [
        {name: 'id', type: 'number'},
        {name: 'relativePath', type: 'string'},
        {name: 'url', type: 'string'},
        {name: 'isDisabled', type: 'boolean'}
      ],
      datatype: 'array'
    };
  webhooksDataAdapter = new jqx.dataAdapter(this.webhooksSource);
  webhooksColumns: any[] =
    [
      {
        text: 'File|Dir path',
        datafield: 'relativePath',
        align: 'center',
        width: '330px',
        editable: false,
        cellclassname: function (row, column, value, data) {
          return data.isDisabled ? 'disabledItem' : '';
        }
      },
      {
        text: 'Edit',
        align: 'center',
        sortable: false,
        editable: false,
        width: 80,
        height: 50,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `argsEditButton${this.counter}`;
          container.id = id;
          container.style.border = 'none';
          htmlElement.appendChild(container);

          const options = {
            width: '100%',
            height: 27,
            template: 'default',
            imgSrc: './nexl/site/icons/edit.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let toggleButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);

          toggleButton.addEventHandler('click', (): void => {
            this.messageService.sendMessage(MESSAGE_TYPE.EDIT_WEBHOOK, row.bounddata);
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
        }
      },
      {
        text: 'Enable/<br/>Disable',
        align: 'center',
        sortable: false,
        editable: false,
        width: 80,
        height: 50,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `argsEnableDisableButton${this.counter}`;
          container.id = id;
          container.style.border = 'none';
          htmlElement.appendChild(container);

          const options = {
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
            this.enableDisableItem(row);
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
        }
      },
      {
        text: 'Remove',
        align: 'center',
        width: 80,
        sortable: false,
        editable: false,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `argsRemoveButton${this.counter}`;
          container.id = id;
          container.style.border = 'none';
          htmlElement.appendChild(container);

          const options = {
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
            this.deleteWebhook(row.bounddata);
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
        }
      }


    ];

  constructor(private http: HttpRequestService, private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.AUTH_CHANGED: {
            this.isAdmin = message.data.isAdmin;
            return;
          }

          case MESSAGE_TYPE.OPEN_WEBHOOKS_DIALOG: {
            this.open();
            return;
          }
        }
      });
  }

  setGridData(data: any) {
    this.webhooksSource.localdata = [];

    for (let key in data) {
      this.webhooksSource.localdata.push({
        id: data[key].id,
        relativePath: data[key].relativePath,
        url: data[key].url,
        isDisabled: data[key].isDisabled
      });
    }

    this.webhooksGrid.updatebounddata();

  }

  open() {
    if (!this.isAdmin) {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    // loading available values from server
    this.http.post({}, REST_URLS.WEBHOOKS.URLS.LOAD_WEBHOOKS, 'json').subscribe(
      (data: any) => {
        this.globalComponentsService.loader.close();
        this.setGridData(data.body);
        this.webhooksWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to load webhooks list. Reason : [${err.statusText}]`);
        console.log(err);
      }
    );
  }

  initContent = () => {
    this.closeButton.createComponent();
  };

  onOpen() {
  }

  setCellValueDelayed(rowNr: number, cellName: string, cellValue: string) {
    setTimeout(() => {
      this.webhooksGrid.setcellvalue(rowNr, cellName, cellValue);
      this.webhooksGrid.refresh();
    }, 10);
  }

  onChange(rowNr: number, oldValue: string, newValue: string) {
    if (!COMMON_UTILS.validateUsernameStrength(newValue)) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, UI_CONSTANTS.BAD_USERNAME_MSG);
      this.setCellValueDelayed(rowNr, 'username', oldValue);
      return;
    }

    const userData = {
      newUsername: newValue,
      oldUsername: oldValue
    };

    // generating new token
    this.globalComponentsService.loader.open();

    // renaming user
    this.http.post(userData, REST_URLS.USERS.URLS.RENAME_USER, 'json').subscribe(
      (data: any) => {
        this.globalComponentsService.loader.close();
        return true;
      },
      err => {
        this.setCellValueDelayed(rowNr, 'username', oldValue);
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to create a [${newValue}] user. Reason : ${err.statusText}`);
        console.log(err);
      });
  }

  addNewItem() {
    this.messageService.sendMessage(MESSAGE_TYPE.EDIT_WEBHOOK, {
      relativePath: UtilsService.SERVER_INFO.SLASH,
      url: '',
      secret: '',
      isDisabled: false
    });
  }

  enableDisableItem(row: any) {
    const item = row.bounddata;
    const data = {
      id: item.id,
      relativePath: item.relativePath,
      url: item.url,
      isDisabled: !item.isDisabled
    };

    // activating loading indicator
    this.globalComponentsService.loader.open();

    // removing user
    this.http.post(data, REST_URLS.WEBHOOKS.URLS.EDIT_WEBHOOK, 'json').subscribe(
      (data: any) => {
        row.bounddata.isDisabled = !row.bounddata.isDisabled;
        this.webhooksGrid.refresh();
        this.globalComponentsService.loader.close();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to disable a [${item.relativePath}] webhook. Reason : ${err.statusText}`);
        console.log(err);
      });
  }

  removeWebhookInner(item) {
    this.globalComponentsService.loader.open();

    // removing user
    this.http.post({id: item.id}, REST_URLS.WEBHOOKS.URLS.DELETE_WEBHOOK, 'json').subscribe(
      (data: any) => {
        this.webhooksGrid.deleterow(item.uid);
        this.globalComponentsService.loader.close();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to remove a [${item.relativePath}] webhook. Reason : ${err.statusText}`);
        console.log(err);
      });
  }

  deleteWebhook(item: any) {
    // confirmation about unsaved data
    const opts = {
      title: `Confirm webhook removal`,
      label: `Are you sure you want to remove a [${item.relativePath}] webhook ?`,
      callback: (callbackData: any) => {
        if (callbackData.isConfirmed !== true) {
          return;
        }

        this.removeWebhookInner(item);
      },
    };

    this.globalComponentsService.confirmBox.open(opts);
  }

  showToken(rowNr: number) {
    const username = this.webhooksGrid.getcellvalue(rowNr, 'username');

    if (username === undefined || username === null || username.length < 1) {
      return;
    }

    this.globalComponentsService.loader.open();

    // generating token
    this.http.post({username: username}, REST_URLS.USERS.URLS.GENERATE_REGISTRATION_TOKEN, 'json').subscribe(
      (data: any) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.INFO, `The [${username}] user can register or reset his password. Send him the following token to proceed : ${data.body.token} This token expires in [${data.body.tokenValidHours}] hour(s)`);
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Operation failed. Reason : ${err.statusText}`);
        console.log(err);
      });
  }
}
