import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.css']
})
export class SecurityComponent implements OnInit {
  @ViewChild('securityWindow')
  securityWindow: jqxWindowComponent;

  constructor() { }

  ngOnInit() {
  }

  open() {
    this.securityWindow.open();
  }
}
