import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";

const LOGIN_URL = UtilsService.prefixUrl('/auth/login');

@Injectable()
export class AuthService {
  constructor(private httpClient: HttpClient) {
  }

  login(username, password) {
    this.httpClient.post(LOGIN_URL, {
      username: username,
      password: password
    }, {
      observe: 'response',
      responseType: 'text'
    }).subscribe(response => {
      console.log(response)
    });
  }
}
