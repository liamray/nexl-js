import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import jqxWindow = jqwidgets.jqxWindow;

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements AfterViewInit {
  @ViewChild('settingsWindow')
  settingsWindow: jqxWindow;

  constructor() {
  }

  open() {
    this.settingsWindow.open();
  }

  ngAfterViewInit() {
    this.settingsWindow.close();
  }

}
