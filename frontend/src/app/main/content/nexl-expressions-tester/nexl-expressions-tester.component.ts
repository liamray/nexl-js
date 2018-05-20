import {Component, ElementRef, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {HttpRequestService} from "../../../services/http.requests.service";
import {jqxComboBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcombobox";

@Component({
  selector: '.app-nexl-expressions-tester',
  templateUrl: './nexl-expressions-tester.component.html',
  styleUrls: ['./nexl-expressions-tester.component.css']
})
export class NexlExpressionsTesterComponent {
  @ViewChild('nexlExpression') nexlExpression: jqxComboBoxComponent;
  @ViewChild('output') output: ElementRef;

  constructor(private messageService: MessageService, private globalComponentsService: GlobalComponentsService, private http: HttpRequestService) {
    this.messageService.getMessage().subscribe((msg) => {
      this.handleMessages(msg);
    });
  }

  handleMessages(msg: any) {
    switch (msg.type) {
      case MESSAGE_TYPE.GET_CURRENT_TAB: {
        this.evalInner(msg.data);
        return;
      }
    }
  }

  eval() {
    this.globalComponentsService.loader.open();
    this.messageService.sendMessage(MESSAGE_TYPE.REQUEST_CURRENT_TAB);
  }

  evalInner(tabInfo: any) {
    if (tabInfo === undefined) {
      this.globalComponentsService.loader.close();
      return;
    }

    const data = {
      expression: this.nexlExpression.val(),
      'nexl-source-content': tabInfo.nexlSourceContent
    };

    // evaluating nexl expression
    this.http.post2Root(data, tabInfo.relativePath, 'json').subscribe(
      (info: any) => {
        this.output.nativeElement.innerText = info.body;
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.globalComponentsService.loader.close();
        console.log(err);
        this.globalComponentsService.notification.openError(err.statusText);
      }
    );

  }

  assemble() {
  }

  args() {
  }
}
