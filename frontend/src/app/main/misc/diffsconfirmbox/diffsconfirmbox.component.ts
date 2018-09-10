import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

@Component({
  selector: 'app-diffsconfirmbox',
  templateUrl: './diffsconfirmbox.component.html',
  styleUrls: ['./diffsconfirmbox.component.css']
})
export class DiffsConfirmBoxComponent implements OnInit {
  @ViewChild('diffsWindow') diffsWindow: jqxWindowComponent;
  @ViewChild('overrideButton') overrideButton: jqxButtonComponent;
  @ViewChild('diffsButton') diffsButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  initContent = () => {
    this.overrideButton.createComponent();
    this.diffsButton.createComponent();
    this.cancelButton.createComponent();
  };

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message: any) => {
      }
    );
  }


  ngOnInit() {
  }

  onClose() {
  }

  open(opts: any) {
    this.diffsWindow.open();
  }

  overrideFile() {
    alert('Overriding file...');
  }

  makeDiffs() {
    alert('Making diffs...');
  }
}
