import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Subject} from 'rxjs/Subject';

export enum MESSAGE_TYPE {
  TREE_ITEM_EXPANDED,
  EXPAND_FROM_ROOT,
  JS_FILES_TREE_RELOADED,
  UPDATE_UI,
  OPEN_CHANGE_PASSWORD_WINDOW,
  OPEN_GENERATE_TOKEN_WINDOW,
  OPEN_REGISTER_WINDOW,
  OPEN_LOGIN_WINDOW,
  OPEN_PERMISSIONS_WINDOW,
  OPEN_SETTINGS_WINDOW,
  OPEN_APPEARANCE_WINDOW,
  RELOAD_JS_FILES,
  TOGGLE_ARGS_WINDOW,
  TAB_SELECTED,
  EVAL_NEXL_EXPRESSION,
  AUTH_CHANGED,
  LOAD_JS_FILE,
  CREATE_JS_FILE,
  SAVE_JS_FILE,
  CONTENT_AREA_RESIZED, // splitters don't produce a "resize window" broadcast message, so application need to dispatch that itself in order to ace editor adjust it's editing area ( there is also another bug when maximizing window, ace editor doesn't get a resize window message )
  CLOSE_DELETED_TABS,
  CLOSE_ALL_TABS,
  TAB_CONTENT_CHANGED,
  TABS_COUNT_CHANGED,
  TAB_CLOSED,
  CREATE_EXAMPLES_FILE,
  ITEM_MOVED,
  REQUEST_CURRENT_TAB, // requests current tab's data
  GET_CURRENT_TAB // returns currently opened tab's releativePath and tab content if tab changed
}

@Injectable()
export class MessageService {
  private subject = new Subject<any>();

  sendMessage(messageType: MESSAGE_TYPE, data?: any) {
    this.subject.next({
      type: messageType,
      data: data
    });
  }

  clearMessage() {
    this.subject.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
