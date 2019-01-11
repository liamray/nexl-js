import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxComboBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcombobox";

@Component({
  selector: 'app-findfile',
  templateUrl: './findfile.component.html',
  styleUrls: ['./findfile.component.css']
})
export class FindFileComponent implements OnInit {
  @ViewChild('findFileWindow') findFileWindow: jqxWindowComponent;
  @ViewChild('input') input: jqxComboBoxComponent;
  @ViewChild('findButton') findButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  source: string[] = [];
  hasReadPermission: boolean = false;

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
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

  loadFileFromStorage() {
    if (this.source.indexOf(this.input.val()) < 0) {
      return;
    }

    this.messageService.sendMessage(MESSAGE_TYPE.LOAD_FILE_FROM_STORAGE, {
      relativePath: this.input.val()
    });
    this.findFileWindow.close();
  }

  open() {
  }

  initContent = () => {
    this.findButton.createComponent();
    this.cancelButton.createComponent();
  };

  onOk() {
    this.loadFileFromStorage();
  }
}
