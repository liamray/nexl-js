import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxTabsComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtabs";
import {HttpRequestService} from "../../../services/http.requests.service";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import * as $ from 'jquery';

@Component({
  selector: '.app-nexl-sources-editor',
  templateUrl: './nexl-sources-editor.component.html',
  styleUrls: ['./nexl-sources-editor.component.css'],
})
export class NexlSourcesEditorComponent implements AfterViewInit {
  @ViewChild('nexlSourcesTabs') nexlSourcesTabs: jqxTabsComponent;

  id = 0;
  tabItems = {};

  constructor(private http: HttpRequestService, private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(message => {
      this.handleMessages(message);
    });
  }

  handleMessages(message) {
    if (message.type === MESSAGE_TYPE.OPEN_FILE) {
      this.openFile(message.data);
    }

    if (message.type === MESSAGE_TYPE.CONTENT_AREA_RESIZED) {
      setTimeout(() => {
        for (let relativePath in this.tabItems) {
          this.tabItems[relativePath]['ace'].resize();
        }
      }, 200)
    }
  }

  ngAfterViewInit(): void {
    this.nexlSourcesTabs.scrollPosition('both');
    this.nexlSourcesTabs.removeFirst();
  }

  newTabItem(relativePath: string) {
    const title = relativePath.replace(/.*[/\\]/, '');
    this.id++;
    const contentId = 'tabs-content-' + this.id;
    const titleId = 'tabs-title-' + this.id;

    let tabItem = {
      relativePath: relativePath,
      contentId: contentId,
      titleId: titleId,
      // title: '<span id="' + titleId + '"><span style="color: red;" title="Content changed"></span>' + title + '</span>',
      title: '<span id="' + titleId + '"><span style="color: red;" title="Content changed"></span>' + title + '<a href="#"> x</a></span>',
      isJSFile: relativePath.search(/(\.js)$/i) >= 0
    };

    this.tabItems[relativePath] = tabItem;

    return tabItem;
  }

  resolveTabNrByRelativePath(relativePath: string) {
    for (let index = 0; index < this.nexlSourcesTabs.length(); index++) {
      const contentItem = this.nexlSourcesTabs.getContentAt(index);
      if (contentItem.firstElementChild.getAttribute('relative-path') === relativePath) {
        return index;
      }
    }
    return -1;
  }

  resolveRelativePathByTabNr(tabNr: number) {
    const tab = this.nexlSourcesTabs.getContentAt(tabNr);
    return tab.firstElementChild.getAttribute('relative-path');
  }

  unchangeTab(tabNr: number) {
    const relativePath = this.resolveRelativePathByTabNr(tabNr);
    this.tabItems[relativePath]['changed'] = false;
    $('#' + this.tabItems[relativePath]['titleId'] + ' > span').text('');
  }

  openFileInner(relativePath: string, content: any) {
    const tabItem = this.newTabItem(relativePath);
    this.nexlSourcesTabs.addLast(tabItem.title, '<div id="' + tabItem.contentId + '" relative-path="' + relativePath + '">' + content.body + '</div>');

    $('#' + tabItem.titleId + ' > a').click(() => {
      if (this.tabItems[tabItem.relativePath]['changed'] === true) {
        if (!confirm('Save changes ?')) {
          return;
        }
      }

      tabItem['ace'].destroy();
      this.nexlSourcesTabs.removeAt(this.resolveTabNrByRelativePath(tabItem.relativePath));
      delete this.tabItems[tabItem.relativePath];
    });

    ace.config.set('basePath', 'nexl/site/ace');
    const aceEditor = ace.edit(tabItem.contentId);
    tabItem['ace'] = aceEditor;
    aceEditor.setOptions({
      fontSize: "10pt",
      autoScrollEditorIntoView: true,
      theme: "ace/theme/xcode",
      mode: "ace/mode/javascript"
    });
    aceEditor.$blockScrolling = Infinity;
    aceEditor.resize();
    aceEditor.on("change", () => {
      if (this.tabItems[relativePath]['changed'] === true) {
        return;
      }

      this.tabItems[relativePath]['changed'] = true;
      $('#' + this.tabItems[relativePath]['titleId'] + ' > span').text('* ');
    });

    this.globalComponentsService.loader.close();
  }

  openFile(relativePath: string) {
    const tab = this.resolveTabNrByRelativePath(relativePath);
    if (tab >= 0) {
      this.nexlSourcesTabs.val(tab + '');
      return;
    }

    this.globalComponentsService.loader.open();

    this.http.post({relativePath: relativePath}, '/sources/get-source-content', 'text').subscribe(
      (content: any) => {
        this.openFileInner(relativePath, content);
      },
      (err) => {
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openError('Failed to read nexl source content\nReason : ' + err.statusText);
        console.log(err);
      }
    );
  }
}
