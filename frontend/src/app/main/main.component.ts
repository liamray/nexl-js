import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AuthService} from "./services/auth.service";
import * as $ from 'jquery';
import {MESSAGE_TYPE, MessageService} from "./services/message.service";
import {HttpRequestService} from "./services/http.requests.service";
import {GlobalComponentsService} from "./services/global-components.service";
import {UtilsService} from "./services/utils.service";
import {ICONS} from "./misc/messagebox/messagebox.component";
import {LocalStorageService} from "./services/localstorage.service";
import {CONFIRM_SHOW_QUICK_START} from "./services/localstorage.service";

export const F9 = 'F9';
export const F7 = 'F7';
export const F8 = 'F8';

const F7_KEY = 118;
const F8_KEY = 119;
const F9_KEY = 120;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, AfterViewInit {
  timerCounter: number = 0;

  constructor(private authService: AuthService, private messageService: MessageService, private http: HttpRequestService, private globalComponentsService: GlobalComponentsService) {
  }

  interceptHotKeysInner(event: any) {
    const char = String.fromCharCode(event.which).toLowerCase();

    // is Ctrl+S ?
    if (char === 's' && event.ctrlKey) {
      this.messageService.sendMessage(MESSAGE_TYPE.SAVE_FILE_TO_STORAGE);
      event.preventDefault();
      return;
    }

    // is F7 ?
    if (event.which === F7_KEY && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.messageService.sendMessage(MESSAGE_TYPE.PRETTIFY_FILE);
      return;
    }

    // is Alt+F7 ?
    if (event.which === F7_KEY && !event.ctrlKey && event.altKey) {
      event.preventDefault();
      this.messageService.sendMessage(MESSAGE_TYPE.FIND_FILE);
      return;
    }

    // is Ctrl+Alt+F7 ?
    if (event.which === F7_KEY && event.ctrlKey && event.altKey) {
      event.preventDefault();
      this.messageService.sendMessage(MESSAGE_TYPE.FIND_IN_FILES);
      return;
    }

    // is F8 ?
    if (event.which === F8_KEY && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.messageService.sendMessage(MESSAGE_TYPE.TOGGLE_ARGS_WINDOW);
      return;
    }

    // is F9 ?
    if (event.which === F9_KEY && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.messageService.sendMessage(MESSAGE_TYPE.EVAL_NEXL_EXPRESSION);
      return;
    }
  }

  interceptHotKeys() {
    $(window).bind('keydown',
      (event) => {
        this.interceptHotKeysInner(event);
      });
  }

  ngOnInit() {
    setInterval(_ => {
      this.timerCounter++;
      this.messageService.sendMessage(MESSAGE_TYPE.TIMER, this.timerCounter);
    }, 10000);

    // loading server info
    this.http.post({}, REST_URLS.GENERAL.URLS.INFO, 'json').subscribe(
      (info: any) => {
        UtilsService.setServerInfo(info.body);
        this.authService.refreshStatus();
        this.interceptHotKeys();
      },
      (err) => {
        console.log(err);
        this.globalComponentsService.messageBox.openSimple(ICONS.ERROR, err.statusText);
      }
    );

  }

  ngAfterViewInit() {
    if (LocalStorageService.loadRaw(CONFIRM_SHOW_QUICK_START) === false.toString()) {
      return;
    }

    // confirming...
    const opts = {
      title: 'Show quick start confirmation',
      label: 'Do you want to watch a quick start?',
      checkBoxText: 'Don\'t show it again',
      height: 100,
      callback: (callbackData: any) => {
        LocalStorageService.storeRaw(CONFIRM_SHOW_QUICK_START, !callbackData.checkBoxVal);
        if (callbackData.isConfirmed === true) {
          this.messageService.sendMessage(MESSAGE_TYPE.OPEN_QUICK_START);
        }
      },
    };

    this.globalComponentsService.confirmBox.open(opts);
  }
}
