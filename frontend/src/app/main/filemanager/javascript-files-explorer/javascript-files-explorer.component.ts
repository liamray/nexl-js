import {AfterViewInit, Component, ViewChild} from "@angular/core";
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtree';
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {GlobalComponentsService} from "../../services/global-components.service";
import {NexlSourcesService} from "../../services/nexl-sources.service";
import {UtilsService} from "../../services/utils.service";
import {EXAMPLES_FILE_NAME, EXAMPLES_JS} from "./examples.js";

@Component({
  selector: '.app-javascript-files-explorer',
  templateUrl: './javascript-files-explorer.component.html',
  styleUrls: ['./javascript-files-explorer.component.css']
})
export class JavaScriptFilesExplorerComponent implements AfterViewInit {

  @ViewChild('expander') expander: jqxExpanderComponent;
  @ViewChild('tree') tree: jqxTreeComponent;
  @ViewChild('popupMenu') popupMenu: jqxMenuComponent;

  hasReadPermission = false;
  hasWritePermission = false;
  isAdmin = false;
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

      case MESSAGE_TYPE.TAB_CONTENT_CHANGED: {
        this.updateItem(message.data);
        return;
      }

      case MESSAGE_TYPE.TAB_CLOSED: {
        this.tabClosed(message.data);
        return;
      }

      case MESSAGE_TYPE.CREATE_EXAMPLES_FILE: {
        this.createExamplesFile();
        return;
      }

      case MESSAGE_TYPE.RELOAD_JS_FILES: {
        if (this.hasReadPermission) {
          this.refreshTreeSource();
        }
        return;
      }

      case MESSAGE_TYPE.EXPAND_FROM_ROOT: {
        this.expandFromRoot(message.data).then(
          () => {
            this.messageService.sendMessage(MESSAGE_TYPE.TREE_ITEM_EXPANDED, message.data);
          }
        );
        return;
      }

