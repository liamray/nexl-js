import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';

@Injectable()
export class HttpRequestService {
  constructor(private httpClient: HttpClient) {
  }

  post(data, url, responseType) {
    const opts: any = {
      observe: 'response',
      responseType: responseType,
      body: data
    };

    return this.httpClient.post<any>(url, data, opts);
  }

  post2Root(data, url, responseType) {
    const opts: any = {
      observe: 'response',
      responseType: responseType,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    return this.httpClient.post<any>(UtilsService.prefixRootlUrl(url), data, opts);
  }
}
