import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';

const LOGIN_URL = UtilsService.prefixUrl('/auth/login');
const IS_LOGGEN_IN_URL = UtilsService.prefixUrl('/auth/is-logged-in');
const CREDENTIALS = 'nexl.credentials';

@Injectable()
export class AuthService {
  constructor(private httpClient: HttpClient) {
  }

  isLoggedIn() {
    const opts: any = {
      observe: 'response',
      responseType: 'text'
    };
    return this.httpClient.post<any>(IS_LOGGEN_IN_URL, {}, opts);
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

  getToken(): any {
    return localStorage.getItem(CREDENTIALS);
  }
}
