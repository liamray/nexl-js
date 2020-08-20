import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import * as $ from 'jquery';
import {UtilsService} from "../../services/utils.service";
import {jqxNavigationBarComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxnavigationbar';


@Component({
  selector: 'app-httprequests',
  templateUrl: './httprequests.component.html',
  styleUrls: ['./httprequests.component.css']
})
export class HttpRequestsComponent {
  @ViewChild('myNavigationBar') myNavigationBar: jqxNavigationBarComponent;

  @ViewChild('fileName') fileName: jqxInputComponent;
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;

  private items = [];

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.OPEN_HTTP_REQUESTS_WINDOW : {
            this.showHttpRequestsWindows(message.data);
            return;
          }
        }
      }
    );
  }

  showHttpRequestsWindows(value: any) {
    if (value === undefined) {
      return;
    }

    this.items.forEach(item => {
      try {
        this.myNavigationBar.remove(0);
        this.myNavigationBar.refresh();
      } catch (err) {
      }
    });
    this.items = this.makeItems(value);
    this.makeItems(value).forEach(item => {
      this.myNavigationBar.add(`<h4>${item.title}</h4>`, `<div style="padding: 10px;"><textarea rows="3" cols="79" readonly>${item.example}</textarea></div>`);
      this.myNavigationBar.refresh();
    });

    this.window.open();
  }

  private makeItems(value: any) {
    let relativePath = value.relativePath;
    let file = UtilsService.resolveFileName(relativePath);
    if (file.length > 30) {
      file = file.substr(0, 30) + '...';
    }
    relativePath = relativePath.replace(/\\/g, '/');
    relativePath = encodeURI(relativePath);
    const hostAndPost = window.location.href.split('/')[2];

    const fileMapping = [
      {
        title: `To get an [X] variable from the [${file}] file`,
        example: `wget "http://${hostAndPost}${relativePath}?expression=\${X}"`

      },
      {
        title: `To set a value for the [X] variable from the [${file}] file`,
        example: `wget 2`
      },
      {
        title: `To get a [${file}] file content`,
        example: `wget 3`
      },
      {
        title: `To update the [${file}] file content`,
        example: `wget 4`
      }
    ];

    return fileMapping;
  }

  ngOnInit(): void {
  }


  initContent = () => {
    this.okButton.createComponent();
  };

  onOpen() {
  }
}
