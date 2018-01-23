import {Injectable} from "@angular/core";
import {HttpClient, HttpResponse} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';
import {HttpResponseBase} from "@angular/common/http/src/response";

const LOGIN_URL = UtilsService.prefixUrl('/auth/login');

@Injectable()
export class AuthService {
  credentials: any;

  constructor(private httpClient: HttpClient) {
  }

  login(username, password) {
    const params = {
      username: username,
      password: password
    };

    const opts: any = {
      observe: 'response',
      responseType: 'json'
    };

    return this.httpClient.post<any>(LOGIN_URL, params, opts).map(response => {
      this.credentials = response['body'];
      return response;
    });
  }
}
