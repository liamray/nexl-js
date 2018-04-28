import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxTabsComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs";
import {HttpRequestService} from "../../../services/http.requests.service";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import * as $ from 'jquery';
import {CONFIRMATION_BOX_OPTS} from "../../globalcomponents/confirmbox3/confirmbox3.component";

const TAB_CONTENT = 'tabs-content-';
const TITLE_ID = 'tabs-title-';
const TITLE_TOOLTIP = 'tabs-title-tooltip-';
const TITLE_TEXT = 'tabs-title-text-';
const TITLE_MODIFICATION_ICON = 'tabs-title-modification-icon-';
const TITLE_CLOSE_ICON = 'tabs-title-close-icon-';

@Component({
  selector: '.app-nexl-sources-editor',
  templateUrl: './nexl-sources-editor.component.html',
  styleUrls: ['./nexl-sources-editor.component.css'],
})
export class NexlSourcesEditorComponent implements AfterViewInit {
  @ViewChild('nexlSourcesTabs') nexlSourcesTabs: jqxTabsComponent;

  idSeqNr = 0;
  hasWritePermission = false;

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

      case MESSAGE_TYPE.LOAD_NEXL_SOURCE: {
        this.loadNexlSource(message.data);
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

      case MESSAGE_TYPE.SAVE_NEXL_SOURCE: {
        this.saveNexlSource(message.data);
      }
    }
  }

  markFileAsUnchanged(tabInfo: any) {
    $('#' + TITLE_MODIFICATION_ICON + tabInfo.idSeqNr).css('display', 'none');
    $('#' + TITLE_ID + tabInfo.idSeqNr).attr('is-changed', 'false');

    // sending message to tree
    this.messageService.sendMessage({
      type: MESSAGE_TYPE.TAB_CONTENT_CHANGED,
      data: {
        isChanged: false,
        relativePath: tabInfo.relativePath
      }
    });

  }

  saveNexlSource(relativePath: string) {
    // show save confirmation if needed
    // then call saveNexlSourceInner
    this.saveNexlSourceInner(relativePath);
  }

  saveNexlSourceInner(relativePath: string, callback?: (boolean) => void) {
    if (relativePath === undefined) {
      const tabNr = this.nexlSourcesTabs.val();
      if (tabNr < 0) {
        return;
      }

      relativePath = this.resolveTabAttr(tabNr, 'relative-path');
    }

    const tabInfo = this.resolveTabInfoByRelativePath(relativePath);
    const content = ace.edit(TAB_CONTENT + tabInfo.idSeqNr).getValue();

    this.globalComponentsService.loader.open();

    this.http.post({relativePath: relativePath, content: content}, '/sources/save-nexl-source', 'text').subscribe(
      (content: any) => {
        this.globalComponentsService.notification.openSuccess('File saved !');
        this.globalComponentsService.loader.close();
        this.markFileAsUnchanged(tabInfo);
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
    relativePath += relativePath[0];

    const tabsLength = this.nexlSourcesTabs.length();
    for (let index = tabsLength - 1; index >= 0; index--) {
      if (this.resolveTabAttr(index, 'relative-path').indexOf(relativePath) === 0) {
        const idSeqNr = this.resolveTabAttr(index, 'id-seq-nr');
        this.closeTabInner(idSeqNr);
      }
    }
  }

  closeDeletedTabs4File(relativePath: string) {
    for (let index = 0; index < this.nexlSourcesTabs.length(); index++) {
      if (this.resolveTabAttr(index, 'relative-path') === relativePath) {
        const idSeqNr = this.resolveTabAttr(index, 'id-seq-nr');
        this.closeTabInner(idSeqNr);
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

  updateTabsPermissions(data: any) {
    if (data.hasWritePermission === this.hasWritePermission) {
      return;
    }

    // updating opened tabs
    this.hasWritePermission = data.hasWritePermission;
  }

  resizeAce() {
    setTimeout(() => {
      // iterating over tabs
      for (let index = 0; index < this.nexlSourcesTabs.length(); index++) {
        const id = this.resolveTabAttr(index, 'id');
        ace.edit(id).resize();
      }
    }, 200);
  }

  resolveTabAttr(tabNr: number, attrName: string) {
    return this.nexlSourcesTabs.getContentAt(tabNr).firstElementChild.getAttribute(attrName);
  }

  resolveTabInfoByRelativePath(relativePath: string): any {
    for (let index = 0; index < this.nexlSourcesTabs.length(); index++) {
      const path = this.resolveTabAttr(index, 'relative-path');
      if (path === relativePath) {
        return {
          id: this.resolveTabAttr(index, 'id'),
          index: index,
          relativePath: path,
          idSeqNr: this.resolveTabAttr(index, 'id-seq-nr')
        };
      }
    }
  }

  resolveTabByRelativePath(relativePath: string): number {
    const tabInfo = this.resolveTabInfoByRelativePath(relativePath);
    return tabInfo === undefined ? -1 : tabInfo.index;
  }

  loadNexlSource(data: any) {
    // is tab already opened ?
    const tabInfo = this.resolveTabInfoByRelativePath(data.relativePath);
    if (tabInfo !== undefined && tabInfo.index >= 0) {
      this.nexlSourcesTabs.val(tabInfo.index + '');
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

  makeId(data: any, prefix: string) {
    return prefix + data.idSeqNr;
  }

  ngAfterViewInit(): void {
    this.nexlSourcesTabs.scrollPosition('both');
    this.nexlSourcesTabs.removeFirst();
    ace.config.set('basePath', 'nexl/site/ace');
  }

  makeTitle(data: any) {
    const modified = '<span style="color:red;display: none;" id="' + this.makeId(data, TITLE_MODIFICATION_ICON) + '">*&nbsp;</span>';
    const theTitle = '<span style="position:relative; top: -2px;" id="' + this.makeId(data, TITLE_TEXT) + '">' + data.label + '</span>';
    const closeIcon = '<img style="position:relative; top: 2px; left: 4px;" src="/nexl/site/images/close-tab.png" id="' + this.makeId(data, TITLE_CLOSE_ICON) + '"/>';
    const attrs = {
      id: this.makeId(data, TITLE_ID),
      'id-seq-nr': data.idSeqNr
    };
    return '<span ' + NexlSourcesEditorComponent.obj2Array(attrs) + '>' + modified + theTitle + closeIcon + '</span>';
  }

  makeBody(data: any) {
    const attrs = {
      id: this.makeId(data, TAB_CONTENT),
      'id-seq-nr': data.idSeqNr,
      'relative-path': data.relativePath
    };

    return '<div ' + NexlSourcesEditorComponent.obj2Array(attrs) + '>' + data.body + '</div>';
  }

  closeTabInner(idSeqNr: number) {
    const relativePath = $('#' + TAB_CONTENT + idSeqNr).attr('relative-path');
    // destroying tooltip
    jqwidgets.createInstance($('#' + TITLE_ID + idSeqNr), 'jqxTooltip').destroy();
    // destroying ace
    ace.edit(TAB_CONTENT + idSeqNr).destroy();
    // removing tab
    this.nexlSourcesTabs.removeAt(this.resolveTabByRelativePath(relativePath));
  }

  closeTab(event: any) {
    const idSeqNr = event.target.parentElement.getAttribute('id-seq-nr');
    const relativePath = $('#' + TAB_CONTENT + idSeqNr).attr('relative-path');

    const isChanged = $('#' + TITLE_ID + idSeqNr).attr('is-changed') === 'true';
    if (!isChanged) {
      this.closeTabInner(idSeqNr);
      return;
    }

    const opts = {
      label: 'Do you want to save the changes ?',
      title: 'Tab close confirmation',
      callback: (confirmation: CONFIRMATION_BOX_OPTS) => {
        if (confirmation === CONFIRMATION_BOX_OPTS.CANCEL) {
          return;
        }
        if (confirmation === CONFIRMATION_BOX_OPTS.NO) {
          const tabInfo = this.resolveTabInfoByRelativePath(relativePath);
          this.markFileAsUnchanged(tabInfo);
          this.closeTabInner(idSeqNr);
          return;
        }

        this.saveNexlSourceInner(relativePath, (isOk: boolean) => {
          if (isOk === true) {
            this.closeTabInner(idSeqNr);
          }
        });
      }
    };

    this.globalComponentsService.confirmBox3.open(opts);
  }

  bindTitle(data: any) {
    // binding close action
    $('#' + this.makeId(data, TITLE_CLOSE_ICON)).click((event) => {
      this.closeTab(event);
    });

    // binding tooltip
    jqwidgets.createInstance($('#' + this.makeId(data, TITLE_ID)), 'jqxTooltip', {
      content: '<div style="height: 8px;"></div>Path : [<span style="cursor: pointer; text-decoration: underline" id="' + this.makeId(data, TITLE_TOOLTIP) + '">' + data.relativePath + '</span>]',
      position: 'mouse',
      closeOnClick: true,
      autoHide: true,
      autoHideDelay: 99999,
      animationShowDelay: 400,
      showDelay: 600,
      trigger: 'hover',
      height: '40px'
    });

    // binding click on tool tip
    $('#' + this.makeId(data, TITLE_TOOLTIP)).click(() => {
      this.messageService.sendMessage({
        type: MESSAGE_TYPE.SELECT_ITEM_IN_TREE,
        data: data.relativePath
      });
    });
  }

  bindBody(data: any) {
    const aceEditor = ace.edit(this.makeId(data, TAB_CONTENT));

    aceEditor.setOptions({
      fontSize: "10pt",
      autoScrollEditorIntoView: true,
      theme: "ace/theme/xcode",
      mode: "ace/mode/javascript"
    });

    aceEditor.$blockScrolling = Infinity;
    aceEditor.resize();

    aceEditor.on("change", (event) => {
      if ($('#' + this.makeId(data, TITLE_ID)).attr('is-changed') === 'true') {
        return;
      }

      $('#' + this.makeId(data, TITLE_MODIFICATION_ICON)).css('display', 'inline-block');
      $('#' + this.makeId(data, TITLE_ID)).attr('is-changed', 'true');

      // sending message to tree
      this.messageService.sendMessage({
        type: MESSAGE_TYPE.TAB_CONTENT_CHANGED,
        data: {
          isChanged: true,
          relativePath: data.relativePath
        }
      });
    });
  }

  loadNexlSourceInner(data: any) {
    this.idSeqNr++;
    data.idSeqNr = this.idSeqNr;

    const title = this.makeTitle(data);
    const body = this.makeBody(data);
    this.nexlSourcesTabs.addLast(title, body);
    this.sendTabsCountMsg();

    this.bindTitle(data);
    this.bindBody(data);
  }

  onTabSelect(event: any) {
    const idSeqNr = this.resolveTabAttr(event.args.item, 'id-seq-nr');
    ace.edit(TAB_CONTENT + idSeqNr).focus();
  }

  sendTabsCountMsg() {
    this.messageService.sendMessage({
      type: MESSAGE_TYPE.TABS_COUNT_CHANGED,
      data: this.nexlSourcesTabs.length()
    });
  }
}
