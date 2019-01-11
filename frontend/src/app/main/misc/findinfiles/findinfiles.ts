import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";

@Component({
  selector: 'app-findinfiles',
  templateUrl: './findinfiles.component.html',
  styleUrls: ['./findinfiles.component.css']
})
export class FindInFilesComponent implements OnInit {
  @ViewChild('findFileWindow') findFileWindow: jqxWindowComponent;
  @ViewChild('findIn') findIn: jqxInputComponent;
  @ViewChild('text') text: jqxInputComponent;
  @ViewChild('findButton') findButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  source: string[] = [];
  hasReadPermission: boolean = false;

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.FIND_IN_FILES : {
            this.findInFiles();
            return;
          }

          case MESSAGE_TYPE.AUTH_CHANGED : {
            this.hasReadPermission = message.data.hasReadPermission;
            return;
          }
        }
      }
    );
  }

  findInFiles() {
    if (!this.hasReadPermission) {
      return;
    }

    this.text.val('');
    this.source = [];
    this.findFileWindow.open();
  }

  ngOnInit() {
  }

  open() {
  }

  initContent = () => {
    this.findButton.createComponent();
    this.cancelButton.createComponent();
  };

  onFind() {
  }

  onOpen() {
    this.text.focus();
  }
}
