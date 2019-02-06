import {AfterViewInit, Component, ViewChild} from "@angular/core";
import {jqxMenuComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxmenu';
import {jqxTreeComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxtree';
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {GlobalComponentsService} from "../../services/global-components.service";
import {UtilsService} from "../../services/utils.service";
import {HttpClient} from "@angular/common/http";
import {ICONS} from "../../misc/messagebox/messagebox.component";
import {HttpRequestService} from "../../services/http.requests.service";
import {AppearanceService} from "../../services/appearance.service";

const DIR_ICON = UI_CONSTANTS.DIR_ICON;
const FILE_ICON = UI_CONSTANTS.FILE_ICON;

@Component({
  selector: '.app-storage-files-explorer',
  templateUrl: './storage-files-explorer.component.html',
  styleUrls: ['./storage-files-explorer.component.css']
})
export class StorageExplorerComponent implements AfterViewInit {

  @ViewChild('expander') expander: jqxExpanderComponent;
  @ViewChild('tree') tree: jqxTreeComponent;
  @ViewChild('popupMenu') popupMenu: jqxMenuComponent;

  hasReadPermission = false;
  hasWritePermission = false;
  treeSource = [];
  rightClickSelectedElement: any;
  tabsMap: any = {};

  constructor(private messageService: MessageService, private globalComponentsService: GlobalComponentsService, private httpClient: HttpClient, private http: HttpRequestService) {
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
        this.storeChangedTab(message.data);
        return;
      }

      case MESSAGE_TYPE.TAB_CLOSED: {
        this.tabClosed(message.data);
        return;
      }

      case MESSAGE_TYPE.RELOAD_FILES: {
        if (this.hasReadPermission) {
          this.loadTreeItems();
        }
        return;
      }

      case MESSAGE_TYPE.EXPAND_ITEM_IN_TREE: {
        this.autoscroll2Item(message.data);
        return;
      }

      case MESSAGE_TYPE.CREATE_NEW_FILE_IN_TREE: {
        this.createNewFileInTree(message.data);
        return;
      }

      case MESSAGE_TYPE.GET_TREE_ITEMS: {
        this.messageService.sendMessage(MESSAGE_TYPE.SET_TREE_ITEMS, this.tree.getItems());
        return;
      }

      case MESSAGE_TYPE.TAB_SELECTED: {
        this.tabSelected(message.data);
        return;
      }
    }
  }

  selectItem(relativePath: string) {
    const treeItem = this.findItemByRelativePath(relativePath);
    if (treeItem !== undefined) {
      this.tree.selectItem(treeItem);
      this.tree.ensureVisible(treeItem.element);
    }
  }

  createNewFileInTreeInner(relativePath: string) {
    const fileName = UtilsService.resolveFileName(relativePath);
    const path = UtilsService.resolvePathOnly(fileName, relativePath);
    this.loadTreeItemsHierarchy(path, false).then(
      () => {
        let item = StorageExplorerComponent.makeNewFileItem(path, fileName);
        const parentItem = this.findItemByRelativePath(path);
        this.insertFileItemInner(item, parentItem);
        item.value.isChanged = true;
        item.value.isNewFile = true;
        this.updateItem(item.value);
        this.autoscroll2Item(relativePath);
      }
    );
  }

  static makeFileItem(relativePath: string, fileName: string, isChanged: boolean, isNew: boolean) {
    return {
      label: fileName,
      icon: FILE_ICON,
      value: {
        relativePath: relativePath,
        label: fileName,
        isDir: false,
        isChanged: isChanged,
        isNewFile: isNew
      }
    };
  }

  static makeNewFileItem(relativePath: string, newFileName: string) {
    return StorageExplorerComponent.makeFileItem(relativePath + UtilsService.SERVER_INFO.SLASH + newFileName, newFileName, true, true);
  }

  static makeDirItem(relativePath: string, dirName: string, items: any[], mustLoadChildItems = false) {
    return {
      label: dirName,
      icon: DIR_ICON,
      items: items,
      value: {
        relativePath: relativePath,
        label: dirName,
        mustLoadChildItems: mustLoadChildItems,
        isDir: true
      }
    };
  }

  static makeEmptyDirItem(relativePath: string, newDirName: string) {
    return StorageExplorerComponent.makeDirItem(relativePath, newDirName, [], false);
  }

  createNewFileInTree(relativePath: string) {
    // is file exists ?
    if (this.findItemByRelativePath(relativePath) === undefined) {
      this.createNewFileInTreeInner(relativePath);
      return;
    }

    // renaming item
    const newRelativePath = relativePath + '.' + Math.random();
    this.messageService.sendMessage(MESSAGE_TYPE.ITEM_MOVED, {
      oldRelativePath: relativePath,
      oldLabel: UtilsService.resolveFileName(relativePath),
      newRelativePath: newRelativePath,
      newLabel: UtilsService.resolveFileName(newRelativePath),
      isDir: false
    });

    // marking old file as unmodified
    this.updateItem({
      relativePath: relativePath,
      isChanged: false
    });

    this.createNewFileInTreeInner(newRelativePath);
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

  expandItem(item: any, isExpand: boolean) {
    if (isExpand === true) {
      this.tree.expandItem(item)
    }
  }

  // sequentially expands path hierarchy from root
  loadTreeItemsHierarchy(relativePath: string, isExpand: boolean) {
    const SLASH = UtilsService.SERVER_INFO.SLASH;

    // splitting path
    const items: any = relativePath.split(SLASH);

    // first empty item related to preceding slash, removing it if present
    if (items.length > 0 && items[0] === '') {
      items.shift();
    }

    if (items.length < 1) {
      return Promise.resolve();
    }

    // iterating over rest elements and expanding
    const finalPromise = items.reduce(
      (currentPromise, newItem) => {
        return currentPromise.then(
          (currentItem) => {
            const nextItem = `${currentItem}${SLASH}${newItem}`;

            const item = this.findItemByRelativePath(nextItem);
            if (item === undefined || item.value.isDir !== true) {
              return Promise.resolve(nextItem);
            }

            if (item.value.mustLoadChildItems !== true) {
              this.expandItem(item, isExpand);
              return Promise.resolve(nextItem);
            }

            this.expandItem(item, isExpand);
            return Promise.resolve(nextItem);

          });
      },
      Promise.resolve('')
    );

    return finalPromise || Promise.resolve();
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

    this.loadTreeItems();
  }

  updatePopupMenu() {
    this.popupMenu.disable('find-in-files-from-here', !this.hasReadPermission);
    this.popupMenu.disable('popup-show-information', !this.hasReadPermission);

    this.popupMenu.disable('popup-make-a-copy', !this.hasWritePermission);
    this.popupMenu.disable('popup-new-dir', !this.hasWritePermission);
    this.popupMenu.disable('popup-new-file', !this.hasWritePermission);
    this.popupMenu.disable('popup-rename-item', !this.hasWritePermission);
    this.popupMenu.disable('popup-delete-item', !this.hasWritePermission);
  }

  authChanged(status: any) {
    if (status.hasReadPermission !== this.hasReadPermission) {
      this.readPermissionChanged(status);
      this.updatePopupMenu();
    }

    if (!status.hasReadPermission) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, "You don't have read permission to view JavaScript files");
    }

    if (status.hasWritePermission !== this.hasWritePermission) {
      this.hasWritePermission = status.hasWritePermission;
      this.updatePopupMenu();
    }
  }

  loadTreeItems() {
    this.treeSource = [];

    this.httpClient.post<any>(REST_URLS.STORAGE.URLS.TREE_ITEMS, {}).subscribe(
      (data: any) => {
        this.expander.disabled(false);
        this.treeSource = data;

        // the [this.treeSource = data] assignment doesn't really updates tree instantly, tree still empty, therefore we need a little delay
        setTimeout(
          () => {
            this.messageService.sendMessage(MESSAGE_TYPE.FILES_TREE_RELOADED);
          }, 100);
      },
      (err) => {
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to resolve JavaScript file list. Reason : [${err.statusText}]`);
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

      if (StorageExplorerComponent.isRightClick(event)) {
        this.handleRightClick(target, event);
      } else {
        this.handleLeftClick(target, event);
      }

      return false;
    });
  }

  renameInnerInner(data: any) {
    let oldRelativePath = data.oldRelativePath;
    const allItems: any[] = this.tree.getItems();
    let targetItem: any;

    for (let index in allItems) {
      let item = allItems[index];

      if (item.value === null) {
        continue;
      }

      let itemRelativePath = item.value.relativePath;

      // is it the item which was renamed ?
      if (UtilsService.isPathEqual(itemRelativePath, oldRelativePath)) {
        targetItem = item;
        // updating relative path and label
        item.value.label = data.newLabel;
        item.value.relativePath = data.newRelativePath;
        item.label = this.makeItemLabel(item.value);
        this.tree.updateItem(item, item);

        if (data.isDir === true) {
          continue;
        } else {
          return targetItem;
        }
      }

      // is subdir ?
      if (itemRelativePath.indexOf(oldRelativePath) === 0) {
        item.value.relativePath = data.newRelativePath + item.value.relativePath.substr(data.oldRelativePath.length);
        item.label = this.makeItemLabel(item.value);
        this.tree.updateItem(item, item);
      }
    }

    return targetItem;
  }

  renameInner(data: any) {
    // send message to tabs to rename relative the item
    this.messageService.sendMessage(MESSAGE_TYPE.ITEM_MOVED, data);

    // rename relative path for all items in tree
    let targetItem = this.renameInnerInner(data);
    const targetParentItem = targetItem.parentElement === null ? undefined : targetItem.parentElement;

    // after item renamed it should be put to the proper position in the tree in alphabet order, so we need to clone this item, put it to the proper position and remove older item
    if (targetItem.value.isDir === true) {
      let cloneItem = StorageExplorerComponent.makeDirItem(targetItem.value.relativePath, targetItem.value.label, targetItem.items, targetItem.value.mustLoadChildsItems);
      const changedFilesList = [];
      cloneItem.items = this.collectChildItemsAndFixPathIfNeeded(targetItem, targetItem, undefined, changedFilesList);
      this.insertDirItem(cloneItem, targetParentItem);
      this.updateItems(changedFilesList);
    } else {
      let cloneItem = StorageExplorerComponent.makeFileItem(targetItem.value.relativePath, targetItem.value.label, true, true);
      this.insertFileItemInner(cloneItem, targetParentItem);
    }

    // removing older item
    this.tree.removeItem(targetItem);

    this.globalComponentsService.loader.close();
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
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `The [${newLabel}] file name contains forbidden characters`);
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

      const params = {
        relativePath: this.rightClickSelectedElement.value.relativePath,
        newRelativePath: data.newRelativePath
      };

      this.httpClient.post<any>(REST_URLS.STORAGE.URLS.RENAME, params).subscribe(
        () => {
          this.renameInner(data);
        },
        (err) => {
          this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to rename item. Reason : [${err.statusText}]`);
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

  newDirInner(newDirName: string) {
    if (newDirName === undefined) {
      return;
    }

    if (!UtilsService.isFileNameValid(newDirName)) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `The [${newDirName}] directory name contains forbidden characters`);
      return;
    }

    const newDirRelativePath = this.getRightClickDirPath() + UtilsService.SERVER_INFO.SLASH + newDirName;

    if (this.findItemByRelativePath(newDirRelativePath) !== undefined) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `The [${newDirRelativePath}] item is already exists`);
      return;
    }

    this.globalComponentsService.loader.open();

    let param = {
      relativePath: newDirRelativePath
    };
    this.httpClient.post<any>(REST_URLS.STORAGE.URLS.MAKE_DIR, param).subscribe(
      () => {
        this.insertDirItem(StorageExplorerComponent.makeEmptyDirItem(newDirRelativePath, newDirName), this.rightClickSelectedElement);
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to create a new directory. Reason : [${err.statusText}]`);
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

    const params = {
      relativePath: targetItem.value.relativePath
    };
    this.httpClient.post<any>(REST_URLS.STORAGE.URLS.DELETE, params).subscribe(
      () => {
        this.tree.removeItem(targetItem);
        this.closeDeletedTabs(targetItem.value);
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to delete an item. Reason : [${err.statusText}]`);
      }
    );
  }

  updateSelectExpandItem(item: any) {
    const treeItem = this.findItemByRelativePath(item.value.relativePath);
    this.updateItem(item.value);
    this.tree.selectItem(treeItem);
    this.tree.ensureVisible(treeItem.element);
  }

  sendOpenNewTabMessage(item, text?: string) {
    this.messageService.sendMessage(MESSAGE_TYPE.OPEN_NEW_TAB, {
      relativePath: item.value.relativePath,
      label: item.value.label,
      body: text === undefined ? '' : text
    });
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

  newFileInner(newFileName: string, filePath: string) {
    if (newFileName === undefined) {
      return;
    }

    if (!UtilsService.isFileNameValid(newFileName)) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `The [${newFileName}] file name contains forbidden characters`);
      return;
    }

    const item: any = StorageExplorerComponent.makeNewFileItem(filePath, newFileName);

    if (this.findItemByRelativePath(item.value.relativePath) !== undefined) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `The [${item.value.relativePath}] item is already exists`);
      return;
    }

    this.insertFileItemInner(item, this.rightClickSelectedElement);
    this.updateSelectExpandItem(item);
    this.sendOpenNewTabMessage(item);

    return item;
  }

  newFile() {
    if (this.hasWritePermission !== true) {
      return;
    }

    this.globalComponentsService.inputBox.open('New file creation', 'File name', '', (newFileName: string) => {
      this.newFileInner(newFileName, this.getRightClickDirPath());
    });
  }

  private handleRightClick(target: any, event: any) {
    // is right click on empty area ?
    if (target === undefined) {
      this.popupMenu.disable('popup-delete-item', true);
      this.popupMenu.disable('popup-rename-item', true);
      this.popupMenu.disable('popup-show-information', true);
      this.popupMenu.disable('find-in-files-from-here', !this.hasReadPermission);
      this.popupMenu.disable('popup-make-a-copy', true);
      this.rightClickSelectedElement = undefined;
      this.openPopup(event);
    } else {
      this.popupMenu.disable('popup-delete-item', !this.hasWritePermission);
      this.popupMenu.disable('popup-rename-item', !this.hasWritePermission);
      this.tree.selectItem(target);
      this.tree.ensureVisible(target.element);
      this.rightClickSelectedElement = this.tree.getItem(target);
      this.popupMenu.disable('find-in-files-from-here', this.rightClickSelectedElement.value.isDir !== true);
      this.popupMenu.disable('popup-make-a-copy', !this.hasWritePermission || this.rightClickSelectedElement.value.isDir === true);
      this.popupMenu.disable('popup-show-information', false);
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

  private handleLeftClick(target: any, event: any) {
    this.popupMenu.close();

    if (target === undefined) {
      return;
    }

    let item: any = this.tree.getItem(target);
    if (item.value.isDir === true) {
      return;
    }

    this.messageService.sendMessage(MESSAGE_TYPE.LOAD_FILE_FROM_STORAGE, {
      relativePath: item.value.relativePath
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
    const item2Add: any = StorageExplorerComponent.makeNewFileItem(data.dropPath, data.item2Move.value.label);
    item2Add.value.isChanged = data.item2Move.value.isChanged;
    item2Add.value.isNewFile = data.item2Move.value.isNewFile;

    // adding to the
    this.insertFileItemInner(item2Add, data.dropItem);
    this.updateSelectExpandItem(item2Add);
  }

  treeItem2Json(item: any) {
    let label;
    if (item.value === null || item.value === undefined) {
      label = item.label;
    } else {
      label = item.value.label;
    }

    const result: any = {
      label: label,
      icon: item.icon,
    };

    result.value = item.value;

    return result;
  }

  fixItemRelativePathIfNeeded(item: any, rootItem: any, droppedItemRelativePath: string) {
    if (droppedItemRelativePath === undefined) {
      return;
    }

    if (item.value === null || item.value === undefined) {
      return;
    }
    item.value.relativePath = droppedItemRelativePath + UtilsService.SERVER_INFO.SLASH + rootItem.value.label + item.value.relativePath.substr(rootItem.value.relativePath.length);
  }

  collectChildItemsAndFixPathIfNeeded(rootItem: any, subItem: any, droppedItemRelativePath: string, changedFilesList: string[]) {
    const result = [];
    const firstLevelItems = this.getFirstLevelChildren(subItem);

    for (let index = 0; index < firstLevelItems.length; index++) {
      let item: any = firstLevelItems[index];

      item = this.treeItem2Json(firstLevelItems[index]);

      if (item.value !== undefined && item.value !== null && item.value.isDir === true) {
        item.items = this.collectChildItemsAndFixPathIfNeeded(rootItem, this.findItemByRelativePath(item.value.relativePath), droppedItemRelativePath, changedFilesList);
      }

      this.fixItemRelativePathIfNeeded(item, rootItem, droppedItemRelativePath);

      if (item.value !== undefined && item.value !== null && item.value.isNewFile === true) {
        changedFilesList.push(item);
      }

      result.push(item);
    }

    return result;
  }

  moveDirItem(data: any) {
    // creating root item
    const item2Add: any = StorageExplorerComponent.makeEmptyDirItem(data.targetRelativePath, data.item2Move.value.label);

    // collecting existing items under the item2Move item
    const changedFilesList = [];
    item2Add.items = this.collectChildItemsAndFixPathIfNeeded(data.item2Move, data.item2Move, data.dropPath, changedFilesList);
    item2Add.value.mustLoadChildItems = data.item2Move.value.mustLoadChildItems;

    // adding to the
    this.insertDirItem(item2Add, data.dropItem);

    // updating changed files
    this.updateItems(changedFilesList);
  }

  moveItemInnerInner(data) {
    if (data.item2Move.value.isDir === true) {
      this.moveDirItem(data);
    } else {
      this.moveFileItem(data);
    }

    this.tree.removeItem(data.item2Move);

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
      this.globalComponentsService.messageBox.openSimple('Error', 'The [' + data.dropPath + UtilsService.SERVER_INFO.SLASH + '] directory already contains a [' + data.item2Move.value.label + '] item');
      return;
    }

    this.globalComponentsService.loader.open();

    // new files don't need to be moved in file system
    if (data.item2Move.value.isNewFile === true) {
      this.moveItemInnerInner(data);
      return;
    }

    const params = {
      source: data.item2Move.value.relativePath,
      dest: data.dropPath
    };

    this.httpClient.post<any>(REST_URLS.STORAGE.URLS.MOVE, params).subscribe(
      () => {
        this.moveItemInnerInner(data);
      },
      (err) => {
        console.log(err);
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, err.statusText);
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

    this.moveItemInner(data);
  }

  onDragEnd: any = (item2Move, dropItem, args, dropPosition, tree) => {
    // does use have write permissions ?
    if (this.hasWritePermission !== true) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, 'No write permissions to move an item');
      return false;
    }

    const dropPath = this.resolveTargetPathForDragAndDrop(dropItem, dropPosition);

    // are item and dropItem on same directory level ?
    if (dropPath === UtilsService.resolvePathOnly(item2Move.value.label, item2Move.value.relativePath)) {
      return false;
    }

    // is same item ?
    if (dropPath === item2Move.value.relativePath) {
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

  findInFilesFromHere() {
    if (!this.hasReadPermission) {
      return;
    }

    const findFrom = this.rightClickSelectedElement === undefined ? '' : this.rightClickSelectedElement.value.relativePath;
    this.messageService.sendMessage(MESSAGE_TYPE.FIND_IN_FILES, findFrom);
  }

  makeACopyInner(newFileName: string, targetItem: string) {
    if (newFileName === undefined) {
      return;
    }

    if (newFileName === targetItem) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, 'Choose a different file name to make a copy');
      return;
    }

    if (!UtilsService.isFileNameValid(newFileName)) {
      this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `The [${newFileName}] file name contains forbidden characters`);
      return;
    }

    const newItem = this.newFileInner(newFileName, this.getRightClickDirPath());
    // not really created ? exit
    if (newItem === undefined) {
      return;
    }

    const sourceRelativePath = this.rightClickSelectedElement.value.relativePath;
    const targetRelativePath = newItem.value.relativePath;

    // is targetItem in tabsMap ?
    const source = this.tabsMap[sourceRelativePath];
    if (source !== undefined) {
      const fileContent = source.getFileContent();
      // updating tab content
      this.messageService.sendMessage(MESSAGE_TYPE.SET_TAB_CONTENT, {
        relativePath: targetRelativePath,
        content: fileContent
      });
      return;
    }

    // loading file content and updating a newFile
    this.globalComponentsService.loader.open();
    this.http.post({relativePath: sourceRelativePath}, REST_URLS.STORAGE.URLS.LOAD_FILE_FROM_STORAGE, 'json').subscribe(
      (content: any) => {
        this.messageService.sendMessage(MESSAGE_TYPE.SET_TAB_CONTENT, {
          relativePath: targetRelativePath,
          content: content.body[DI_CONSTANTS.FILE_BODY]
        });
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Failed to load a [${sourceRelativePath}] JavaScript file content. Reason : [${err.statusText}]`);
        console.log(err);
      }
    );
  }

  makeACopy() {
    if (this.rightClickSelectedElement === undefined || this.rightClickSelectedElement.value === null || this.rightClickSelectedElement.value.isDir === true) {
      return;
    }

    if (!this.hasWritePermission) {
      return;
    }

    const targetItem = this.rightClickSelectedElement.value.label;
    this.globalComponentsService.inputBox.open('Making a copy', `Making a copy of the [${targetItem}]`, targetItem, (newFileName: string) => {
      this.makeACopyInner(newFileName, targetItem);
    });
  }

  storeChangedTab(data) {
    if (data.isChanged !== true) {
      delete this.tabsMap[data.relativePath];
      return;
    }

    this.tabsMap[data.relativePath] = data;
  }

  autoscroll2Item(relativePath: string) {
    const item = this.findItemByRelativePath(relativePath);

    if (item === undefined) {
      return;
    }

    this.tree.expandItem(item);
    this.tree.expandItem(item.element); // don't know why, but without this additional command sometimes it doesn't work...
    setTimeout(_ => {
      // todo : jqx bug -> https://www.jqwidgets.com/community/topic/ensurevisible-is-showing-only-50-of-item-when-horizontal-scroll-bar-is-visible
      const nextItem = item.nextItem === null ? item : item.nextItem;
      this.tree.ensureVisible(nextItem.element);
      this.tree.selectItem(item);
    }, 1300);
  }

  tabSelected(relativePath: any) {
    if (AppearanceService.load()['autoscroll-from-source']) {
      this.autoscroll2Item(relativePath);
    }
  }

  showInformation() {
    this.messageService.sendMessage(MESSAGE_TYPE.SHOW_FILE_DIR_INFORMATION, this.rightClickSelectedElement.value);
  }
}
