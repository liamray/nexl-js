import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";

@Component({
  selector: 'app-path',
  templateUrl: './path.component.html',
  styleUrls: ['./path.component.css']
})
export class PathComponent implements OnInit {
  @ViewChild('pathWindow')
  pathWindow: jqxWindowComponent;

  constructor() {
  }

  ngOnInit() {
  }

  open() {
    this.pathWindow.open();
  }
}
