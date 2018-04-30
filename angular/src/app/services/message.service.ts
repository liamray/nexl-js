import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Subject} from 'rxjs/Subject';

export enum MESSAGE_TYPE {
  AUTH_CHANGED,
  LOAD_NEXL_SOURCE,
  SAVE_NEXL_SOURCE,
  CONTENT_AREA_RESIZED, // splitters don't produce a "resize window" broadcast message, so application need to dispatch that itself in order to ace editor adjust it's editing area ( there is also another bug when maximizing window, ace editor doesn't get a resize window message )
  CLOSE_DELETED_TABS,
  CLOSE_ALL_TABS,
  SELECT_ITEM_IN_TREE,
  TAB_CONTENT_CHANGED,
  TABS_COUNT_CHANGED
}

@Injectable()
export class MessageService {
  private subject = new Subject<any>();

  sendMessage(message: any) {
    this.subject.next(message);
  }

  clearMessage() {
    this.subject.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
