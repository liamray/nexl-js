import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";

@Component({
  selector: 'app-confirmbox',
  templateUrl: './confirmbox.component.html',
  styleUrls: ['./confirmbox.component.css']
})
export class ConfirmBoxComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  label: string;
  isConfirmed: boolean;
  callback: (value: boolean) => void;
  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.confirmBox = this;
  }

  onOpen() {
    this.isConfirmed = false;
  }

  onClose() {
    this.callback(this.isConfirmed);
  }

  open(title: string, label: string, callback: (value: boolean) => void) {
    this.label = label;
    this.callback = callback;
    this.window.title(title);
    this.window.open();
  }
}
