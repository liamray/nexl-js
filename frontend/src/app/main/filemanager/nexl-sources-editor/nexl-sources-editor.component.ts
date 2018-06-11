import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxTabsComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs";
import {HttpRequestService} from "../../services/http.requests.service";
import {GlobalComponentsService} from "../../services/global-components.service";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import * as $ from 'jquery';
import {LocalStorageService, SAVE_JS_FILE_CONFIRM, TABS} from "../../services/localstorage.service";
import {UtilsService} from "../../services/utils.service";
import {AppearanceService} from "../../services/appearance.service";

const TAB_CONTENT = 'tabs-content-';
const TITLE_ID = 'tabs-title-';
const TITLE_TOOLTIP = 'tabs-title-tooltip-';
const TITLE_TEXT = 'tabs-title-text-';
const TITLE_MODIFICATION_ICON = 'tabs-title-modification-icon-';
const TITLE_CLOSE_ICON = 'tabs-title-close-icon-';
const TITLE_READ_ONLY_ICON = 'tabs-title-lock-icon-';
const ATTR_IS_NEW_FILE = 'is-new-file';
const ID_SEQ_NR = 'id-seq-nr';
const RELATIVE_PATH = 'relative-path';
const IS_CHANGED = 'is-changed';
const TRUE = true.toString();

@Component({
  selector: '.app-nexl-sources-editor',
  templateUrl: './nexl-sources-editor.component.html',
  styleUrls: ['./nexl-sources-editor.component.css'],
})
export class NexlSourcesEditorComponent implements AfterViewInit {
  @ViewChild('tabs') tabs: jqxTabsComponent;

  idSeqNr = 0;
  hasReadPermission = false;
  hasWritePermission = false;

  fontSize: string;

  constructor(private http: HttpRequestService, private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(message => {
      this.handleMessages(message);
    });
  }

  static obj2Array(obj: any) {
    let result = [];
    for (let key in obj) {
      result.push(key + '="' + obj[key] + '"');
    }
    return result.join(' ');
  }

  handleMessages(message) {
    switch (message.type) {
      case MESSAGE_TYPE.AUTH_CHANGED: {
        this.updateTabsPermissions(message.data);
        return;
      }

      case MESSAGE_TYPE.OPEN_JS_FILE: {
        this.openJSFile(message.data);
        return;
      }

      case MESSAGE_TYPE.CONTENT_AREA_RESIZED: {
        this.resizeAce();
        return;
      }

      case MESSAGE_TYPE.CLOSE_DELETED_TABS: {
        this.closeDeletedTabs(message.data);
        return;
      }

      case MESSAGE_TYPE.SAVE_JS_FILE: {
        this.saveJSFile(message.data);
        return;
      }

      case MESSAGE_TYPE.CLOSE_ALL_TABS: {
        this.closeAllTabs();
        return;
      }

      case MESSAGE_TYPE.CREATE_JS_FILE: {
        this.createNexlSource(message.data);
        return;
      }

      case MESSAGE_TYPE.ITEM_MOVED: {
        this.itemMoved(message.data);
        return;
      }

      case MESSAGE_TYPE.REQUEST_CURRENT_TAB: {
        this.sendCurrentTabInfo(message.data);
        return;
      }

      case MESSAGE_TYPE.UPDATE_UI: {
        this.updateUI();
        return;
      }
    }
  }

  loadUISettings() {
    const appearanceData = AppearanceService.load();
    this.fontSize = appearanceData['font-size'];
  }

  updateUI() {
    this.loadUISettings();
    for (let index = 0; index < this.tabs.length(); index++) {
      const id = this.resolveTabAttr(index, 'id');
      ace.edit(id).setOptions({
        fontSize: this.fontSize + 'pt'
      });
    }
  }

  isTabChanged(idSeqNr: string | number) {
    return $('#' + TITLE_ID + idSeqNr).attr(IS_CHANGED) === TRUE;
  }

  setTabChanged(idSeqNr: string | number, isChanged: boolean) {
    $('#' + TITLE_ID + idSeqNr).attr(IS_CHANGED, isChanged);

    // sending message to tree
    this.messageService.sendMessage(MESSAGE_TYPE.TAB_CONTENT_CHANGED, {
        isChanged: isChanged,
        relativePath: this.getTabContentAttr(idSeqNr, RELATIVE_PATH)
      }
    );
  }

  isNewFile(idSeqNr: string | number) {
    return $('#' + TITLE_ID + idSeqNr).attr(ATTR_IS_NEW_FILE) === TRUE;
  }

