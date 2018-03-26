import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';
import {MessageService} from "./message.service";

const LOGIN_URL = UtilsService.prefixUrl('/auth/login');
const REGISTER_URL = UtilsService.prefixUrl('/auth/register');
const RESOLVE_STATUS = UtilsService.prefixUrl('/auth/resolve-status');
const CREDENTIALS = 'nexl.credentials';

@Injectable()
export class AuthService {
  constructor(private httpClient: HttpClient, private messageService: MessageService) {
  }

  resolveStatus() {
    const opts: any = {
      observe: 'response',
      responseType: 'json'
    };
    return this.httpClient.post<any>(RESOLVE_STATUS, {}, opts);
  }

  refreshStatus() {
    this.resolveStatus().subscribe(
      (status: any) => {
        this.messageService.sendMessage(status.body);
      },
      (err) => {
        alert('Something went wrong !');
        console.log(err);
      }
    );
  }

  login(username, password) {
    const params = {
      username: username,
      password: password
    };

    const opts: any = {
      observe: 'response',
      responseType: 'text'
    };

    return this.httpClient.post<any>(LOGIN_URL, params, opts).map(response => {
      localStorage.setItem(CREDENTIALS, response['body']);
      return response;
    });
  }

  register(username, password, token) {
    const params = {
      username: username,
      password: password,
      token: token
    };

    const opts: any = {
      observe: 'response',
      responseType: 'text'
    };

    return this.httpClient.post<any>(REGISTER_URL, params, opts);
  }

  getToken(): any {
    return localStorage.getItem(CREDENTIALS);
  }

  logout() {
    // todo : how to disable login token permanently ?
    localStorage.setItem(CREDENTIALS, null);
    this.refreshStatus();
  }
}
