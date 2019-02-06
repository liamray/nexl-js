import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Subject} from 'rxjs/Subject';

export enum MESSAGE_TYPE {
  SHOW_FILE_DIR_INFORMATION, // opens a popup window and show file/dir information
  SET_TAB_CONTENT,
  ARGS_CHANGED, // fired when args changed in args-window by user
  SET_ARGS, // instructs args-window to set arguments embedded to the message
  TIMER,
  PRETTIFY_FILE,
  SET_TREE_ITEMS,
  GET_TREE_ITEMS,
  USERS_WINDOW,
  FIND_FILE,
  FIND_IN_FILES,
  SEARCH_RESULTS,
  OPEN_ABOUT_WINDOW,
  CREATE_NEW_FILE_IN_TREE,
  EXPAND_ITEM_IN_TREE,
  FILES_TREE_RELOADED,
  UPDATE_UI,
  OPEN_CHANGE_PASSWORD_WINDOW,
  OPEN_REGISTER_WINDOW,
  OPEN_LOGIN_WINDOW,
  OPEN_PERMISSIONS_WINDOW,
  OPEN_SETTINGS_WINDOW,
  OPEN_APPEARANCE_WINDOW,
  RELOAD_FILES,
  TOGGLE_ARGS_WINDOW,
  TAB_SELECTED,
  EVAL_NEXL_EXPRESSION,
  AUTH_CHANGED,
  LOAD_FILE_FROM_STORAGE,
  OPEN_NEW_TAB,
  SAVE_FILE_TO_STORAGE,
  CONTENT_AREA_RESIZED, // splitters don't produce a "resize window" broadcast message, so application need to dispatch that itself in order to ace editor adjust it's editing area ( there is also another bug when maximizing window, ace editor doesn't get a resize window message )
  CLOSE_DELETED_TABS,
  CLOSE_ALL_TABS,
  TAB_CONTENT_CHANGED,
  TABS_COUNT_CHANGED,
  TAB_CLOSED,
  VIEW_EXAMPLES,
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
