import {AfterViewInit, Component} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';
import {GROUPS, PermissionsService} from "../../../services/permissions.service";



@Component({
  selector: 'app-security-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements AfterViewInit {
  groupsGrid: jqxGridComponent;

  constructor(private permissionsService: PermissionsService) {
  }

  source =
    {
      localdata: [],
      datafields: [

        {name: 'groupName', type: 'string', map: '0'},
        {name: 'users', type: 'string', map: '1'}
      ],
      datatype: 'array'
    };

  dataAdapter = new jqx.dataAdapter(this.source);
  columns: any[] =
    [
      {
        text: 'Group Name',
        datafield: 'groupName',
        align: 'center',
        width: 150
      },
      {
        text: 'Users comma separated',
        datafield: 'users',
        align: 'center',
        width: 200
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
          const rowdata = this.groupsGrid.getrowdata(row);
          this.groupsGrid.deleterow(rowdata.uid);
        }
      }
    ];

  packItems(items) {
    if (!items) {
      return;
    }

    for (let key in items) {
      const value = items[key];
      this.source.localdata.push([key, value]);
    }
  }

  initGrid(items) {
    this.packItems(items);

    this.groupsGrid = jqwidgets.createInstance('#groupsGrid', 'jqxGrid', {
      source: this.dataAdapter,
      columns: this.columns,
      width: '100%',
      height: 260,
      filterable: false,
      sortable: true,
      editable: true
    });
  }

  ngAfterViewInit(): void {
    this.permissionsService.get(GROUPS).subscribe(response => {
      this.initGrid(response.groups);
    });
  }

  addNewItem() {
    this.groupsGrid.addrow(1, {});
  }
}
