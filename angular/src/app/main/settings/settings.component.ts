import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  @ViewChild('settingsWindow')
  settingsWindow: jqxWindowComponent;

  constructor() {
  }

  open() {
    this.settingsWindow.open();
  }

  ngOnInit() {
  }

}
