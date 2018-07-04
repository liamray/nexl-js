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

  source: string[] = [];
  hasReadPermission: boolean = false;
  unsavedTabs: string[] = [];

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService, private jsFilesService: JSFilesService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.FIND_FILE : {
            this.findFile();
            return;
          }

          case MESSAGE_TYPE.AUTH_CHANGED : {
            this.hasReadPermission = message.data.hasReadPermission;
            return;
          }

          case MESSAGE_TYPE.CREATE_NEW_FILE_IN_TREE: {
            this.addUnsavedTab(message.data);
            return;
          }

          case MESSAGE_TYPE.OPEN_NEW_TAB: {
            this.addUnsavedTab(message.data.relativePath);
            return;
          }

          case MESSAGE_TYPE.TAB_CLOSED: {
            this.removeUnsavedTab(message.data);
            return;
          }

          case MESSAGE_TYPE.TAB_CONTENT_CHANGED: {
            if (message.data.isNewFile === false) {
              this.removeUnsavedTab(message.data.relativePath);
            }
            if (message.data.isNewFile === true) {
              this.addUnsavedTab(message.data.relativePath);
            }
            return;
          }

          case MESSAGE_TYPE.ITEM_MOVED: {
            this.itemMoved(message.data);
            return;
          }
        }
      }
    );
  }

  itemMoved(data: any) {
    this.unsavedTabs.forEach(
      (item, index) => {
        if (item.indexOf(data.oldRelativePath) === 0) {
          this.unsavedTabs[index] = data.newRelativePath + item.substr(data.oldRelativePath.length);
        }
      }
    );
  }

  removeUnsavedTab(relativePath: string) {
    let index;
    while ((index = this.unsavedTabs.indexOf(relativePath)) >= 0) {
      this.unsavedTabs.splice(index, 1);
    }
  }

  addUnsavedTab(relativePath: string) {
    if (this.unsavedTabs.indexOf(relativePath) < 0) {
      this.unsavedTabs.push(relativePath);
    }
  }

  findFile() {
    if (!this.hasReadPermission) {
      return;
    }

    this.input.val('');
    this.globalComponentsService.loader.open();

    this.jsFilesService.listAllJSFiles().subscribe(
      (allJSFiles) => {
        this.source = this.unsavedTabs.concat(allJSFiles);
        this.globalComponentsService.loader.close();
        this.findFileWindow.open();
      },
      (err) => {
        console.log(err);
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple('Error', `Failed to resolve JS files list from server. Reason : [${err.statusText}]`);
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
      this.loadJSFile();
    }
  }

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  onOk() {
    this.loadJSFile();
  }

  onSelect(event: any) {
    this.loadJSFile();
  }

  loadJSFile() {
    if (this.source.indexOf(this.input.val()) < 0) {
      return;
    }

    this.messageService.sendMessage(MESSAGE_TYPE.LOAD_JS_FILE, {
      relativePath: this.input.val()
    });
    this.findFileWindow.close();
  }
}
