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

  tooltipText = `<p style='text-align: left;'>Users with administrative permissions have full access to nexl server<br/>It's not recommended but you can add a [${SECURITY_CONSTANTS.GUEST_USER}] reserved user name here to be an admin.<br/>guest users don't require authentication<br/>If you need to assign a specific permission to a user use [Assign permissions] tab</p>`;

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
  counter = 0;
  columns: any[] =
    [
      {
        text: 'Admins',
        datafield: 'admins',
        align: 'center'
      },
      {
        text: 'Remove',
        align: 'center',
        width: 70,
        sortable: false,
        editable: false,
        createwidget: (row: any, column: any, value: string, htmlElement: HTMLElement): void => {
          let container = document.createElement('div');
          let id = `adminsButton${this.counter}`;
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
            this.adminsGrid.deleterow(row.bounddata.uid);
          });

          this.counter++;
        },
        initwidget: (row: number, column: any, value: any, htmlElement: HTMLElement): void => {
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
      editable: true,
      rowsheight: 28
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
