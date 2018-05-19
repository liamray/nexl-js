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

    return this.httpClient.post<any>(UtilsService.prefixUrl(url), data, opts);
  }
}
