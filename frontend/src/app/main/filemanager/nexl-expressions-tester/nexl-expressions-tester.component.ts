import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import * as queryString from "querystring";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {ArgsComponent} from "./args/args.component";
import {environment} from '../../../../environments/environment';
import * as $ from 'jquery';
import {
  LocalStorageService, OPEN_URL_WARNING_MESSAGE,
  PRETTIFY_BUTTON_STATE
} from "../../services/localstorage.service";
import {jqxTooltipComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtooltip";
import {jqxToggleButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtogglebutton";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {UtilsService} from "../../services/utils.service";

const URL_TEMPLATE = `
<div style="text-align: left; display: block; padding: 10px;">
    <span style="text-decoration: underline;" id="tooltipRootUrl"></span>
    <span style="border: 2px dashed green; padding: 5px;" id="tooltipRelativePath"></span>
    <span style="" id="tooltipQuestionChar">?</span>
    <span style="border: 2px solid red; padding: 5px;" id="tooltipExpression"></span>
    <span style="" id="tooltipAmpersand">&</span>
    <span style="border: 2px dotted blue; padding: 5px;" id="tooltipArgs"></span>

    <br/>
    <br/>

    <div
            style="border: 2px dashed green; padding: 5px;width: 15px;height: 15px; float: left;"></div>
    <div style="position: relative; top: 6px; left: 6px;float: left;"> - relative path to JavaScript file</div>
    <div style="clear: both;"></div>

    <div id="tooltipExpressionExplanation" style="padding-top: 10px;">
        <div
                style="border: 2px solid red; padding: 5px;width: 15px;height: 15px; float: left;"></div>
        <div style="position: relative; top: 6px; left: 6px;float: left;"> - nexl expression</div>
        <div style="clear: both;"></div>
    </div>

    <div id="tooltipArgsExplanation" style="padding-top: 10px;">
        <div
                style="border: 2px dotted blue; padding: 5px;width: 15px;height: 15px; float: left;"></div>
        <div style="position: relative; top: 6px; left: 6px;float: left;"> - arguments</div>
        <div style="clear: both;"></div>
    </div>
    
    <div id="tooltipEmptyExpressionExplanation" style="padding-top: 15px;">
        <img src='./nexl/site/images/tip.png' style="position: relative; top: 2px;"/>
        Please note empty nexl expression is evaluated to undefined value.<br/>
        <img src='./nexl/site/images/tip.png' style="position: relative; top: 2px;"/>
        You can specify automatically executed nexl expression in your JavaScript file in the following way :<br/>
        <span style="padding-top: 5px; padding-left: 150px; font-weight: bold;">nexl.defaultExpression = '\${myExpression...}';</span>  
    </div>
</div>
   
`;

@Component({
  selector: '.app-nexl-expressions-tester',
  templateUrl: './nexl-expressions-tester.component.html',
  styleUrls: ['./nexl-expressions-tester.component.css']
})
export class NexlExpressionsTesterComponent implements AfterViewInit {
  @ViewChild('nexlExpression') nexlExpression: jqxInputComponent;
  @ViewChild('outputArea') outputArea: jqxExpanderComponent;
  @ViewChild('expressionArea') expressionArea: jqxExpanderComponent;

  @ViewChild('evalButton') evalButton: jqxButtonComponent;
  @ViewChild('assembleButton') assembleButton: jqxButtonComponent;
  @ViewChild('argsButton') argsButton: jqxButtonComponent;

  @ViewChild('argsWindow') argsWindow: ArgsComponent;
  @ViewChild('template') template: ElementRef;

  @ViewChild('urlTooltip') urlTooltip: jqxTooltipComponent;

  @ViewChild('prettifyButton') prettifyButton: jqxToggleButtonComponent;

  urlTemplate: string = URL_TEMPLATE;

  output: string = '';
  originalOutput: string = '';
  isPrettify: boolean = true; // jqxToggleButton has a certain problem with its state, so storing its state externally

  url: string = '';
  urlEncoded: string = '';
  hasReadPermission = false;
  tabsCount = 0;
  currentArgs: any = {};
  relativePath: string = '';

  tabsInfo: any = {};

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

      case MESSAGE_TYPE.TAB_CONTENT_CHANGED: {
        this.tabContentChanged(msg.data);
        return;
      }

      case MESSAGE_TYPE.TAB_CLOSED: {
        delete this.tabsInfo[msg.data];
        return;
      }

      case MESSAGE_TYPE.ITEM_MOVED: {
        this.itemMoved(msg.data);
        return;
      }
    }
  }

  itemMoved(data: any) {
    // for directories
    if (data.isDir === true) {
      if (UtilsService.pathIndexOf(this.relativePath, data.oldRelativePath) !== 0) {
        return;
      }

      this.relativePath = data.newRelativePath + this.relativePath.substr(data.oldRelativePath.length);
    }

    // for files
    if (data.isDir !== true) {
      this.relativePath = data.newRelativePath;
    }

    // updating
    const item = this.tabsInfo[data.oldRelativePath];
    if (item !== undefined) {
      delete this.tabsInfo[data.oldRelativePath];
      this.tabsInfo[data.newRelativePath] = item;
    }

    this.updateUrl();
  }

  tabContentChanged(tabInfo: any) {
    this.tabsInfo[tabInfo.relativePath] = tabInfo;
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

    if (tabInfo.nexlJSFileContent !== undefined) {
      data['nexl-source-content'] = tabInfo.nexlJSFileContent;
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
        this.originalOutput = info.body;
        this.output = this.prettifyIfNeeded();
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

  prettifyIfNeeded() {
    if (!this.isPrettify) {
      return this.originalOutput;
    }

    try {
      return JSON.stringify(JSON.parse(this.originalOutput), null, 2);
    } catch (e) {
      return this.originalOutput;
    }
  }

  assemble() {
    if (this.isDisabled()) {
      return;
    }

  }

  args() {
    if (this.isDisabled()) {
      return;
    }

    this.argsWindow.toggleOpen();
  }

  onKeyPress(event) {
    if (event.keyCode === 13) {
      this.eval();
      return;
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
    this.assembleButton.disabled(true);

    this.prettifyButton.disabled(this.isDisabled());

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
      this.urlEncoded = '';
      this.urlTooltip.disabled(true);
      return;
    }

    this.urlTooltip.disabled(false);

    const rootUrl = environment.rootUrl;
    const relativePathSlashed = this.relativePath.replace(/^[\\/]/, '/').replace(/\\/g, '/');
    const url = rootUrl + relativePathSlashed;
    const expression = this.nexlExpression.val();
    const argsAsArray = this.args2Array();
    const args4Tooltip = this.args2Str(argsAsArray, false);

    if (expression !== '') {
      argsAsArray.unshift({
        key: 'expression',
        value: expression
      });
    }

    const argsAsStr = this.args2Str(argsAsArray, false);
    const argsAsStrEncoded = this.args2Str(argsAsArray, true);

    // updating this.url, this.urlEncoded
    if (argsAsStr === '') {
      this.url = url;
      this.urlEncoded = url;
    } else {
      this.url = url + '?' + argsAsStr;
      this.urlEncoded = url + '?' + argsAsStrEncoded;
    }

    // updating tooltip
    $('#tooltipRootUrl').text(rootUrl);
    $('#tooltipRelativePath').text(relativePathSlashed);
    $('#tooltipExpression').text(`expression=${expression}`);
    $('#tooltipArgs').text(args4Tooltip);

    if (expression === '' && args4Tooltip === '') {
      $('#tooltipQuestionChar').css('display', 'none');
      $('#tooltipExpression').css('display', 'none');
      $('#tooltipAmpersand').css('display', 'none');
      $('#tooltipArgs').css('display', 'none');

      $('#tooltipExpressionExplanation').css('display', 'none');
      $('#tooltipArgsExplanation').css('display', 'none');
      $('#tooltipEmptyExpressionExplanation').css('display', '');
      return;
    }

    if (expression !== '' && args4Tooltip !== '') {
      $('#tooltipQuestionChar').css('display', '');
      $('#tooltipExpression').css('display', '');
      $('#tooltipAmpersand').css('display', '');
      $('#tooltipArgs').css('display', '');

      $('#tooltipExpressionExplanation').css('display', '');
      $('#tooltipArgsExplanation').css('display', '');
      $('#tooltipEmptyExpressionExplanation').css('display', 'none');
      return;
    }

    if (expression !== '') {
      $('#tooltipQuestionChar').css('display', '');
      $('#tooltipExpression').css('display', '');
      $('#tooltipAmpersand').css('display', 'none');
      $('#tooltipArgs').css('display', 'none');

      $('#tooltipExpressionExplanation').css('display', '');
      $('#tooltipArgsExplanation').css('display', 'none');
      $('#tooltipEmptyExpressionExplanation').css('display', 'none');
      return;
    }

    if (args4Tooltip !== '') {
      $('#tooltipQuestionChar').css('display', '');
      $('#tooltipExpression').css('display', 'none');
      $('#tooltipAmpersand').css('display', 'none');
      $('#tooltipArgs').css('display', '');

      $('#tooltipExpressionExplanation').css('display', 'none');
      $('#tooltipArgsExplanation').css('display', '');
      $('#tooltipEmptyExpressionExplanation').css('display', '');
      return;
    }
  }

  args2Array() {
    const result = [];
    for (let key in this.currentArgs) {
      result.push({
        key: key,
        value: this.currentArgs[key]
      });
    }

    return result;
  }

  args2Str(args: any[], encode: boolean) {
    let result = '';
    args.forEach(
      (item) => {
        result += item.key;
        result += '=';
        result += encode ? encodeURIComponent(item.value) : item.value;
        result += '&';
      });

    // removing last ampersand if present
    return result.replace(/&$/, '');
  }

  ngAfterViewInit() {
    // loading state of prettify button
    this.isPrettify = LocalStorageService.loadObj(PRETTIFY_BUTTON_STATE, true);
    this.prettifyButton.toggled(!this.isPrettify);

    //
    this.nexlExpression.elementRef.nativeElement.addEventListener('input', () => {
      this.updateUrl();
    });
  }

  onUrlClickWhenNewFile() {
    const opts = {
      title: 'Information',
      label: `The [${this.relativePath}] JavaScript file was newly created and not saved. It doesn't exist on server and not accessible outside. First save this file and after that you can access it by URL`,
      callback: (dontShowAgain: boolean) => {
      }
    };

    this.globalComponentsService.messageBox.open(opts);
  }

  onUrlClickWhenJSChanged() {
    if (LocalStorageService.loadRaw(OPEN_URL_WARNING_MESSAGE) === false.toString()) {
      window.open(this.urlEncoded);
      return false;
    }

    const opts = {
      title: 'Information',
      label: `Please note the [${this.relativePath}] JavaScript file was modified. You can get different results until you save it`,
      checkBoxText: 'Don\'t show this message again',
      callback: (dontShowAgain: boolean) => {
        window.open(this.urlEncoded);
        LocalStorageService.storeRaw(OPEN_URL_WARNING_MESSAGE, !dontShowAgain);
      }
    };

    this.globalComponentsService.messageBox.open(opts);
  }

  onUrlClick() {
    // is new file ?
    if (this.tabsInfo[this.relativePath] !== undefined && this.tabsInfo[this.relativePath].isNewFile === true) {
      this.onUrlClickWhenNewFile();
      return false;
    }

    // is changed ?
    if (this.tabsInfo[this.relativePath] !== undefined && this.tabsInfo[this.relativePath].isChanged === true) {
      this.onUrlClickWhenJSChanged();
      return false;
    }

    // opening URL
    window.open(this.urlEncoded);

    return false;
  }

  onPrettify() {
    this.isPrettify = !this.isPrettify;
    this.prettifyButton.toggled(this.isPrettify);
    LocalStorageService.storeObj(PRETTIFY_BUTTON_STATE, this.isPrettify);

    this.output = this.prettifyIfNeeded();
  }
}