  setNewFile(idSeqNr: string | number, isNewFile: boolean) {
    $('#' + TITLE_ID + idSeqNr).attr(ATTR_IS_NEW_FILE, isNewFile);

    // sending message to tree
    this.messageService.sendMessage(MESSAGE_TYPE.TAB_CONTENT_CHANGED, {
        isNewFile: isNewFile,
        relativePath: this.getTabContentAttr(idSeqNr, RELATIVE_PATH)
      }
    );
  }

  getTabContent(idSeqNr: string) {
    return ace.edit(TAB_CONTENT + idSeqNr).getValue();
  }

  getTooltipText(idSeqNr: string | number) {
    return $('#' + TITLE_TOOLTIP + idSeqNr).text();
  }

  setTooltipText(idSeqNr: string | number, text: string) {
    return $('#' + TITLE_TOOLTIP + idSeqNr).text(text);
  }

  getTitleText(idSeqNr: string | number) {
    return $('#' + TITLE_TEXT + idSeqNr).text();
  }

  setTitleText(idSeqNr: string | number, text: string) {
    return $('#' + TITLE_TEXT + idSeqNr).text(text);
  }

  sendCurrentTabInfo(shortInfo: boolean) {
    const tabNr = this.tabs.val();
    if (tabNr < 0) {
      // sending empty data
      this.messageService.sendMessage(MESSAGE_TYPE.GET_CURRENT_TAB);
      return;
    }

    const data: any = {
      relativePath: this.resolveTabAttr(tabNr, RELATIVE_PATH)
    };

    const idSeqNr = this.resolveTabAttr(tabNr, ID_SEQ_NR);

    if (this.isTabChanged(idSeqNr)) {
      data.nexlSourceContent = this.getTabContent(idSeqNr);
    }

    this.messageService.sendMessage(MESSAGE_TYPE.GET_CURRENT_TAB, data);
  }

  fileMoved(data: any) {
    const tabInfo = this.resolveTabInfoByRelativePath(data.oldRelativePath);
    if (tabInfo === undefined) {
      return;
    }

    this.setTabTitleAttr(tabInfo.index, RELATIVE_PATH, data.newRelativePath);
    this.setTabContentAttr(tabInfo.idSeqNr, RELATIVE_PATH, data.newRelativePath);
    this.setTitleText(tabInfo.idSeqNr, data.newLabel);
    this.setTooltipText(tabInfo.idSeqNr, data.newRelativePath);
  }

  dirMoved(data: any) {
    // iterating over opened tabs
    const oldRelativePath = data.oldRelativePath;

    for (let index = 0; index < this.tabs.length(); index++) {
      let tabRelativePath = this.resolveTabAttr(index, RELATIVE_PATH);
      let idSeqNr = this.resolveTabAttr(index, ID_SEQ_NR);

      if (UtilsService.pathIndexOf(tabRelativePath, oldRelativePath) !== 0) {
        continue;
      }

      // updating tab
      const relativePath = data.newRelativePath + tabRelativePath.substr(oldRelativePath.length);
      this.setTabTitleAttr(index, RELATIVE_PATH, relativePath);
      this.setTabContentAttr(idSeqNr, RELATIVE_PATH, relativePath);
      this.setTitleText(idSeqNr, data.newLabel);
      this.setTooltipText(idSeqNr, relativePath);
    }
  }

  itemMoved(data) {
    if (data.isDir === true) {
      this.dirMoved(data);
    } else {
      this.fileMoved(data);
    }
  }

  createNexlSource(data) {
    const nexlSource = this.loadNexlSourceInner(data);
    this.changeFileStatus(nexlSource.idSeqNr, true);
    this.setNewFile(nexlSource.idSeqNr, true);
  }

  closeAllTabs() {
    let promise: any = Promise.resolve();

    for (let tabNr = this.tabs.length() - 1; tabNr >= 0; tabNr--) {
      const idSeqNr = this.resolveTabAttr(tabNr, ID_SEQ_NR);
      promise = promise.then(() => this.closeTabInner(idSeqNr));
    }
  }

  changeFileStatus(idSeqNr: any, isChanged: boolean) {
    // is already updated ?
    if (this.isTabChanged(idSeqNr) === isChanged) {
      return;
    }

    $('#' + TITLE_MODIFICATION_ICON + idSeqNr).css('display', isChanged ? 'inline-block' : 'none');
    this.setTabChanged(idSeqNr, isChanged);
  }

