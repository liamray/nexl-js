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

  filesSource: any[] =
    [
      {
        label: "Mail", expanded: true,
        items:
          [
            {label: "Calendar"},
            {label: "Contacts", selected: true}
          ]
      },
      {
        label: "Inbox", expanded: true,
        items:
          [
            {label: "Admin"},
            {label: "Corporate"},
            {label: "Finance"},
            {label: "Other"},
          ]
      },
      {label: "Deleted Items"},
      {label: "Notes"},
      {label: "Settings"},
      {label: "Favorites"}
    ];

  hasReadPermission: boolean = false;

  constructor(private globalComponentsService: GlobalComponentsService, private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.SEARCH_RESULTS : {
            this.showResults();
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

  showResults() {
    if (!this.hasReadPermission) {
      return;
    }

    this.window.open();
  }

  ngOnInit() {
  }

  open() {
  }

  initContent = () => {
    this.closeButton.createComponent();
  };

  onFind() {
  }
}
