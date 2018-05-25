import {Component, ComponentRef, ElementRef, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import {GlobalComponentsService} from "../../../services/global-components.service";
import {HttpRequestService} from "../../../services/http.requests.service";
import {jqxComboBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcombobox";
import * as queryString from "querystring";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";

@Component({
  selector: '.app-nexl-expressions-tester',
  templateUrl: './nexl-expressions-tester.component.html',
  styleUrls: ['./nexl-expressions-tester.component.css']
})
export class NexlExpressionsTesterComponent {
  @ViewChild('nexlExpression') nexlExpression: jqxComboBoxComponent;
  @ViewChild('outputArea') outputArea: jqxExpanderComponent;
  @ViewChild('expressionArea') expressionArea: jqxExpanderComponent;

  @ViewChild('evalButton') evalButton: jqxButtonComponent;
  @ViewChild('assembleButton') assembleButton: jqxButtonComponent;
  @ViewChild('argsButton') argsButton: jqxButtonComponent;

  output: string = '';
  url: '';
  hasReadPermission = false;
  tabsCount = 0;

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

      case MESSAGE_TYPE.AUTH_CHANGED: {
        this.updatePermissions(msg.data);
        return;
      }

      case MESSAGE_TYPE.TABS_COUNT_CHANGED: {
        this.tabsCountChanged(msg.data);
        return;
      }

      case MESSAGE_TYPE.EVAL_NEXL_EXPRESSION: {
        this.eval();
        return;
      }
    }
  }

  updatePermissions(data: any) {
    if (data.hasReadPermission === this.hasReadPermission) {
      return;
    }

    this.hasReadPermission = data.hasReadPermission;
    this.updateComponentsState();
  }


  eval() {
    // todo : remove after jqx fix
    if (this.isDisabled()) {
      return;
    }

    this.globalComponentsService.loader.open();
    this.messageService.sendMessage(MESSAGE_TYPE.REQUEST_CURRENT_TAB);
  }

  evalInner(tabInfo: any) {
    if (tabInfo === undefined) {
      this.globalComponentsService.loader.close();
      return;
    }

    let data: any = {};

    if (tabInfo.nexlSourceContent !== undefined) {
      data['nexl-source-content'] = tabInfo.nexlSourceContent;
    }

    if (this.nexlExpression.val() !== '') {
      data.expression = this.nexlExpression.val();
    }

    data = queryString.stringify(data);

    // evaluating nexl expression
    this.http.post2Root(data, tabInfo.relativePath, 'text').subscribe(
      (info: any) => {
        this.output = info.body;
        this.globalComponentsService.loader.close();
        this.globalComponentsService.notification.openSuccess('Successfully evaluated nexl expression. See output');
      },
      (err) => {
        this.output = '';
        this.globalComponentsService.loader.close();
        console.log(err);
        if (err.status > 554 && err.status < 600) {
          this.globalComponentsService.notification.openInfo(err.statusText);
        } else {
          this.globalComponentsService.notification.openError(err.statusText);
        }
      }
    );

  }

  assemble() {
    // todo : remove after jqx fix
    if (this.isDisabled()) {
      return;
    }

  }

  args() {
    // todo : remove after jqx fix
    if (this.isDisabled()) {
      return;
    }

  }

  onKeyPress(event) {
    if (event.keyCode === 13) {
      this.eval();
    }
  }

  private tabsCountChanged(tabsCount: number) {
    this.tabsCount = tabsCount;
    this.updateComponentsState();
  }

  private updateComponentsState() {
    let isDisabled = this.isDisabled();
    this.outputArea.disabled(isDisabled);
    this.expressionArea.disabled(isDisabled);
    this.nexlExpression.disabled(isDisabled);
    this.evalButton.disabled(isDisabled);
    this.argsButton.disabled(isDisabled);
    this.assembleButton.disabled(isDisabled);
  }

  private isDisabled() {
    return !this.hasReadPermission || this.tabsCount < 1;
  }
}
