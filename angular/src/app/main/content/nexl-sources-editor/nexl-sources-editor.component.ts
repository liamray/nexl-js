import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxTabsComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs";
import {HttpRequestService} from "../../../services/http.requests.service";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import * as $ from 'jquery';

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

      case MESSAGE_TYPE.OPEN_FILE: {
        this.openFile(message.data);
        return;
      }

      case MESSAGE_TYPE.CONTENT_AREA_RESIZED: {
        this.resizeAce();
        return;
      }
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

  resolveTabByRelativePath(relativePath: string): number {
    for (let index = 0; index < this.nexlSourcesTabs.length(); index++) {
      const path = this.resolveTabAttr(index, 'relative-path');
      if (path === relativePath) {
        return index;
      }
    }

    return -1;
  }

  openFile(data: any) {
    // is tab already opened ?
    const openedTabIndex = this.resolveTabByRelativePath(data.relativePath);
    if (openedTabIndex >= 0) {
      this.nexlSourcesTabs.val(openedTabIndex + '');
      return;
    }

    this.globalComponentsService.loader.open();

    // loading file content by relativePath
    this.http.post({relativePath: data.relativePath}, '/sources/get-source-content', 'text').subscribe(
      (content: any) => {
        data.body = content.body;
        this.openFileInner(data);
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to read nexl source content\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }

  getId4(prefix: string) {
    return prefix + this.idSeqNr;
  }

  ngAfterViewInit(): void {
    this.nexlSourcesTabs.scrollPosition('both');
    this.nexlSourcesTabs.removeFirst();
    ace.config.set('basePath', 'nexl/site/ace');
  }

  makeTitle(data: any) {
    const modified = '<span style="color:red;display: none;" id="' + this.getId4(TITLE_MODIFICATION_ICON) + '">*&nbsp;</span>';
    const theTitle = '<span style="position:relative; top: -2px;" id="' + this.getId4(TITLE_TEXT) + '">' + data.label + '</span>';
    const closeIcon = '<img style="position:relative; top: 2px; left: 4px;" src="/nexl/site/images/close-tab.png" id="' + this.getId4(TITLE_CLOSE_ICON) + '"/>';
    const attrs = {
      id: this.getId4(TITLE_ID),
      'id-seq-nr': this.idSeqNr
    };
    return '<span ' + NexlSourcesEditorComponent.obj2Array(attrs) + '>' + modified + theTitle + closeIcon + '</span>';
  }

  makeBody(data: any) {
    const attrs = {
      id: this.getId4(TAB_CONTENT),
      'is-seq-nr': this.idSeqNr,
      'relative-path': data.relativePath
    };

    return '<div ' + NexlSourcesEditorComponent.obj2Array(attrs) + '>' + data.body + '</div>';
  }

  closeTabInner(idSeqNr: number) {
    const relativePath = $('#' + TAB_CONTENT + idSeqNr).attr('relative-path');
    // destroying tooltip
    jqwidgets.createInstance($('#' + TITLE_ID + idSeqNr), 'jqxTooltip').destroy();
    // destroying ace
    const aceEditor = ace.edit(TAB_CONTENT + idSeqNr).destroy();
    // removing tab
    this.nexlSourcesTabs.removeAt(this.resolveTabByRelativePath(relativePath));
  }

  closeTab(event: any) {
    const idSeqNr = event.target.parentElement.getAttribute('id-seq-nr');

    const isChanged = $('#' + TITLE_ID + idSeqNr).attr('is-changed') === 'true';
    if (!isChanged) {
      this.closeTabInner(idSeqNr);
      return;
    }

    alert('Unsaved data !');
  }

  bindTitle(data: any) {
    // binding close action
    $('#' + this.getId4(TITLE_CLOSE_ICON)).click((event) => {
      this.closeTab(event);
    });

    // binding tooltip action
    jqwidgets.createInstance($('#' + this.getId4(TITLE_ID)), 'jqxTooltip', {
      content: '<div style="height: 8px;"></div>Path : [<span style="cursor: pointer; text-decoration: underline" id="' + this.getId4(TITLE_TOOLTIP) + '">' + data.relativePath + '</span>]',
      position: 'mouse',
      closeOnClick: true,
      autoHide: true,
      autoHideDelay: 99999,
      animationShowDelay: 400,
      showDelay: 600,
      trigger: 'hover',
      height: '40px'
    });

    $('#' + this.getId4(TITLE_TOOLTIP)).click(() => {
      this.messageService.sendMessage({
        type: MESSAGE_TYPE.SELECT_ITEM_IN_TREE,
        data: data.relativePath
      });
    });
  }

  bindBody(data: any) {
    const aceEditor = ace.edit(this.getId4(TAB_CONTENT));

    aceEditor.setOptions({
      fontSize: "10pt",
      autoScrollEditorIntoView: true,
      theme: "ace/theme/xcode",
      mode: "ace/mode/javascript"
    });

    aceEditor.$blockScrolling = Infinity;
    aceEditor.resize();

    aceEditor.on("change", (event) => {
      if ($('#' + this.getId4(TITLE_ID)).attr('is-changed') === 'true') {
        return;
      }

      $('#' + this.getId4(TITLE_MODIFICATION_ICON)).css('display', 'inline-block');
      $('#' + this.getId4(TITLE_ID)).attr('is-changed', 'true');
    });

  }

  openFileInner(data: any) {
    this.idSeqNr++;

    const title = this.makeTitle(data);
    const body = this.makeBody(data);
    this.nexlSourcesTabs.addLast(title, body);

    this.bindTitle(data);
    this.bindBody(data);
  }
}