  saveJSFile(relativePath: string) {
    if (!this.hasWritePermission) {
      return;
    }

    if (relativePath === undefined) {
      const tabNr = this.tabs.val();
      if (tabNr < 0) {
        return;
      }

      relativePath = this.resolveTabAttr(tabNr, RELATIVE_PATH);
    }

    if (LocalStorageService.loadRaw(SAVE_JS_FILE_CONFIRM) === false.toString()) {
      this.saveNexlSourceInner(relativePath);
      return;
    }

    // confirming...
    const opts = {
      title: 'Confirm save',
      label: 'Please note you can test your changes without saving the file. If you save this file it will immediately affect all REST requests related to the file. Are you sure you want to save ?',
      checkBoxText: 'Don\'t show it again',
      callback: (callbackData: any) => {
        LocalStorageService.storeRaw(SAVE_JS_FILE_CONFIRM, !callbackData.checkBoxVal);
        if (callbackData.isConfirmed === true) {
          this.saveNexlSourceInner(relativePath);
        }
      },
    };

    this.globalComponentsService.confirmBox.open(opts);
  }

  saveNexlSourceInner(relativePath: string, callback?: (boolean) => void) {
    const tabInfo = this.resolveTabInfoByRelativePath(relativePath);
    const content = this.getTabContent(tabInfo.idSeqNr);

    this.globalComponentsService.loader.open();

    this.http.post({relativePath: relativePath, content: content}, '/sources/save-nexl-source', 'text').subscribe(
      (content: any) => {
        this.globalComponentsService.notification.openSuccess('File saved !');
        this.globalComponentsService.loader.close();
        this.changeFileStatus(tabInfo.idSeqNr, false);
        this.setNewFile(tabInfo.idSeqNr, false);
        if (callback !== undefined) {
          callback(true);
        }
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to save nexl source\nReason : ' + err.statusText);
        console.log(err);
        if (callback !== undefined) {
          callback(false);
        }
      }
    );
  }

  closeDeletedTabs4Dir(relativePath: string) {
    // adding slash to the end
    relativePath = relativePath + UtilsService.SERVER_INFO.SLASH;

    const tabsLength = this.tabs.length();
    for (let index = tabsLength - 1; index >= 0; index--) {
      let tabsRelativePath = this.resolveTabAttr(index, RELATIVE_PATH);

      if (UtilsService.pathIndexOf(tabsRelativePath, relativePath) === 0) {
        const idSeqNr = this.resolveTabAttr(index, ID_SEQ_NR);
        this.closeTabInnerInner(idSeqNr);
      }
    }
  }

  closeDeletedTabs4File(relativePath: string) {
    for (let index = 0; index < this.tabs.length(); index++) {
      let tabsRelativePath = this.resolveTabAttr(index, RELATIVE_PATH);
      if (UtilsService.isPathEqual(tabsRelativePath, relativePath)) {
        const idSeqNr = this.resolveTabAttr(index, ID_SEQ_NR);
        this.closeTabInnerInner(idSeqNr);
        return;
      }
    }
  }

  closeDeletedTabs(data: any) {
    if (data.isDir === true) {
      this.closeDeletedTabs4Dir(data.relativePath);
    } else {
      this.closeDeletedTabs4File(data.relativePath);
    }
  }

  getAceTheme() {
    return this.hasWritePermission ? 'ace/theme/xcode' : 'ace/theme/xcode';
  }

  writePermissionChanged() {
    for (let index = 0; index < this.tabs.length(); index++) {
      const id = this.resolveTabAttr(index, 'id');
      let idSeqNr = this.resolveTabAttr(index, ID_SEQ_NR);

      // updating ace editor
      ace.edit(id).setReadOnly(!this.hasWritePermission);
      ace.edit(id).setTheme(this.getAceTheme());

      // read only icon
      $('#' + TITLE_READ_ONLY_ICON + idSeqNr).css('display', this.hasWritePermission ? 'none' : 'inline-block');
    }
  }

  updateTabsPermissions(data: any) {
    if (data.hasWritePermission !== this.hasWritePermission) {
      this.hasWritePermission = data.hasWritePermission;
      this.writePermissionChanged();
    }

    if (data.hasReadPermission !== this.hasReadPermission) {
      this.hasReadPermission = data.hasReadPermission;
    }
  }

  resizeAce() {
    setTimeout(() => {
      // iterating over tabs
      for (let index = 0; index < this.tabs.length(); index++) {
        const id = this.resolveTabAttr(index, 'id');
        ace.edit(id).resize();
      }
    }, 200);
  }

