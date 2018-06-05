import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import {jqxComboBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcombobox";
import * as queryString from "querystring";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {ArgsComponent} from "./args/args.component";
import {environment} from '../../../../environments/environment';

@Component({
  selector: '.app-nexl-expressions-tester',
  templateUrl: './nexl-expressions-tester.component.html',
  styleUrls: ['./nexl-expressions-tester.component.css']
})
export class NexlExpressionsTesterComponent implements AfterViewInit {
  @ViewChild('nexlExpression') nexlExpression: jqxComboBoxComponent;
  @ViewChild('outputArea') outputArea: jqxExpanderComponent;
  @ViewChild('expressionArea') expressionArea: jqxExpanderComponent;

  @ViewChild('evalButton') evalButton: jqxButtonComponent;
  @ViewChild('assembleButton') assembleButton: jqxButtonComponent;
  @ViewChild('argsButton') argsButton: jqxButtonComponent;

  @ViewChild('argsWindow') argsWindow: ArgsComponent;

  output: string = '';
  url: string = '';
  urlTooltip: string = '';
  urlEscaped: string = '';
  hasReadPermission = false;
  tabsCount = 0;
  currentArgs: any = {};
  currentArgsAsStr = '';
  relativePath: string = '';
  relativePathSlashed: string = '';

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

      case MESSAGE_TYPE.TAB_SELECTED: {
        this.tabSelected(msg.data);
        return;
      }

      case MESSAGE_TYPE.TOGGLE_ARGS_WINDOW: {
        if (!this.isDisabled()) {
          this.argsWindow.toggleOpen();
        }
        return;
      }
    }
  }

  tabSelected(relativePath: string) {
    this.relativePath = relativePath;
    this.updateUrl();
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

    // args
    for (let key in this.currentArgs) {
      data[key] = this.currentArgs[key];
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

    this.argsWindow.toggleOpen();
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
    this.updateUrl();
  }

  private isDisabled() {
    return !this.hasReadPermission || this.tabsCount < 1;
  }

  onArgs(data: any) {
    this.currentArgs = data;
    this.updateUrl();
  }

  updateUrl() {
    if (this.isDisabled()) {
      this.url = '';
      this.urlEscaped = '';
      this.urlTooltip = '';
      return;
    }

    this.updateUrlInner();
    this.urlTooltip = '<p style="text-align: left;">' + this.url + '<br/>Hello</p>';
    const expression = this.nexlExpression.val();
    const text = `<span style="text-decoration: underline;">${environment.rootUrl}</span> <span style="border: 2px dashed green; padding: 5px;">${this.relativePathSlashed}</span> <span style="">?</span> <span style="border: 2px solid red; padding: 5px;">expression=${expression}</span> <span style="">&</span> <span style="border: 2px dotted blue; padding: 5px;">${this.currentArgsAsStr}</span>`;
    this.urlTooltip = '<p style="text-align: left;">' + text + '<br/></p>';
  }

  updateUrlInner() {
    this.currentArgsAsStr = '';


    let url = environment.rootUrl;
    this.relativePathSlashed = this.relativePath.replace(/^[\\/]/, '/').replace(/\\/g, '/');
    url += this.relativePathSlashed;
    let urlEscaped = url;

    let expression = this.nexlExpression.val();

    if (expression !== '') {
      url += '?' + 'expression=' + expression;
      urlEscaped += '?' + 'expression=' + encodeURIComponent(expression);
    }

    if (Object.keys(this.currentArgs).length < 1) {
      this.url = url;
      this.urlEscaped = urlEscaped;
      return;
    }

    if (expression === '') {
      url += '?';
      urlEscaped += '?';
    } else {
      url += '&';
      urlEscaped += '&';
    }

    this.currentArgsAsStr = '';

    for (let key in this.currentArgs) {
      this.currentArgsAsStr += key;
      this.currentArgsAsStr += '=';
      this.currentArgsAsStr += this.currentArgs[key];
      this.currentArgsAsStr += '&';

      urlEscaped += encodeURIComponent(key);
      urlEscaped += '=';
      urlEscaped += encodeURIComponent(this.currentArgs[key]);
      urlEscaped += '&';
    }

    this.currentArgsAsStr = this.currentArgsAsStr.replace(/&$/, '');
    this.url = url + this.currentArgsAsStr;
    this.urlEscaped = urlEscaped.replace(/&$/, '');
  }

  onExpressionChange() {
    this.updateUrl();
  }

  ngAfterViewInit() {
    this.nexlExpression.elementRef.nativeElement.addEventListener('keyup',
      () => {
        this.updateUrl();
      });
  }

  onUrlClick() {
    window.open(this.urlEscaped);
    return false;
  }
}
