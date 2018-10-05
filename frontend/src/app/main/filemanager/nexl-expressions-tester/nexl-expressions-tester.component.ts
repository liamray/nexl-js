import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {GlobalComponentsService} from "../../services/global-components.service";
import {HttpRequestService} from "../../services/http.requests.service";
import * as queryString from "querystring";
import {jqxExpanderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxexpander";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {ArgsComponent} from "./args/args.component";
import {environment} from '../../../../environments/environment';
import {
  ARGS,
  EXPRESSION_SPLITTER_VERTICAL, EXPRESSIONS,
  LocalStorageService, OPEN_URL_WARNING_MESSAGE,
  PRETTIFY_BUTTON_STATE
} from "../../services/localstorage.service";
import {jqxTooltipComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtooltip";
import {jqxToggleButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxtogglebutton";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {UtilsService} from "../../services/utils.service";
import {jqxSplitterComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxsplitter";
import {jqxListBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxlistbox";
import {AppearanceService} from "../../services/appearance.service";

const EXPRESSION_SPLITTER_DEF_VALUE = [
  {size: '55%', min: 400, collapsible: false},
  {size: '45%', min: 200}
];

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
        <img src='./nexl/site/icons/info.png' style="position: relative; top: 2px;"/>
        Please note empty nexl expression is evaluated to undefined value.<br/>
        <img src='./nexl/site/icons/info.png' style="position: relative; top: 2px;"/>
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
  @ViewChild('argsButton') argsButton: jqxButtonComponent;

  @ViewChild('argsWindow') argsWindow: ArgsComponent;
  @ViewChild('template') template: ElementRef;

  @ViewChild('prettifyButton') prettifyButton: jqxToggleButtonComponent;

  @ViewChild('expressionSplitter') expressionSplitter: jqxSplitterComponent;

  @ViewChild('executionHistoryListBox') executionHistoryListBox: jqxListBoxComponent;

  urlTemplate: string = URL_TEMPLATE;

  nexlExpressions: any = {};
  nexlArgs = {};

  output: string = '';
  originalOutput: string = '';
  isPrettify: boolean = true; // jqxToggleButton has a certain problem with its state, so storing its state externally

  url: string = '';
  urlEncoded: string = '';
  hasReadPermission = false;
  tabsCount = 0;
  relativePath: string = '';

  tabsInfo: any = {};
  executionHistorySrc: any[] = [];

  constructor(private messageService: MessageService, private globalComponentsService: GlobalComponentsService, private http: HttpRequestService) {
    this.nexlExpressions = LocalStorageService.loadObj(EXPRESSIONS, {});
    this.nexlArgs = LocalStorageService.loadObj(ARGS, []);

    this.messageService.getMessage().subscribe(msg => {
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

      case MESSAGE_TYPE.TIMER: {
        this.onTimer(msg.data);
        return;
      }

      case MESSAGE_TYPE.ARGS_CHANGED: {
        this.argsChanged(msg.data);
        return;
      }
    }
  }

  onTimer(timerCounter: number) {
    if (timerCounter % 2 === 0) {
      LocalStorageService.storeObj(EXPRESSIONS, this.nexlExpressions);
      LocalStorageService.storeObj(ARGS, this.nexlArgs);
    }
  }

  itemMoved(data: any) {
    // for directories
    if (data.isDir === true) {
      if (UtilsService.pathIndexOf(this.relativePath, data.oldRelativePath) !== 0) {
        return;
      }

      this.relativePath = data.newRelativePath + this.relativePath.substr(data.oldRelativePath.length);
      return;
    }

    // for files

    // updating expressions
    const expression = this.nexlExpressions[this.relativePath];
    delete this.nexlExpressions[this.relativePath];
    this.relativePath = data.newRelativePath;
    this.nexlExpressions[this.relativePath] = expression;

    // updating tabs
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
    this.nexlExpression.val(this.nexlExpressions[this.relativePath] || '');
    this.messageService.sendMessage(MESSAGE_TYPE.SET_ARGS, this.nexlArgs[this.relativePath] || []);
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

  addExecutionHistoryItemInnerInner(icon: string, msg: string) {
    this.executionHistoryListBox.addItem({
      html: `<div style=\'height: 20px; float: left;\'><img width=\'16\' height=\'16\' style=\'float: left; margin-top: 2px; margin-right: 5px;\' src=\'./nexl/site/icons/${icon}\'/><span>${msg}</span></div>`
    });
  }

  addExecutionHistoryItemInner(relativePath: string, httpStatus: number, msg: string) {
    const items = this.executionHistoryListBox.getItems();

    const maxItemsCount = AppearanceService.load()['max-execution-history-items'];
    if (items.length >= maxItemsCount) {
      this.executionHistoryListBox.removeAt(0);
    }

    const date = COMMON_UTILS.formatDate();

    if (httpStatus >= 200 && httpStatus < 300) {
      if (msg.length < 30) {
        this.addExecutionHistoryItemInnerInner('ok.png', `| ${date} | [${relativePath}] -> ${msg}`);
      } else {
        this.addExecutionHistoryItemInnerInner('ok.png', `| ${date} | [${relativePath}] -> ${msg.substr(0, 30)}...`);
      }
      return;
    }

    if (httpStatus >= 554 && httpStatus < 600) {
      this.addExecutionHistoryItemInnerInner('prohibit.png', `| ${date} | [${relativePath}] -> Evaluated successfully but got null or undefined value`);
      return;
    }

    this.addExecutionHistoryItemInnerInner('remove.png', `| ${date} | [${relativePath}] -> ${msg}`);
  }

  addExecutionHistoryItem(relativePath: string, httpStatus: number, msg: string) {
    this.addExecutionHistoryItemInner(this.relativePath, httpStatus, msg);

    setTimeout(_ => {
      const lastItem = this.executionHistoryListBox.getItem(this.executionHistoryListBox.getItems().length - 1);
      this.executionHistoryListBox.selectItem(lastItem);
    }, 100);
  }

  evalInner(tabInfo: any) {
    if (tabInfo === undefined) {
      this.globalComponentsService.loader.close();
      return;
    }

    let data: any = {};

    if (tabInfo.fileContent !== undefined) {
      data[DI_CONSTANTS.FILE_BODY] = tabInfo.fileContent;
    }

    if (this.nexlExpression.val() !== '') {
      data.expression = this.nexlExpression.val();
    }

    const currentArgs = this.resolveCurrentArgs();

    // args
    for (let key in currentArgs) {
      data[key] = currentArgs[key];
    }

    data = queryString.stringify(data);

    // evaluating nexl expression
    this.http.post2Root(data, tabInfo.relativePath, 'text').subscribe(
      (info: any) => {
        this.originalOutput = info.body;
        this.output = this.prettifyIfNeeded();
        this.addExecutionHistoryItem(tabInfo.relativePath, 200, info.body);
        this.globalComponentsService.loader.close();
      },
      (err) => {
        this.output = '';
        this.addExecutionHistoryItem(tabInfo.relativePath, err.status, err.statusText);
        this.globalComponentsService.loader.close();
        console.log(err);
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

    this.prettifyButton.disabled(this.isDisabled());

    this.updateUrl();
  }

  private isDisabled() {
    return !this.hasReadPermission || this.tabsCount < 1;
  }

  updateUrl() {
    if (this.isDisabled()) {
      this.url = '';
      this.urlEncoded = '';
      return;
    }

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
    /*
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
    */
  }

  args2Array() {
    const currentArgs = this.resolveCurrentArgs();
    const result = [];
    for (let key in currentArgs) {
      result.push({
        key: key,
        value: currentArgs[key]
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
      this.nexlExpressions[this.relativePath] = this.nexlExpression.val();
      this.updateUrl();
    });

    this.loadSplitter();
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

  loadSplitter() {
    this.expressionSplitter.panels(LocalStorageService.loadObj(EXPRESSION_SPLITTER_VERTICAL, EXPRESSION_SPLITTER_DEF_VALUE));
  }

  saveSplitter() {
    LocalStorageService.storeObj(EXPRESSION_SPLITTER_VERTICAL, this.expressionSplitter.panels());
  }

  onSplitterResized() {
    this.saveSplitter();
  }

  onSplitterCollapsed() {
    this.saveSplitter();
  }

  onSplitterExpanded() {
    this.saveSplitter();
  }

  executionHistoryItemSelected(event: any) {
  }

  private resolveCurrentArgs() {
    const args = this.nexlArgs[this.relativePath] || [];
    const result = {};

    args.forEach(item => {
      if (item.disabled !== true) {
        result[item.key] = item.value;
      }
    });

    return result;
  }

  private argsChanged(data) {
    this.nexlArgs[this.relativePath] = data;
    LocalStorageService.storeObj(ARGS, this.nexlArgs);
    this.updateUrl();
  }
}
