import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';

@Component({
  selector: 'app-assign-permissions',
  templateUrl: './assignpermissions.component.html',
  styleUrls: ['./assignpermissions.component.css']
})
export class AssignPermissionsComponent implements AfterViewInit {
  assignPermissions: jqxGridComponent;

  tooltipText = `<p style='text-align: left;'>Here you can grant read/write permission(s) to specific user(s)<br/> There are 2 reserved users you can apply here : <u>${SECURITY_CONSTANTS.GUEST_USER}</u> and <u>${SECURITY_CONSTANTS.AUTHENTICATED}</u><br/> [${SECURITY_CONSTANTS.GUEST_USER}] users don't require authentication<br/> [${SECURITY_CONSTANTS.AUTHENTICATED}] users are users who are successfully logged in</p>`;

  constructor() {
  }

  source =
    {
      localdata: [],
      datafields: [

        {name: 'user', type: 'string', map: '0'},
        {name: 'read', type: 'boolean', map: '1'},
        {name: 'write', type: 'boolean', map: '2'}
      ],
      datatype: 'array'
    };

  dataAdapter = new jqx.dataAdapter(this.source);
  counter = 0;

  columns: any[] =
    [
      {
        text: 'User',
        datafield: 'user',
        align: 'center',
        width: 109
      },
      {
        text: 'Read files',
        datafield: 'read',
        columntype: 'checkbox',
        align: 'center',
        width: 125
      },
      {
        text: 'Write files',
        datafield: 'write',
        columntype: 'checkbox',
        align: 'center',
        width: 125
      },
      {
        text: 'Remove',
        align: 'center',
        width: 70,
        sortable: false,
        editable: false,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `assignPermissionsRemoveButton${this.counter}`;
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
            this.assignPermissions.deleterow(row.bounddata.uid);
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
        }
      }
    ];

  ngAfterViewInit(): void {
    this.assignPermissions = jqwidgets.createInstance('#assignPermissions', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: '100%',
      height: 210,
      filterable: false,
      sortable: true,
      editable: true,
      rowsheight: 28
    });
  }

  addNewItem() {
    this.assignPermissions.addrow(1, {});
  }

  set(data) {
    this.source.localdata = [];

    for (let key in data) {
      const value = data[key];
      this.source.localdata.push([key, value.read, value.write]);
    }

    this.assignPermissions.updatebounddata();
  }

  get() {
    // converting rows to normal object
    const rows = this.assignPermissions.getrows();
    const result = {};

    for (let row in rows) {
      const item = rows[row];

      const obj = {};
      obj['read'] = item['read'];
      obj['write'] = item['write'];

      result[item['user'] || ''] = obj;
    }

    return result;
  }
}
