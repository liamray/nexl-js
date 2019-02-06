import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {HttpRequestService} from "../../services/http.requests.service";
import {jqxCheckBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox";
import {ICONS} from "../messagebox/messagebox.component";

@Component({
  selector: 'app-findinfiles',
  templateUrl: './findinfiles.component.html',
  styleUrls: ['./findinfiles.component.css']
})
export class FindInFilesComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('findIn') findIn: jqxInputComponent;
  @ViewChild('text') text: jqxInputComponent;
  @ViewChild('matchCase') matchCase: jqxCheckBoxComponent;
  @ViewChild('regex') regex: jqxCheckBoxComponent;
  @ViewChild('findButton') findButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  source: string[] = [];
  hasReadPermission: boolean = false;

  tabsMap: any = {};

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService, private http: HttpRequestService) {

    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.FIND_IN_FILES : {
            this.findInFiles(message.data);
            return;
          }

          case MESSAGE_TYPE.AUTH_CHANGED : {
            this.hasReadPermission = message.data.hasReadPermission;
            return;
          }

          case MESSAGE_TYPE.TAB_CONTENT_CHANGED: {
            this.tabContentChanged(message.data);
            return;
          }
        }
      }
    );
  }

  findInFiles(fromDir: string) {
    if (!this.hasReadPermission) {
      return;
    }

    if (fromDir !== undefined) {
      this.findIn.val(fromDir);
    }

    this.source = [];
    this.window.open();
  }

  ngOnInit() {
  }

  open() {
  }

  initContent = () => {
    this.findButton.createComponent();
    this.cancelButton.createComponent();
  };

  findFilesInner(searchData: any, result: any) {
    const searchFunctionData = FIND_IN_FILES.resolveFindFunction(searchData);
    searchFunctionData.maxOccurrences = 100;

    // iterating over changed files ang searching again
    for (let relativePath in this.tabsMap) {
      // checking are we under the relativePath
      if (relativePath.indexOf(searchData[DI_CONSTANTS.RELATIVE_PATH]) !== 0) {
        continue;
      }

      // removing from result
      delete result[relativePath];

      // preparing to search
      searchFunctionData.fileContent = this.tabsMap[relativePath].getFileContent();

      // searching again
      const occurrences = searchFunctionData.func(searchFunctionData);

      if (occurrences.length > 0) {
        // adding to result
        result[relativePath] = occurrences;
      }
    }

    this.messageService.sendMessage(MESSAGE_TYPE.SEARCH_RESULTS, {
      result: result,
      searchData: searchData
    });

  }

  onFind() {
    // jqx bug. disabled button still clickable !
    if (this.text.val() === '') {
      return;
    }

    this.window.close();
    this.globalComponentsService.loader.open();

    const searchData = {};
    searchData[DI_CONSTANTS.RELATIVE_PATH] = this.findIn.val();
    searchData[DI_CONSTANTS.TEXT] = this.text.val();
    searchData[DI_CONSTANTS.MATCH_CASE] = this.matchCase.val();
    searchData[DI_CONSTANTS.IS_REGEX] = this.regex.val();

    this.http.post(searchData, REST_URLS.STORAGE.URLS.FILE_IN_FILES, 'json').subscribe(
      (result: any) => {
        this.globalComponentsService.loader.close();
        this.findFilesInner(searchData, result.body.result);
      },
      err => {
        this.globalComponentsService.loader.close();
        console.log(err);
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, `Find in files failed. Reason : [${err.statusText}]`);
      });
  }

  onOpen() {
    this.text.focus();
  }

  onKeyPress(event: any) {
    if (event.keyCode === 13 && this.text.val().length > 0) {
      this.onFind();
      return;
    }
  }

  tabContentChanged(data) {
    if (data.isChanged !== true) {
      delete this.tabsMap[data.relativePath];
      return;
    }

    this.tabsMap[data.relativePath] = data;
  }
}
