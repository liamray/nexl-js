import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {JSFilesService} from "../../services/js-files.service";

@Component({
  selector: 'app-findfile',
  templateUrl: './findfile.component.html',
  styleUrls: ['./findfile.component.css']
})
export class FindFileComponent implements OnInit {
  @ViewChild('findFileWindow') findFileWindow: jqxWindowComponent;
  @ViewChild('input') input: jqxInputComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  source: string[] = ['aaa', 'bbb', 'ccc'];

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService, private jsFilesService: JSFilesService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        if (message.type === MESSAGE_TYPE.FIND_FILE) {
          this.findFile();
        }
      }
    );
  }

  findFile() {
    this.globalComponentsService.loader.open();

    this.jsFilesService.listAllJSFiles().subscribe(
      (allJSFiles) => {
        this.source = allJSFiles;
        this.globalComponentsService.loader.close();
        this.findFileWindow.open();
      },
      (err) => {
        console.log(err);
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to resolve JS files list from server\nReason : ' + err.statusText);
      }
    );
  }

  ngOnInit() {
  }

  onOpen() {
    this.input.focus();
  }

  onClose() {
  }

  open() {
  }

  onKeyPress(event) {
    if (event.keyCode === 13) {
    }
  }

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  onOk() {
  }
}
