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
  settingsWindow: jqxWindowComponent;

  constructor() {
  }

  open() {
    this.settingsWindow.open();
  }

  ngAfterViewInit() {
    this.settingsWindow.close();
    setTimeout(_ => {
      this.settingsWindow.width(600);
      this.settingsWindow.height(400);
      this.settingsWindow.position('center');
    }, 1);
  }

}
