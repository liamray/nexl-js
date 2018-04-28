import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";

export enum CONFIRMATION_BOX_OPTS {
  YES,
  NO,
  CANCEL
}

@Component({
  selector: 'app-confirmbox3',
  templateUrl: './confirmbox3.component.html',
  styleUrls: ['./confirmbox3.component.css']
})
export class ConfirmBox3Component implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('yesButton') yesButton: jqxButtonComponent;
  @ViewChild('noButton') noButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  label: string;
  confirmation: CONFIRMATION_BOX_OPTS;
  callback: (value: any) => void;

  initContent = () => {
    this.yesButton.createComponent();
    this.noButton.createComponent();
    this.cancelButton.createComponent();
  };

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.confirmBox3 = this;
  }

  onOpen() {
    this.confirmation = CONFIRMATION_BOX_OPTS.CANCEL;
  }

  onClose() {
    this.callback(this.confirmation);
  }

  onCancel() {
    this.confirmation = CONFIRMATION_BOX_OPTS.CANCEL;
    this.window.close();
  }

  onYes() {
    this.confirmation = CONFIRMATION_BOX_OPTS.YES;
    this.window.close();
  }

  onNo() {
    this.confirmation = CONFIRMATION_BOX_OPTS.NO;
    this.window.close();
  }

  open(opts: any) {
    this.label = opts.label;
    this.callback = opts.callback;
    this.window.title(opts.title);
    this.window.open();
  }
}