      case MESSAGE_TYPE.CREATE_NEW_FILE_IN_TREE: {
        this.createNewFileInTree(message.data);
        return;
      }
    }
  }

  delay() {
    return new Promise((resolve, reject) => {
      setTimeout(
        () => {
          resolve();
        }, 100
      );
    });
  }

  createNewFileInTree(relativePath: string) {
    const fileName = UtilsService.resolveFileName(relativePath);
    const path = UtilsService.resolvePathOnly(fileName, relativePath);
    this.expandFromRoot(relativePath).then(this.delay).then(
      () => {

        let item = NexlSourcesService.makeNewFileItem(path, fileName);
        const parentItem = this.findItemByRelativePath(path);
        this.insertFileItemInner(item, parentItem);
        const treeItem = this.findItemByRelativePath(relativePath);
        this.updateItem(item.value);
        this.tree.selectItem(treeItem);
      }
    );
  }

  createExamplesFile() {
    if (this.hasWritePermission !== true) {
      this.globalComponentsService.notification.openError('No write permissions to create a [' + EXAMPLES_FILE_NAME + '] file');
      return;
    }
    let item = NexlSourcesService.makeNewFileItem('', EXAMPLES_FILE_NAME);
    this.insertFileItem(item);
    this.sendOpenNewTabMessage(item, EXAMPLES_JS);
  }

  tabClosed(relativePath: string) {
    let item = this.findItemByRelativePath(relativePath);
    // removing new files
    if (item !== undefined && item.value.isNewFile === true) {
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

    if (data.isChanged !== undefined) {
      item.value.isChanged = data.isChanged;
      item.label = this.makeItemLabel(item.value);
      this.tree.updateItem(item, item);
    }

    if (data.isNewFile !== undefined) {
      item.value.isNewFile = data.isNewFile;
      this.tree.updateItem(item, item);
    }
  }

  updateItems(data: any[]) {
    data.forEach((item) => {
      this.updateItem(item.value);
    });
  }

  // iterates over sub directories from child to root and expands them
  expandFromChild(item: any) {
    while (item.parentElement !== null) {
      this.tree.expandItem(item);
      item = item.parentElement;
    }
  }

  selectItemPromised(relativePath: string) {
    return new Promise(
      (resolve, reject) => {
        const treeItem = this.findItemByRelativePath(relativePath);
        if (treeItem !== undefined) {
          this.tree.selectItem(treeItem);
        }

        resolve();
      });
  }

  // sequentially expands path hierarchy from root
  expandFromRoot(item: string) {
    const SLASH = UtilsService.SERVER_INFO.SLASH;

    // splitting path
    const items: any = item.split(SLASH);

    // first empty item related to preceding slash, removing it if present
    if (items.length > 0 && items[0] === '') {
      items.shift();
    }

    // it should be at least two items
    if (items.length < 2) {
      return this.selectItemPromised(item);
    }

    // removing first element
    const firstItem = items.shift();

    // iterating over rest elements and expanding
    let finalPromise = items.reduce(
      (currentPromise, newItem) => {
        return currentPromise.then(
          (currentItem) => {
            const item = this.findItemByRelativePath(currentItem);
            return this.loadChildItems(item).then(
              () => {
                this.tree.expandItem(item);
                return Promise.resolve(`${currentItem}${SLASH}${newItem}`);
              });
          });
      },
      Promise.resolve(`${UtilsService.SERVER_INFO.SLASH}${firstItem}`)
    );

    finalPromise = finalPromise || Promise.resolve();

    return finalPromise.then(
      () => {
        return this.selectItemPromised(item);
      });
  }

  findItemByRelativePath(relativePath: string) {
    // iterating over all tree items
    const allItems: any[] = this.tree.getItems();

    for (let index in allItems) {
      let item = allItems[index];
      if (item.value === null) {
        continue;
      }
      if (UtilsService.isPathEqual(relativePath, item.value.relativePath)) {
        return item;
      }
    }
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

  updatePopupMenu() {
    this.popupMenu.disable('popup-new-dir', !this.hasWritePermission);
    this.popupMenu.disable('popup-new-file', !this.hasWritePermission);
    this.popupMenu.disable('popup-rename-item', !this.hasWritePermission);
    this.popupMenu.disable('popup-delete-item', !this.hasWritePermission);
  }

  writePermissionChanged(status: any) {
    this.hasWritePermission = status.hasWritePermission;

    this.updatePopupMenu();
  }

  authChanged(status: any) {
    this.isAdmin = status.isAdmin;

    if (status.hasReadPermission !== this.hasReadPermission) {
      this.readPermissionChanged(status);
    }

    if (status.hasWritePermission !== this.hasWritePermission) {
      this.writePermissionChanged(status);
    }

    // lock icon the title
    if (this.hasReadPermission === true && this.hasWritePermission !== true) {
      $('#jsFilesLockIcon').css('display', '');
    } else {
      $('#jsFilesLockIcon').css('display', 'none');
    }
  }

  refreshTreeSource() {
    this.treeSource = [];

    this.nexlSourcesService.listNexlSources().subscribe(
      (data: any) => {
        this.expander.disabled(false);
        this.treeSource = data;

        // the [this.treeSource = data] assignment doesn't really updates tree instantly, tree still empty, therefore we need a little delay
        setTimeout(
          () => {
            this.messageService.sendMessage(MESSAGE_TYPE.JS_FILES_TREE_RELOADED);
          }, 100);
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

      if (JavaScriptFilesExplorerComponent.isRightClick(event)) {
        this.handleRightClick(target);
      } else {
        this.handleLeftClick(target);
      }

      return false;
    });
  }

  itemMoved(data: any) {
    let oldRelativePath = data.oldRelativePath;

    const allItems: any[] = this.tree.getItems();

    for (let index in allItems) {
      let item = allItems[index];

      if (item.value === null) {
        continue;
      }

      let itemRelativePath = item.value.relativePath;

      // is it the item which was renamed ?
      if (UtilsService.isPathEqual(itemRelativePath, oldRelativePath)) {
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
    this.messageService.sendMessage(MESSAGE_TYPE.ITEM_MOVED, data);

    // rename relative path for all items in tree
    this.itemMoved(data);

    this.globalComponentsService.loader.close();
    this.globalComponentsService.notification.openSuccess('Item renamed');
  }

  renameItem() {
    if (this.rightClickSelectedElement === undefined || this.rightClickSelectedElement.value === null) {
      return;
    }

    if (!this.hasWritePermission) {
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

  insertDirItem(item2Add: any, addTo: any) {
    // item still not expanded, so we don't need to add it to the tree
    if (addTo !== undefined && addTo.value.mustLoadChildItems === true) {
      return;
    }

    // loading child items
    const childItems = this.getFirstLevelChildren(addTo);

    // sub dir is empty
    if (childItems.length < 1) {
      this.tree.addTo(item2Add, addTo);
      return;
    }

    let index = 0;
    while (index < childItems.length) {
      if (item2Add.label.toLocaleLowerCase() < childItems[index].value.label.toLocaleLowerCase() || childItems[index].value.isDir !== true) {
        break;
      }
      index++;
    }

    // add last
    if (index >= childItems.length) {
      this.tree.addAfter(item2Add, childItems[childItems.length - 1]);
      return;
    }

    // add others
    this.tree.addBefore(item2Add, childItems[index]);
  }

  onExpand(event: any) {
    let item = event.args.element;
    this.loadChildItems(item).catch(_ => _);
  }

  loadChildItems(item: any) {
    return new Promise((resolve, reject) => {
      const element: any = this.tree.getItem(item);
      const value: any = element.value;
      if (!value.mustLoadChildItems) {
        resolve();
        return;
      }

      value.mustLoadChildItems = false;
      const child = element.nextItem;
      this.nexlSourcesService.listNexlSources(value.relativePath).subscribe(
        (data: any) => {
          this.tree.removeItem(child);
          this.tree.addTo(data, item);
          resolve();
        },
        (err) => {
          this.tree.removeItem(child);
          this.globalComponentsService.notification.openError('Failed to read directory content\nReason\n' + err.statusText);
          console.log(err);
          reject();
        }
      );

    });
  }

  newDirInner(newDirName: string) {
    if (newDirName === undefined) {
      return;
    }

    if (!UtilsService.isFileNameValid(newDirName)) {
      this.globalComponentsService.notification.openError('The [' + newDirName + '] directory name contains forbidden characters');
      return;
    }

    const newDirRelativePath = this.getRightClickDirPath() + UtilsService.SERVER_INFO.SLASH + newDirName;

    if (this.findItemByRelativePath(newDirRelativePath) !== undefined) {
      this.globalComponentsService.notification.openError('The [' + newDirRelativePath + '] item is already exists');
      return;
    }

    this.globalComponentsService.loader.open();

    this.nexlSourcesService.makeDir(newDirRelativePath).subscribe(
      () => {
        this.insertDirItem(NexlSourcesService.makeEmptyDirItem(newDirRelativePath, newDirName), this.rightClickSelectedElement);
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
      return;
    }

    this.globalComponentsService.inputBox.open('Making new directory', 'Directory name', '', (newDirName: string) => {
      this.newDirInner(newDirName);
    });
  }

  closeDeletedTabs(itemValue: any) {
    this.messageService.sendMessage(MESSAGE_TYPE.CLOSE_DELETED_TABS, itemValue);
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

  updateSelectExpandItem(item: any) {
    const treeItem = this.findItemByRelativePath(item.value.relativePath);
    this.updateItem(item.value);
    this.tree.selectItem(treeItem);
    this.expandFromChild(treeItem);
  }

  sendOpenNewTabMessage(item, text?: string) {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_NEW_TAB, {
      relativePath: item.value.relativePath,
      label: item.value.label,
      body: text === undefined ? '' : text
    });
  }

  insertFileItem(item) {
    if (this.findItemByRelativePath(item.value.relativePath) !== undefined) {
      this.globalComponentsService.notification.openError('The [' + item.value.relativePath + '] item is already exists');
      return;
    }

    this.insertFileItemInner(item, this.rightClickSelectedElement);
    this.updateSelectExpandItem(item);
  }

  insertFileItemInner(item: any, parentItem: any) {
    // loading child items
    const childItems = this.getFirstLevelChildren(parentItem);

    // sub dir is empty
    if (childItems.length < 1) {
      this.tree.addTo(item, parentItem);
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
        this.loadChildItems(this.rightClickSelectedElement.element).then(
          () => {
            this.insertFileItem(item);
            this.sendOpenNewTabMessage(item);
          }).catch(_ => _);
        return;
      }

      this.insertFileItem(item);
      this.sendOpenNewTabMessage(item);
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
      this.popupMenu.disable('popup-delete-item', !this.hasWritePermission);
      this.popupMenu.disable('popup-rename-item', !this.hasWritePermission);
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

    if (!this.hasWritePermission) {
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

    this.messageService.sendMessage(MESSAGE_TYPE.LOAD_JS_FILE, {
      relativePath: item.value.relativePath,
      label: item.value.label
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

  moveFileItem(data: any) {
    // creating root item
    const item2Add: any = NexlSourcesService.makeNewFileItem(data.dropPath, data.item2Move.value.label);
    item2Add.value.isChanged = data.item2Move.value.isChanged;
    item2Add.value.isNewFile = data.item2Move.value.isNewFile;

    // adding to the
    this.insertFileItemInner(item2Add, data.dropItem);
    this.updateSelectExpandItem(item2Add);
  }

  collectChildItems(rootItem: any, allItems: any[], changedFileItems: any[], dropItemRelativePath: string) {
    const result = [];

    allItems.forEach((item) => {
      if (!item.value) {
        return;
      }

      const path = UtilsService.resolvePathOnly(item.value.label, item.value.relativePath);
      if (!UtilsService.isPathEqual(path, rootItem.relativePath)) {
        return;
      }

      let newItem;
      const newRelativePath = dropItemRelativePath + UtilsService.SERVER_INFO.SLASH + rootItem.label;

      // is dir ?
      if (item.value.isDir === true) {
        newItem = NexlSourcesService.makeEmptyDirItem(newRelativePath, item.value.label);
        newItem.value.mustLoadChildItems = item.value.mustLoadChildItems;
        // does it have sub items ?
        if (newItem.value.mustLoadChildItems !== true) {
          newItem.items = this.collectChildItems(newItem, allItems, changedFileItems, dropItemRelativePath + UtilsService.SERVER_INFO.SLASH + item.value.label);
        }
      }

      // is file ?
      if (item.value.isDir !== true) {
        newItem = NexlSourcesService.makeNewFileItem(newRelativePath, item.value.label);
        newItem.value.isChanged = item.value.isChanged;
        newItem.value.isNewFile = item.value.isNewFile;
        if (newItem.value.isChanged === true) {
          changedFileItems.push(newItem);
        }
      }

      result.push(newItem);
    });

    return result;
  }

  moveDirItem(data: any) {
    // creating root item
    const item2Add: any = NexlSourcesService.makeEmptyDirItem(data.targetRelativePath, data.item2Move.value.label);

    // collecting existing items under the item2Move item
    const allItems = this.tree.getItems();
    const changedFileItems = [];
    let childItems = this.collectChildItems(data.item2Move.value, allItems, changedFileItems, data.dropPath);
    if (childItems.length > 0) {
      item2Add.items = childItems;
      item2Add.value.mustLoadChildItems = false;
    }

    // adding to the
    this.insertDirItem(item2Add, data.dropItem);

    // updating changed files
    this.updateItems(changedFileItems);
  }

  moveItemInnerInner(data) {
    if (data.item2Move.value.isDir === true) {
      this.moveDirItem(data);
    } else {
      this.moveFileItem(data);
    }

    this.tree.removeItem(data.item2Move);

    // expanding in UI
    if (data.dropItem !== undefined) {
      this.expandFromChild(data.dropItem.element);
    }

    // updating tabs
    this.messageService.sendMessage(MESSAGE_TYPE.ITEM_MOVED, {
      oldRelativePath: data.item2Move.value.relativePath,
      oldLabel: data.item2Move.value.label,
      newRelativePath: data.targetRelativePath,
      newLabel: UtilsService.resolveFileName(data.targetRelativePath,),
      isDir: data.item2Move.value.isDir
    });

    this.globalComponentsService.loader.close();
  }

  moveItemInner(data: any) {
    // checking is target item2Move already exists
    data.targetRelativePath = data.dropPath + UtilsService.SERVER_INFO.SLASH + data.item2Move.value.label;
    const targetItemCandidate = this.findItemByRelativePath(data.targetRelativePath);
    if (targetItemCandidate !== undefined) {
      this.globalComponentsService.notification.openError('The [' + data.dropPath + UtilsService.SERVER_INFO.SLASH + '] directory already contains a [' + data.item2Move.value.label + '] item');
      return;
    }

    this.globalComponentsService.loader.open();

    if (data.item2Move.value.isNewFile === true) {
      this.moveItemInnerInner(data);
      return;
    }

    // move on server
    this.nexlSourcesService.moveItem(data.item2Move.value.relativePath, data.dropPath).subscribe(
      () => {
        this.moveItemInnerInner(data);
      },
      (err) => {
        console.log(err);
        this.globalComponentsService.notification.openError(err.statusText);
        this.globalComponentsService.loader.close();
      }
    );
  }

  moveItem(item2Move: any, dropPath: string) {
    const data = {
      item2Move: item2Move,
      dropPath: dropPath,
      dropItem: this.findItemByRelativePath(dropPath)
    };

    if (data.dropItem === undefined) {
      this.moveItemInner(data);
      return;
    }

    this.loadChildItems(data.dropItem.element).then(
      () => {
        this.moveItemInner(data);
      }
    ).catch(_ => _);
  }

  onDragEnd: any = (item2Move, dropItem, args, dropPosition, tree) => {
    // does use have write permissions ?
    if (this.hasWritePermission !== true) {
      this.globalComponentsService.notification.openError('No write permissions to move an item');
      return false;
    }

    const dropPath = this.resolveTargetPathForDragAndDrop(dropItem, dropPosition);

    // are item and dropItem on same directory level ?
    if (dropPath === UtilsService.resolvePathOnly(item2Move.value.label, item2Move.value.relativePath)) {
      return false;
    }

    // is item is a part of dropItem ?
    if (dropPath.indexOf(item2Move.value.relativePath) === 0) {
      return false;
    }

    const opts = {
      title: 'Confirm item move',
      label: 'Are you sure you want to move a [' + item2Move.value.relativePath + '] to [' + dropPath + UtilsService.SERVER_INFO.SLASH + '] ?',
      callback: (callbackData: any) => {
        if (callbackData.isConfirmed === true) {
          this.moveItem(item2Move, dropPath);
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

    this.updatePopupMenu();
  }
}
