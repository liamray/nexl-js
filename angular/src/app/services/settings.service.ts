import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';

@Injectable()
export class SettingsService {
  constructor(private httpClient: HttpClient) {
  }

  service(data, action) {
    const url = UtilsService.prefixUrl('/settings/' + action);

    const opts: any = {
      observe: 'response',
      responseType: 'json',
      body: data
    };

    return this.httpClient.post<any>(url, data, opts);
  }
}
