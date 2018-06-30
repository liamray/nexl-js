import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxGridComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid";
import {UtilsService} from "../../services/utils.service";


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {
  @ViewChild('usersWindow') usersWindow: jqxWindowComponent;
  @ViewChild('closeButton') closeButton: jqxButtonComponent;
  @ViewChild('usersGrid') usersGrid: jqxGridComponent;

  isAdmin = false;
  counter = 0;

  usersSource =
    {
      localdata: [],
      datafields: [
        {name: 'user', type: 'string'},
        {name: 'disabled', type: 'boolean'}
      ],
      datatype: 'array'
    };
  usersDataAdapter = new jqx.dataAdapter(this.usersSource);
  usersColumns: any[] =
    [
      {
        text: 'Username',
        datafield: 'user',
        align: 'center',
        width: '180px',
        cellclassname: function (row, column, value, data) {
          return data.disabled ? 'disabledItem' : '';
        }
      },
      {
        text: 'Password',
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

          let options = {
            width: '100%',
            height: 27,
            template: 'default',
            imgSrc: './nexl/site/images/password.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let resetButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);

          resetButton.addEventHandler('click', (): void => {
            this.showToken(row.bounddata.uid);
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

          let options = {
            width: '100%',
            height: 27,
            template: 'default',
            imgSrc: './nexl/site/images/turn-off.png',
            imgWidth: 16,
            imgHeight: 16,
            imgPosition: 'center',
            textPosition: 'center'
          };

          let toggleButton = jqwidgets.createInstance(`#${id}`, 'jqxButton', options);

          toggleButton.addEventHandler('click', (): void => {
            let clickedButton = value;
            row.bounddata.disabled = !row.bounddata.disabled;
            this.usersGrid.refresh();
            this.enableDisableUser(row.bounddata.uid);
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

          deleteButton.addEventHandler('click', (): void => {
            this.removeUser(row.bounddata.uid);
            this.usersGrid.deleterow(row.bounddata.uid);
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

          case MESSAGE_TYPE.USERS_WINDOW: {
            this.open();
            return;
          }
        }
      });
  }

  open() {
    if (!this.isAdmin) {
      return;
    }

    // opening indicator
    this.globalComponentsService.loader.open();

    // loading available values from server
    this.http.post({}, '/auth/list-users', 'json').subscribe(
      (data: any) => {
        this.globalComponentsService.loader.close();
        this.usersWindow.open();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to load settings\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }

  initContent = () => {
    this.closeButton.createComponent();
  };

  onOpen() {
  }

  onChange(event: any) {
    const args = event.args;
    if (args.datafield !== 'user') {
      return;
    }

    if (!UtilsService.isValidUsername(args.newvalue)) {
      this.globalComponentsService.messageBox.open({
        title: 'Error',
        label: 'Invalid user name',
      });
      return;
    }

    if (args.oldvalue === undefined) {
      return;
    }

    // generating new token
    this.globalComponentsService.loader.open();

    // generating token
    this.http.post({username: args.newvalue}, '/auth/generate-token', 'json').subscribe(
      (data: any) => {
        this.globalComponentsService.loader.close();
        this.usersGrid.setcellvalue(args.rowindex, 'token', data.body.token);
        this.usersGrid.refresh();
      },
      err => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.open({
          title: 'Error',
          label: `Failed to generate new token. Reason : ${err.statusText}`,
        });

        console.log(err);
      });

  }

  addNewItem() {
    this.usersGrid.addrow(1, {});
  }


  removeUser(row: any) {

  }

  showToken(row: any) {

  }

  enableDisableUser(row: any) {

  }
}
