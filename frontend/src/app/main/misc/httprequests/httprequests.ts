import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";

@Component({
  selector: 'app-httprequests',
  templateUrl: './httprequests.component.html',
  styleUrls: ['./httprequests.component.css']
})
export class HttpRequestsComponent implements OnInit {

  @ViewChild('fileName') fileName: jqxInputComponent;
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;

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

    this.window.open();
  }

  ngOnInit(): void {
  }

  initContent = () => {
    this.okButton.createComponent();
  };

  onOpen() {
  }
}
