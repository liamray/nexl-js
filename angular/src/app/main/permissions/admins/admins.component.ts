import {Component, ViewChild} from '@angular/core';
import {jqxGridComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxgrid';


@Component({
  selector: 'app-security-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent {
  @ViewChild('myGrid') myGrid: jqxGridComponent;

  source: any =
    {
      localdata: [],
      datafields:
        [
          { name: 'Username', type: 'string' }
        ],
      datatype: 'array'
    };

  dataAdapter: any = new jqx.dataAdapter(this.source);

  columns: any[] =
    [
      { text: 'Username', columntype: 'textbox', filtertype: 'input', datafield: 'name', width: 215 }
    ];

}
