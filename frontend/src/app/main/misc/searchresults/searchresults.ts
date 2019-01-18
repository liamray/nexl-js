import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {jqxTreeComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtree";

@Component({
  selector: 'app-searchresults',
  templateUrl: './searchresults.component.html',
  styleUrls: ['./searchresults.component.css']
})

export class SearchResultsComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('files') files: jqxTreeComponent;
  @ViewChild('closeButton') closeButton: jqxButtonComponent;
  @ViewChild('return2SearchButton') return2SearchButton: jqxButtonComponent;

  filesSource: any[] =
    [];

  hasReadPermission: boolean = false;

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.SEARCH_RESULTS : {
            this.showResults(message.data);
            return;
          }

          case MESSAGE_TYPE.AUTH_CHANGED : {
            this.hasReadPermission = message.data.hasReadPermission;
            return;
          }
        }
      }
    );
  }

  makeFileOccurrences(data: any) {
    const fileOccurrences = [];
    for (let index in data) {
      const fileOccurrence: any = {};
      fileOccurrence.label = `(${data[index].number}): ${data[index].line}`;
      fileOccurrence.data = data[index].number;

      fileOccurrences.push(fileOccurrence);
    }
    return fileOccurrences;
  }

  showResults(result: any) {
    if (!this.hasReadPermission) {
      return;
    }

    if (result === undefined) {
      this.window.open();
      return;
    }

    this.filesSource = [];
    if (Object.keys(result.result).length > 0) {
      this.showResultsInner(result.result);
    } else {
      this.filesSource.push(`Nothing found for <b>[${result.searchData[DI_CONSTANTS.TEXT]}]</b> in <b>[${result.searchData[DI_CONSTANTS.RELATIVE_PATH]}]</b> directory`);
    }

    this.files.refresh();
    this.window.open();
  }

  private showResultsInner(result: any) {
    for (let key in result) {
      const file: any = {};
      file.label = key;
      file.icon = './nexl/site/icons/file.png';
      file.items = this.makeFileOccurrences(result[key]);

      this.filesSource.push(file);
    }
  }

  ngOnInit() {
  }

  open() {
  }

  initContent = () => {
    this.closeButton.createComponent();
    this.return2SearchButton.createComponent();
  };

  return2Search() {
    this.window.close();
    this.messageService.sendMessage(MESSAGE_TYPE.FIND_IN_FILES);
  }
}
