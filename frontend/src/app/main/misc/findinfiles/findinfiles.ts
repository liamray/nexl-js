import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {HttpRequestService} from "../../services/http.requests.service";
import {jqxCheckBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox";

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

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService, private http: HttpRequestService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.FIND_IN_FILES : {
            this.findInFiles();
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

  findInFiles() {
    if (!this.hasReadPermission) {
      return;
    }

    this.text.val('');
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

  // todo : start search on "Enter" press
  // todo : replace text boxes with combo with history


  onFind() {
    this.window.close();
    this.globalComponentsService.loader.open();

    const data = {};
    data[DI_CONSTANTS.RELATIVE_PATH] = this.findIn.val();
    data[DI_CONSTANTS.TEXT] = this.text.val();
    data[DI_CONSTANTS.MATCH_CASE] = this.matchCase.val();
    data[DI_CONSTANTS.IS_REGEX] = this.regex.val();

    this.http.post(data, REST_URLS.STORAGE.URLS.FILE_IN_FILES, 'json').subscribe(
      (result: any) => {
        this.globalComponentsService.loader.close();
        this.messageService.sendMessage(MESSAGE_TYPE.SEARCH_RESULTS, result.body.result);
      },
      err => {
        this.globalComponentsService.loader.close();
        console.log(err);
      });
  }

  onOpen() {
    this.text.focus();
  }
}
