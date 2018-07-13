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

          case MESSAGE_TYPE.SET_TREE_ITEMS: {
            this.findFileInner(message.data);
            return;
          }
        }
      }
    );
  }

  findFileInner(treeItems) {
    this.source = [];
    treeItems.forEach(item => {
      // skipping directories, indexing files only
      if (item.value.isDir === true) {
        return;
      }

      this.source.push(item.value.relativePath);
    });

    this.source.sort();

    this.globalComponentsService.loader.close();
    this.findFileWindow.open();
  }

  findFile() {
    if (!this.hasReadPermission) {
      return;
    }

    this.input.val('');
    this.globalComponentsService.loader.open();

    this.messageService.sendMessage(MESSAGE_TYPE.GET_TREE_ITEMS);
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
