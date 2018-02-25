import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements AfterViewInit {
  @ViewChild('settingsWindow')
  settingsWindow: jqxWindowComponent;

  @ViewChild('saveButton')
  saveButton: jqxButtonComponent;

  @ViewChild('cancelButton')
  cancelButton: jqxButtonComponent;

  constructor() {
  }

  open() {
    this.settingsWindow.open();
  }

  ngAfterViewInit() {
    this.settingsWindow.close();
  }

  save() {
    this.settingsWindow.close();
  }

  initContent = () => {
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  }
}