  resolveTabAttr(tabNr: number, attrName: string) {
    return this.tabs.getContentAt(tabNr).firstElementChild.getAttribute(attrName);
  }

  private setTabContentAttr(idSeqNr: string, key: string, value: string) {
    $('#' + TAB_CONTENT + idSeqNr).attr(key, value);
  }

  private getTabContentAttr(idSeqNr: string | number, key: string) {
    return $('#' + TAB_CONTENT + idSeqNr).attr(key);
  }

  setTabTitleAttr(tabNr: number, attrName: string, attrValue: string) {
    this.tabs.getContentAt(tabNr).firstElementChild.setAttribute(attrName, attrValue);
  }

  resolveTabInfoByRelativePath(relativePath: string): any {
    for (let index = 0; index < this.tabs.length(); index++) {
      const path = this.resolveTabAttr(index, RELATIVE_PATH);
      if (UtilsService.isPathEqual(path, relativePath)) {
        return {
          id: this.resolveTabAttr(index, 'id'),
          index: index,
          relativePath: path,
          idSeqNr: this.resolveTabAttr(index, ID_SEQ_NR)
        };
      }
    }
  }

  resolveTabByRelativePath(relativePath: string): number {
    const tabInfo = this.resolveTabInfoByRelativePath(relativePath);
    return tabInfo === undefined ? -1 : tabInfo.index;
  }

