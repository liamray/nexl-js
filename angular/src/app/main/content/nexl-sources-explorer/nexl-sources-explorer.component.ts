import {AfterViewInit, Component, ViewChild} from "@angular/core";
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtree';
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {NexlSourcesService} from "../../../services/nexl-sources.service";
import {UtilsService} from "../../../services/utils.service";
import {EXAMPLES_FILE_NAME, EXAMPLES_JS} from "./examples.js";

@Component({
  selector: '.app-nexl-sources-explorer',
  templateUrl: './nexl-sources-explorer.component.html',
  styleUrls: ['./nexl-sources-explorer.component.css']
})
export class NexlSourcesExplorerComponent implements AfterViewInit {

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
        this.updateItem(message.data);
        return;
      }

      case MESSAGE_TYPE.REMOVE_FILE_FROM_TREE: {
        this.removeFileFromTree(message.data);
        return;
      }

      case MESSAGE_TYPE.CREATE_EXAMPLES_FILE: {
        this.createExamplesFile();
        return;
      }
    }
  }

  createExamplesFile() {
    if (this.hasWritePermission !== true) {
      this.globalComponentsService.notification.openError('No write permissions to create a [' + EXAMPLES_FILE_NAME + '] file');
      return;
    }
    let item = NexlSourcesService.makeNewFileItem('', EXAMPLES_FILE_NAME);
    this.insertFileItem(item, EXAMPLES_JS);
  }

  removeFileFromTree(relativePath: string) {
    let item = this.findItemByRelativePath(relativePath);
    if (item !== undefined) {
      this.tree.removeItem(item);
    }
  }

  makeItemLabel(value: any) {
    if (value.isDir === true) {
      return value.label;
    }

    return value.isChanged === true ? value.label + '<span style="color: red">&nbsp;*</span>' : value.label;
  }

  updateItem(data: any) {
    const item = this.findItemByRelativePath(data.relativePath);
    if (item === undefined) {
      return;
    }

    item.value.isChanged = data.isChanged;
    item.label = this.makeItemLabel(item.value);

    this.tree.updateItem(item, item);
  }

  expandItem(item: any) {
    while (item.parentElement !== null) {
      this.tree.expandItem(item);
      item = item.parentElement;
    }
  }

  findItemByRelativePath(relativePath: string) {
    // iterating over all tree items
    const allItems: any[] = this.tree.getItems();

    if (UtilsService.IS_WIN) {
      relativePath = relativePath.toLocaleLowerCase();
    }

    for (let index in allItems) {
      let item = allItems[index];
      if (item.value === null) {
        continue;
      }
      const itemRelativePath = UtilsService.IS_WIN ? item.value.relativePath.toLocaleLowerCase() : item.value.relativePath;
      if (itemRelativePath === relativePath) {
        return item;
      }
    }
  }

  selectItemInTree(relativePath: string) {
    const item = this.findItemByRelativePath(relativePath);
    if (item === undefined) {
      return;
    }

    this.expandItem(item);
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
    }

    if (status.hasWritePermission !== this.hasWritePermission) {
      this.writePermissionChanged(status);
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

  itemMoved(data: any) {
    let oldRelativePath = data.oldRelativePath;
    if (UtilsService.IS_WIN) {
      oldRelativePath = oldRelativePath.toLocaleLowerCase();
    }

    const allItems: any[] = this.tree.getItems();

    for (let index in allItems) {
      let item = allItems[index];

      if (item.value === null) {
        continue;
      }

      let itemRelativePath = UtilsService.IS_WIN ? item.value.relativePath.toLocaleLowerCase() : item.value.relativePath;

      // is it the item which was renamed ?
      if (itemRelativePath === oldRelativePath) {
        item.value.label = data.newLabel;
        item.value.relativePath = data.newRelativePath;
        item.label = this.makeItemLabel(item.value);
        this.tree.updateItem(item, item);

        if (data.isDir !== true) {
          return;
        } else {
          continue;
        }
      }

      // is subdir ?
      if (itemRelativePath.indexOf(oldRelativePath) === 0) {
        item.value.relativePath = data.newRelativePath + item.value.relativePath.substr(data.oldRelativePath.length);
        item.label = this.makeItemLabel(item.value);
        this.tree.updateItem(item, item);
      }
    }
  }

  renameInner(data: any) {
    // send message to tabs to rename relative the item
    this.messageService.sendMessage({
      type: MESSAGE_TYPE.ITEM_MOVED,
      data: data
    });

    // rename relative path for all items in tree
    this.itemMoved(data);

    this.globalComponentsService.loader.close();
    this.globalComponentsService.notification.openSuccess('Item renamed');
  }

  renameItem() {
    if (this.rightClickSelectedElement === undefined || this.rightClickSelectedElement.value === null) {
      return;
    }

    const targetItem = this.rightClickSelectedElement.value.label;
    this.globalComponentsService.inputBox.open('Rename', 'Renaming [' + targetItem + '] ' + this.itemType(), targetItem, (newLabel: string) => {

      if (newLabel === undefined) {
        return;
      }

      if (!UtilsService.isFileNameValid(newLabel)) {
        this.globalComponentsService.notification.openError('The [' + newLabel + '] file name contains forbidden characters');
        return;
      }

      const data: any = {
        oldRelativePath: this.rightClickSelectedElement.value.relativePath,
        oldLabel: this.rightClickSelectedElement.value.label,
        newLabel: newLabel,
        isDir: this.rightClickSelectedElement.value.isDir
      };
      data.relativePathWithoutLabel = UtilsService.resolvePathOnly(data.oldLabel, data.oldRelativePath);
      data.newRelativePath = data.relativePathWithoutLabel + UtilsService.SERVER_INFO.SLASH + data.newLabel;

      this.globalComponentsService.loader.open();

      // different care for new created FILES ( directories not included )
      // here we don't really need to physically rename file because it still doesn't exist in FS
      if (this.rightClickSelectedElement.value.isDir !== true && this.rightClickSelectedElement.value.isNewFile === true) {
        this.renameInner(data);
        return;
      }

      this.nexlSourcesService.rename(this.rightClickSelectedElement.value.relativePath, data.newRelativePath).subscribe(
        () => {
          this.renameInner(data);
        },
        (err) => {
          this.globalComponentsService.notification.openError('Failed to rename item\nReason\n' + err.statusText);
          this.globalComponentsService.loader.close();
          console.log(err);
        }
      );
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

  onExpand(event: any) {
    let item = event.args.element;
    this.loadChildItems(item);
  }

  loadChildItems(item: any, callback?: () => void) {
    const element: any = this.tree.getItem(item);
    const value: any = element.value;
    if (!value.mustLoadChildItems) {
      if (callback) {
        callback();
      }
      return;
    }

    value.mustLoadChildItems = false;
    const $element = $(item);
    const child = $element.find('ul:first').children()[0];
    this.nexlSourcesService.listNexlSources(value.relativePath).subscribe(
      (data: any) => {
        this.tree.removeItem(child);
        this.tree.addTo(data, item);
        if (callback) {
          callback();
        }
      },
      (err) => {
        this.tree.removeItem(child);
        this.globalComponentsService.notification.openError('Failed to read directory content\nReason\n' + err.statusText);
        console.log(err);
      }
    );
  }

  newDirInner(newDirName: string) {
    if (newDirName === undefined) {
      return;
    }

    if (!UtilsService.isFileNameValid(newDirName)) {
      this.globalComponentsService.notification.openError('The [' + newDirName + '] directory name contains forbidden characters');
      return;
    }

    const relativePath = this.getRightClickDirPath() + UtilsService.SERVER_INFO.SLASH + newDirName;

    if (this.findItemByRelativePath(relativePath) !== undefined) {
      this.globalComponentsService.notification.openError('The [' + relativePath + '] item is already exists');
      return;
    }

    this.globalComponentsService.loader.open();

    this.nexlSourcesService.makeDir(relativePath).subscribe(
      () => {
        this.insertDirItem(relativePath, newDirName);
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openSuccess('Created new directory');
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to create a new directory\nReason : ' + err.statusText);
      }
    );
  }

  newDir() {
    // does use have write permissions ?
    if (this.hasWritePermission !== true) {
      this.globalComponentsService.notification.openError('No write permissions to create a directory');
      return;
    }

    this.globalComponentsService.inputBox.open('Making new directory', 'Directory name', '', (newDirName: string) => {
      this.newDirInner(newDirName);
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
        this.globalComponentsService.notification.openError('Failed to delete an item\nReason : ' + err.statusText);
      }
    );
  }

  insertFileItem(item, text?: string) {
    if (this.findItemByRelativePath(item.value.relativePath) !== undefined) {
      this.globalComponentsService.notification.openError('The [' + item.value.relativePath + '] item is already exists');
      return;
    }

    this.insertFileItemInner(item);

    // searching for new added item in tree
    const allItems = this.tree.getItems();
    allItems.forEach((treeItem: any) => {
      if (treeItem.value !== null && treeItem.value.relativePath === item.value.relativePath) {
        // expanding
        this.expandItem(treeItem);
        // selecting
        this.tree.selectItem(treeItem);
        // marking as changed
        this.updateItem(item.value);

        // opening a new tab
        this.messageService.sendMessage({
          type: MESSAGE_TYPE.CREATE_NEXL_SOURCE,
          data: {
            relativePath: item.value.relativePath,
            label: item.value.label,
            body: text === undefined ? '' : text
          }
        });
        return;
      }
    });
  }

  insertFileItemInner(item: any) {
    if (this.rightClickSelectedElement !== undefined) {
      this.expandItem(this.rightClickSelectedElement.element);
    }

    // loading child items
    const childItems = this.getFirstLevelChildren(this.rightClickSelectedElement);

    // sub dir is empty
    if (childItems.length < 1) {
      this.tree.addTo(item, this.rightClickSelectedElement);
      return;
    }

    let index = 0;
    // skipping all directories
    while (index < childItems.length && childItems[index].value.isDir === true) {
      index++;
    }

    // searching for place to add a file item
    while (index < childItems.length) {
      if (item.value.label.toLocaleLowerCase() < childItems[index].value.label.toLocaleLowerCase()) {
        break;
      }
      index++;
    }

    // add last
    if (index >= childItems.length) {
      this.tree.addAfter(item, childItems[childItems.length - 1]);
      return;
    }

    // add others
    this.tree.addBefore(item, childItems[index]);
  }


  newFile() {
    if (this.hasWritePermission !== true) {
      this.globalComponentsService.notification.openError('No write permissions to create a file');
      return;
    }

    this.globalComponentsService.inputBox.open('New file creation', 'File name', '', (newFileName: string) => {
      if (newFileName === undefined) {
        return;
      }

      if (!UtilsService.isFileNameValid(newFileName)) {
        this.globalComponentsService.notification.openError('The [' + newFileName + '] file name contains forbidden characters');
        return;
      }

      let item = NexlSourcesService.makeNewFileItem(this.getRightClickDirPath(), newFileName);

      // is item still not expanded ?
      if (this.rightClickSelectedElement !== undefined && this.rightClickSelectedElement.value.mustLoadChildItems === true) {
        this.loadChildItems(this.rightClickSelectedElement.element, () => {
          this.insertFileItem(item);
        });
        return;
      }

      this.insertFileItem(item);
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
      type: MESSAGE_TYPE.LOAD_NEXL_SOURCE,
      data: {
        relativePath: item.value.relativePath,
        label: item.value.label
      }
    });
  }

  moveItemInner() {
    this.globalComponentsService.notification.openInfo('Moving...');
  }

  moveItem(item: any, targetPathOnly: any) {
    const targetDirItem = this.findItemByRelativePath(targetPathOnly);
    if (targetDirItem === undefined) {
      return;
    }

    this.loadChildItems(targetDirItem.element, () => {
      // expanding in UI
      this.expandItem(targetDirItem.element);
      // checking is target item already exists
      const targetRelativePath = targetPathOnly + UtilsService.SERVER_INFO.SLASH + item.value.label;
      const targetItemCandidate = this.findItemByRelativePath(targetRelativePath);
      if (targetItemCandidate !== undefined) {
        this.globalComponentsService.notification.openError('The [' + targetPathOnly + '] directory already contains a [' + item.value.label + '] item');
        return;
      }

      // moving...
      this.moveItemInner();
    });

  }

  resolveTargetPathForDragAndDrop(dropItem: any, dropPosition: string) {
    if (dropPosition === 'inside') {
      return dropItem.value.isDir === true ? dropItem.value.relativePath : UtilsService.resolvePathOnly(dropItem.value.label, dropItem.value.relativePath);
    }

    if (dropPosition !== 'before' && dropPosition !== 'after') {
      throw 'Unknown drop position [' + dropPosition + ']';
    }

    return UtilsService.resolvePathOnly(dropItem.value.label, dropItem.value.relativePath);
  }

  onDragEnd: any = (item, dropItem, args, dropPosition, tree) => {
    // does use have write permissions ?
    if (this.hasWritePermission !== true) {
      this.globalComponentsService.notification.openError('No write permissions to move an item');
      return;
    }

    const targetPathOnly = this.resolveTargetPathForDragAndDrop(dropItem, dropPosition);

    // are item and dropItem on same directory level ?
    if (targetPathOnly === UtilsService.resolvePathOnly(item.value.label, item.value.relativePath)) {
      return false;
    }

    // is item is a part of dropItem ?
    if (targetPathOnly.indexOf(item.value.relativePath) === 0) {
      return false;
    }

    const opts = {
      title: 'Confirm item move',
      label: 'Are you sure you want to move a [' + item.value.relativePath + '] to [' + targetPathOnly + UtilsService.SERVER_INFO.SLASH + '] ?',
      callback: (callbackData: any) => {
        if (callbackData.isConfirmed === true) {
          this.moveItem(item, targetPathOnly);
        }
      }
    };

    this.globalComponentsService.confirmBox.open(opts);

    return false;
  };

  ngAfterViewInit(): void {
    this.tree.createComponent({
      dragEnd: this.onDragEnd
    });
  }
}
