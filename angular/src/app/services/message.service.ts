import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Subject} from 'rxjs/Subject';

export enum MESSAGE_TYPE {
  AUTH_CHANGED,
  OPEN_FILE,
  CLOSE_ALL_FILES
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