  openJSFile(data: any) {
    // is tab already opened ?
    const tabInfo = this.resolveTabInfoByRelativePath(data.relativePath);
    if (tabInfo !== undefined && tabInfo.index >= 0) {
      this.tabs.val(tabInfo.index + '');
      return;
    }

    this.globalComponentsService.loader.open();

    // loading file content by relativePath
    this.http.post({relativePath: data.relativePath}, '/sources/load-nexl-source', 'text').subscribe(
      (content: any) => {
        data.body = content.body;
        this.loadNexlSourceInner(data);
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to read nexl source content\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }

  ngAfterViewInit(): void {
    this.loadUISettings();
    this.tabs.scrollPosition('both');
    this.tabs.removeFirst();
    ace.config.set('basePath', 'nexl/site/ace');
  }

  makeTitle(data: any) {
    const modified = `<span style="color:red;display: none;" id="${TITLE_MODIFICATION_ICON}${data.idSeqNr}">*&nbsp;</span>`;
    const theTitle = `<span style="position:relative; top: -2px;" id="${TITLE_TEXT}${data.idSeqNr}">${data.label}</span>`;
    const readOnlyIconDisplay = this.hasWritePermission ? 'none' : 'inline-block';
    const readOnlyIcon = `<img style="position:relative; top: 1px; margin-right: 3px;display:${readOnlyIconDisplay}" src="./nexl/site/images/lock.png" id="${TITLE_READ_ONLY_ICON}${data.idSeqNr}"/>`;
    const closeIcon = `<img style="position:relative; top: 2px; left: 4px;" src="./nexl/site/images/close-tab.png" id="${TITLE_CLOSE_ICON}${data.idSeqNr}"/>`;
    const attrs = {
      id: `${TITLE_ID}${data.idSeqNr}`
    };
    attrs[ID_SEQ_NR] = data.idSeqNr;
    return '<span ' + NexlSourcesEditorComponent.obj2Array(attrs) + '>' + modified + readOnlyIcon + theTitle + closeIcon + '</span>';
  }

  makeBody(data: any) {
    const attrs = {
      id: `${TAB_CONTENT}${data.idSeqNr}`
    };

    attrs[ID_SEQ_NR] = data.idSeqNr;
    attrs[RELATIVE_PATH] = data.relativePath;

    return '<div ' + NexlSourcesEditorComponent.obj2Array(attrs) + '>' + data.body + '</div>';
  }

  closeTabInnerInner(idSeqNr: number) {
    const relativePath = this.getTabContentAttr(idSeqNr, RELATIVE_PATH);

    // destroying tooltip
    jqwidgets.createInstance($('#' + TITLE_ID + idSeqNr), 'jqxTooltip').destroy();
    // destroying ace
    ace.edit(TAB_CONTENT + idSeqNr).destroy();
    // removing tab
    this.tabs.removeAt(this.resolveTabByRelativePath(relativePath));

    // notifying
    this.messageService.sendMessage(MESSAGE_TYPE.TAB_CLOSED, relativePath);
  }

  closeTab(event: any) {
    const idSeqNr = event.target.parentElement.getAttribute(ID_SEQ_NR);
    this.closeTabInner(idSeqNr).then();
  }

  closeTabInner(idSeqNr: number) {
    return new Promise((resolve, reject) => {
      const relativePath = this.getTabContentAttr(idSeqNr, RELATIVE_PATH);

      if (!this.isTabChanged(idSeqNr)) {
        this.closeTabInnerInner(idSeqNr);
        resolve();
        return;
      }

      const opts = {
        label: 'The [' + relativePath + '] file contains unsaved data. Are you sure you want to close it and lose all changes ?',
        title: 'File close confirmation',
        callback: (callbackData: any) => {
          if (callbackData.isConfirmed === true) {
            const tabInfo = this.resolveTabInfoByRelativePath(relativePath);
            this.changeFileStatus(tabInfo.idSeqNr, false);
            this.closeTabInnerInner(idSeqNr);
          }

          resolve();
        }
      };

      this.globalComponentsService.confirmBox.open(opts);
    });
  }

  bindTitle(data: any) {
    // binding close action
    $(`#${TITLE_CLOSE_ICON}${data.idSeqNr}`).click((event) => {
      this.closeTab(event);
    });

    // binding tooltip
    jqwidgets.createInstance($(`#${TITLE_ID}${data.idSeqNr}`), 'jqxTooltip', {
      content: `<div style="height: 8px;"></div>Path : [<span style="cursor: pointer; text-decoration: underline" id="${TITLE_TOOLTIP}${data.idSeqNr}">${data.relativePath}</span>]`,
      position: 'mouse',
      closeOnClick: false,
      autoHide: false,
      autoHideDelay: 99999,
      animationShowDelay: 400,
      showDelay: 600,
      trigger: 'hover',
      height: '40px'
    });

    // binding click on tool tip
    $(`#${TITLE_TOOLTIP}${data.idSeqNr}`).click(
      () => {
        this.messageService.sendMessage(MESSAGE_TYPE.SELECT_ITEM_IN_TREE, this.getTooltipText(data.idSeqNr));
      });
  }

  bindBody(data: any) {
    const aceEditor = ace.edit(`${TAB_CONTENT}${data.idSeqNr}`);

    aceEditor.setOptions({
      fontSize: this.fontSize + 'pt',
      autoScrollEditorIntoView: true,
      theme: this.getAceTheme(),
      mode: 'ace/mode/javascript',
      readOnly: !this.hasWritePermission
    });

    aceEditor.$blockScrolling = Infinity;
    aceEditor.resize();

    aceEditor.on("change", (event) => {
      this.changeFileStatus(data.idSeqNr, true);
    });
  }

  loadNexlSourceInner(data: any) {
    this.idSeqNr++;
    data.idSeqNr = this.idSeqNr;

    const title = this.makeTitle(data);
    const body = this.makeBody(data);
    this.tabs.addLast(title, body);
    this.sendTabsCountMsg();

    this.bindTitle(data);
    this.bindBody(data);

    return data;
  }

  onTabSelect(event: any) {
    const idSeqNr = this.resolveTabAttr(event.args.item, ID_SEQ_NR);
    ace.edit(TAB_CONTENT + idSeqNr).focus();

    const relativePath = this.getTabContentAttr(idSeqNr, RELATIVE_PATH);
    this.messageService.sendMessage(MESSAGE_TYPE.TAB_SELECTED, relativePath);
  }

  sendTabsCountMsg() {
    this.messageService.sendMessage(MESSAGE_TYPE.TABS_COUNT_CHANGED, this.tabs.length());
  }

  saveTabs() {
    const tabs2Save = [];

    // iterating over tabs and gathering info
    for (let index = 0; index < this.tabs.length(); index++) {
      const tab = {};

      let tabRelativePath = this.resolveTabAttr(index, RELATIVE_PATH);
      let idSeqNr = this.resolveTabAttr(index, ID_SEQ_NR);
      tab[RELATIVE_PATH] = tabRelativePath;
      tab[ATTR_IS_NEW_FILE] = this.isNewFile(idSeqNr);
      tab[IS_CHANGED] = this.isTabChanged(idSeqNr);
      if (tab[IS_CHANGED]) {
        tab['tab-content'] = this.getTabContent(idSeqNr);
      }

      tabs2Save.push(tab);
    }

    // saving in local storage
    LocalStorageService.storeObj(TABS, tabs2Save);
  }
}
