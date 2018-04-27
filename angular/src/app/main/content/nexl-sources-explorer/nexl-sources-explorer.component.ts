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
    switch (message.type) {
      case MESSAGE_TYPE.AUTH_CHANGED: {
        this.authChanged(message.data);
        return;
      }

      case MESSAGE_TYPE.SELECT_ITEM_IN_TREE: {
        this.selectItemInTree(message.data);
        return;
      }

      case MESSAGE_TYPE.TAB_CONTENT_CHANGED: {
        this.tabContentChanged(message.data);
        return;
      }
    }
  }

  tabContentChanged(data: any) {
    const item = this.findItemByRelativePath(data.relativePath);
    if (item === undefined) {
      return;
    }

    item.value.isChanged = data.isChanged;

    if (item.value.isChanged) {
      item.label = item.value.label + '<span style="color: red">&nbsp;*</span>';
    } else {
      item.label = item.value.label;
    }

    this.tree.updateItem(item, item);
  }

  expandItemWrapper(item: any) {
    while (item.parentElement !== null) {
      this.tree.expandItem(item);
      item = item.parentElement;
    }
  }

  findItemByRelativePath(relativePath: string) {
    // iterating over all tree items
    const allItems: any[] = this.tree.getItems();
    for (let index in allItems) {
      let item = allItems[index];
      if (item.value !== null && item.value.relativePath === relativePath) {
        return item;
      }
    }
  }

  selectItemInTree(relativePath: string) {
    const item = this.findItemByRelativePath(relativePath);
    if (item === undefined) {
      return;
    }

    this.expandItemWrapper(item);
    this.tree.selectItem(item);
  }

  readPermissionChanged(status: any) {
    this.hasReadPermission = status.hasReadPermission;

    if (!this.hasReadPermission) {
      this.treeSource = [];
      this.expander.disabled(true);
      return;
    }

    this.refreshTreeSource();
  }

  writePermissionChanged(status: any) {
    this.hasWritePermission = status.hasWritePermission;
  }

  authChanged(status: any) {
    if (status.hasReadPermission !== this.hasReadPermission) {
      this.readPermissionChanged(status);
      return;
    }

    if (status.hasWritePermission !== this.hasWritePermission) {
      this.writePermissionChanged(status);
      return;
    }
  }

  refreshTreeSource() {
    this.nexlSourcesService.listNexlSources().subscribe(
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

    const targetItem = this.rightClickSelectedElement.value.label;
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

  insertDirItem(relativePath: string, newDirName: string) {
    // item still not expanded
    if (this.rightClickSelectedElement !== undefined && this.rightClickSelectedElement.value.mustLoadChildItems === true) {
      return;
    }

    // loading child items
    const childItems = this.getFirstLevelChildren(this.rightClickSelectedElement);

    // sub dir is empty
    if (childItems.length < 1) {
      this.tree.addTo(NexlSourcesService.makeEmptyDirItem(relativePath, newDirName), this.rightClickSelectedElement);
      return;
    }

    let index = 0;
    while (index < childItems.length) {
      if (newDirName.toLocaleLowerCase() < childItems[index].value.label.toLocaleLowerCase() || childItems[index].value.isDir !== true) {
        break;
      }
      index++;
    }

    // add last
    if (index >= childItems.length) {
      this.tree.addAfter(NexlSourcesService.makeEmptyDirItem(relativePath, newDirName), childItems[childItems.length - 1]);
      return;
    }

    // add others
    this.tree.addBefore(NexlSourcesService.makeEmptyDirItem(relativePath, newDirName), childItems[index]);
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
    this.nexlSourcesService.listNexlSources(value.relativePath).subscribe(
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

  saveNexlSource() {
    if (this.rightClickSelectedElement === undefined) {
      return;
    }

    if (this.rightClickSelectedElement.value !== null && this.rightClickSelectedElement.value.isDir === true) {
      return;
    }

    const relativePath = this.rightClickSelectedElement.value.relativePath;

    this.messageService.sendMessage({
      type: MESSAGE_TYPE.SAVE_NEXL_SOURCE,
      relativePath: relativePath
    });
  }

  newDir() {
    this.globalComponentsService.inputBox.open('Making new directory', 'Directory name', '', (newDirName: string) => {
      if (newDirName === undefined) {
        return;
      }

      const relativePath = this.getRightClickDirPath() + '/' + newDirName;
      this.globalComponentsService.loader.open();

      this.nexlSourcesService.makeDir(relativePath).subscribe(
        () => {
          this.insertDirItem(relativePath, newDirName);
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

  closeDeletedTabs(itemValue: any) {
    this.messageService.sendMessage({
      type: MESSAGE_TYPE.CLOSE_DELETED_TABS,
      data: itemValue
    });

  }

  deleteItemInnerInner(targetItem: any) {
    this.globalComponentsService.loader.open();
    this.nexlSourcesService.deleteItem(targetItem.value.relativePath).subscribe(
      () => {
        this.tree.removeItem(targetItem);
        this.closeDeletedTabs(targetItem.value);
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openSuccess('Deleted [' + this.itemType() + ']');
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to delete an item.\nReason : ' + err);
      }
    );
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

  hasParent(item: any, targetItem: any) {
    while (item !== null) {
      if (item.parentElement !== null && item.parentElement.id === targetItem.id) {
        return true;
      }

      item = this.tree.getItem(item.parentElement);
    }

    return false;
  }

  hasChanges(targetItem: any) {
    if (targetItem.value.isDir !== true) {
      return targetItem.value.isChanged === true;
    }

    const allItems: any[] = this.tree.getItems();
    for (let index in allItems) {
      let item = allItems[index];

      // skip directories
      if (item.value === null || item.value.isDir === true) {
        continue;
      }

      // skip file if not changed
      if (item.value.isChanged !== true) {
        continue;
      }

      // file changed, but is the [item] file is a child of [targetItem] ?
      if (this.hasParent(item, targetItem)) {
        return true;
      }
    }

    return false;
  }

  deleteItemInner(targetItem: any) {
    if (!this.hasChanges(targetItem)) {
      this.deleteItemInnerInner(targetItem);
      return;
    }

    // confirmation about unsaved data
    const opts = {
      title: 'Confirm delete',
      label: 'Item you are trying to delete contains unsaved data. Delete anyway ?',
      callback: (callbackData: any) => {
        if (callbackData.isConfirmed !== true) {
          return;
        }

        this.deleteItemInnerInner(targetItem);
      },
    };

    this.globalComponentsService.confirmBox.open(opts);
  }

  deleteItem() {
    if (this.rightClickSelectedElement === undefined) {
      return;
    }

    const targetItem = this.rightClickSelectedElement;

    const opts = {
      title: 'Confirm delete',
      label: 'Are you sure to delete the [' + targetItem.value.label + '] ' + this.itemType() + ' ?',
      callback: (callbackData: any) => {
        if (callbackData.isConfirmed !== true) {
          return;
        }

        this.deleteItemInner(targetItem);
      },
    };

    this.globalComponentsService.confirmBox.open(opts);
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
      data: {
        relativePath: item.value.relativePath,
        label: item.value.label
      }
    });
  }
}
