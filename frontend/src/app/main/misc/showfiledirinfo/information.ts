import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.css']
})
export class InformationComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;

  hasReadPermission: boolean = false;
  fileStatus: string = '';
  value: any = {};

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.SHOW_FILE_DIR_INFORMATION : {
            this.showFileDirInfo(message.data);
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

  showFileDirInfo(value: any) {
    if (!this.hasReadPermission) {
      return;
    }

    if (value === undefined) {
      return;
    }

    this.value = value;
    this.fileStatus = value.isChanged === true ? ( value.isNewFile === true ? 'New file' : 'Modified' ) : 'Unmodified';
    this.window.open();
  }

  ngOnInit(): void {
  }

  initContent = () => {
    this.okButton.createComponent();
  };

  onOpen() {
  }
}
