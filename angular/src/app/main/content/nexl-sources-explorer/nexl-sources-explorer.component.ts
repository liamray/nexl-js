import {Component, ViewChild} from "@angular/core";
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtree';
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {NexlSourcesService} from "../../../services/nexl-sources.service";

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
  rightClickSelectedElement: any;

  constructor(private nexlSourcesService: NexlSourcesService, private messageService: MessageService, private globalComponentsService: GlobalComponentsService) {
    this.messageService.getMessage().subscribe(message => {
      this.handleMessages(message);
    });
  }

  handleMessages(message) {
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
  }

  refreshTreeSource() {
    this.nexlSourcesService.getNexlSources().subscribe(
      (data: any) => {
        this.expander.disabled(false);
        this.treeSource = data;
      },
      (err) => {
        this.globalComponentsService.notification.openError('Failed to resolve nexl sources list\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }

  static isRightClick(event) {
    if (!event) {
      event = window.event
    }

    if (event.which) {
      return event.which == 3;
    }
    if (event.button) {
      return event.button == 2
    }

    return false;
  }


  init(): void {
    $(document).on('contextmenu', function (e) {
      return $(e.target).parents('.jqx-tree').length <= 0;
    });

    const id = this.tree.elementRef.nativeElement.firstElementChild.id;
    $('#' + id).on('mousedown', (event) => {
      const target = $(event.target).parents('li:first')[0];

      // click on empty area
      if (target === undefined) {
        this.tree.host.jqxTree("val", undefined);
      }

      if (NexlSourcesExplorerComponent.isRightClick(event)) {
        this.handleRightClick(target);
      } else {
        this.handleLeftClick(target);
      }

      return false;
    });
  }


  renameItem() {
    if (this.rightClickSelectedElement === undefined) {
      return;
    }

    const targetItem = this.rightClickSelectedElement.label;
    this.globalComponentsService.inputBox.open('Rename', 'Renaming [' + targetItem + '] ' + this.itemType(), targetItem, (value: string) => {
    });
  }

  private openPopup(event) {
    let scrollTop = window.scrollY || 0;
    let scrollLeft = window.scrollX || 0;
    this.popupMenu.open(event.clientX + 5 + scrollLeft, event.clientY + 5 + scrollTop);
    return false;
  }

  getRightClickDirPath() {
    if (this.rightClickSelectedElement === undefined) {
      return '';
    }

    const item = this.rightClickSelectedElement.value;

    if (item.isDir === true) {
      return item.relativePath;
    }

    // removing last path element
    return item.relativePath.replace(/([/\\][^\\/]*)$/, '');
  }

  private handleLeftClick(target: any) {
    this.popupMenu.close();

    if (target === undefined) {
      return;
    }

    let item: any = this.tree.getItem(target);
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
    this.nexlSourcesService.getNexlSources(value.relativePath).subscribe(
      (data: any) => {
        this.tree.removeItem(child);
        this.tree.addTo(data, event.args.element);
      },
      (err) => {
        this.tree.removeItem(child);
        this.globalComponentsService.notification.openError('Failed to read directory content\nReason\n' + err.statusText);
        console.log(err);
      }
    );
  }

  insertDirItem(relativePath: string, label: string) {
    // item still not expanded
    if (this.rightClickSelectedElement !== undefined && this.rightClickSelectedElement.value.mustLoadChildItems === true) {
      return;
    }

    // loading child items
    const childItems = this.getFirstLevelChildren(this.rightClickSelectedElement);

    // sub dir is empty
    if (childItems.length < 1) {
      this.tree.addTo(NexlSourcesService.makeEmptyDirItem(relativePath, label), this.rightClickSelectedElement);
      return;
    }

    let index = 0;
    while (index < childItems.length) {
      if (label.toLocaleLowerCase() < childItems[index].label.toLocaleLowerCase() || childItems[index].value.isDir !== true) {
        break;
      }
      index++;
    }

    // add last
    if (index >= childItems.length) {
      this.tree.addAfter(NexlSourcesService.makeEmptyDirItem(relativePath, label), childItems[childItems.length - 1]);
      return;
    }

    // add others
    this.tree.addBefore(NexlSourcesService.makeEmptyDirItem(relativePath, label), childItems[index]);
  }

  newDir() {
    this.globalComponentsService.inputBox.open('Making new directory', 'Directory name', '', (value: string) => {
      if (value === undefined) {
        return;
      }

      const relativePath = this.getRightClickDirPath() + '/' + value;
      this.globalComponentsService.loader.open();

      this.nexlSourcesService.makeDir(relativePath).subscribe(
        () => {
          this.insertDirItem(relativePath, value);
          this.globalComponentsService.loader.close();
          this.globalComponentsService.notification.openSuccess('Created new directory');
        },
        (err) => {
          this.globalComponentsService.loader.close();
          this.globalComponentsService.notification.openError('Failed to create a new directory.\nReason : ' + err.statusText);
        }
      );
    });
  }

  newFile() {
    this.globalComponentsService.inputBox.open('New file creation', 'File name', '', (value: string) => {
      console.log('value is [%s]', value);
    });
  }

  private handleRightClick(target: any) {
    // is right click on empty area ?
    if (target === undefined) {
      this.popupMenu.disable('popup-delete-item', true);
      this.popupMenu.disable('popup-rename-item', true);
      this.rightClickSelectedElement = undefined;
      this.openPopup(event);
    } else {
      this.popupMenu.disable('popup-delete-item', false);
      this.popupMenu.disable('popup-rename-item', false);
      this.tree.selectItem(target);
      this.rightClickSelectedElement = this.tree.getItem(target);
      this.openPopup(event);
    }
  }

  itemType() {
    return this.rightClickSelectedElement.value.isDir === true ? 'directory' : 'file';
  }

  deleteItem() {
    if (this.rightClickSelectedElement === undefined) {
      return;
    }

    const targetItem = this.rightClickSelectedElement.label;

    this.globalComponentsService.confirmBox.open('Confirm delete', 'Are you sure to delete the [' + targetItem + '] ' + this.itemType() + ' ?', (isConfirmed) => {
      if (isConfirmed !== true) {
        return;
      }

      this.globalComponentsService.loader.open();
      this.nexlSourcesService.deleteItem(this.rightClickSelectedElement.value.relativePath).subscribe(
        () => {
          this.tree.removeItem(this.rightClickSelectedElement);
          this.globalComponentsService.loader.close();
          this.globalComponentsService.notification.openSuccess('Deleted');
        },
        (err) => {
          this.globalComponentsService.loader.close();
          this.globalComponentsService.notification.openError('Failed to delete an item.\nReason : ' + err);
        }
      );
    });
  }

  getFirstLevelChildren(item) {
    const result = [];

    let sameLevelId;

    if (item === undefined) {
      sameLevelId = null;
    }

    if (item !== undefined) {
      if (item.value.isDir === true) {
        sameLevelId = item.id;
      } else {
        // files don't have inner items, so applying parent's id
        sameLevelId = item.parentElement === null ? null : item.parentElement.id;
      }
    }

    const allItems: any[] = this.tree.getItems();
    for (let i in allItems) {
      const parentElementId = allItems[i].parentElement === null ? null : allItems[i].parentElement.id;
      if (parentElementId === sameLevelId) {
        result.push(allItems[i]);
      }
    }
    return result;
  }
}
