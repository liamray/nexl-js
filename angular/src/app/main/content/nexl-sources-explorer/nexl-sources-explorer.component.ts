import {Component, ViewChild} from "@angular/core";
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtree';
import {NexlSourcesService} from "../../../services/nexl-sources.service";
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {GlobalComponentsService} from "../../../services/global-components.service";

@Component({
  selector: '.app-nexl-sources-explorer',
  templateUrl: './nexl-sources-explorer.component.html',
  styleUrls: ['./nexl-sources-explorer.component.css']
})
export class NexlSourcesExplorerComponent {
  @ViewChild('expander') expander: jqxExpanderComponent;
  @ViewChild('tree') tree: jqxTreeComponent;
  @ViewChild('popupMenu') popupMenu: jqxMenuComponent;

  hasReadPermission = false;
  hasWritePermission = false;
  treeSource = [];

  constructor(private nexlSourcesService: NexlSourcesService, private messageService: MessageService, private globalComponentsService: GlobalComponentsService) {
    this.messageService.getMessage().subscribe(message => {
      if (message.type !== MESSAGE_TYPE.AUTH_CHANGED) {
        return;
      }

      const status = message.data;

      // nothing changed, just skip it
      if (status.hasReadPermission === this.hasReadPermission && status.hasWritePermission === this.hasWritePermission) {
        return;
      }

      this.hasReadPermission = status.hasReadPermission;
      this.hasWritePermission = status.hasWritePermission;

      if (!this.hasReadPermission) {
        this.treeSource = [];
        this.expander.disabled(true);
        return;
      }

      this.refreshTreeSource();
    });
  }

  refreshTreeSource() {
    this.nexlSourcesService.getNexlSources().subscribe(
      (data: any) => {
        this.expander.disabled(false);
        this.treeSource = data;
      },
      (err) => {
        this.globalComponentsService.notification.openError('Failed to get nexl sources list\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }

  private openPopup(event) {
    this.tree.selectItem(event.target);

    let scrollTop = window.scrollY;
    let scrollLeft = window.scrollX;
    this.popupMenu.open(event.clientX + 5 + scrollLeft, event.clientY + 5 + scrollTop);
    return false;
  }

  init(): void {
    document.addEventListener('contextmenu', event => {
      event.preventDefault();

      // is to close a popup ?
      if (!(<HTMLElement>event.target).classList.contains('jqx-tree-item')) {
        this.popupMenu.close();
        return;
      }

      return this.openPopup(event);
    });

  }

  onPopup(event: any): void {
    let item = event.args.innerText;
    let selectedItem = null;
    switch (item) {
      case "Add Item":
        selectedItem = this.tree.getSelectedItem();
        if (selectedItem != null) {
          this.tree.addTo({label: 'Item'}, selectedItem.element);
        }
        break;
      case "Remove Item":
        selectedItem = this.tree.getSelectedItem();
        if (selectedItem != null) {
          this.tree.removeItem(selectedItem.element);
        }
        break;
    }
  };

  select(event: any) {
    let args = event.args;
    let item: any = this.tree.getItem(args.element);
    if (item.value.isDir === true) {
      return;
    }
    this.messageService.sendMessage({
      type: MESSAGE_TYPE.OPEN_FILE,
      data: item.value.relativePath
    });
  }

  expand(event: any) {
    const element: any = this.tree.getItem(event.args.element);
    const value: any = element.value;
    if (!value.mustLoadChildItems) {
      return;
    }

    value.mustLoadChildItems = false;
    const $element = $(event.args.element);
    const child = $element.find('ul:first').children()[0];
    this.tree.removeItem(child);
    this.nexlSourcesService.getNexlSources(value.relativePath).subscribe(
      (data: any) => {
        this.tree.addTo(data, event.args.element);
      },
      (err) => {
        this.globalComponentsService.notification.openError('Failed to read directory content\nReason\n' + err.statusText);
        console.log(err);
      }
    );
  }
}
