import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';

export enum ACTIONS {
  GET_ADMINS = 'get-admins',
  GET_PERMISSIONS = 'get-permissions',
  SET_ADMINS = 'set-admins',
  SET_PERMISSIONS = 'set-permissions'
}

@Injectable()
export class PermissionsService {
  constructor(private httpClient: HttpClient) {
  }

  service(data, action) {
    const url = UtilsService.prefixUrl('/permissions/' + action);

    const opts: any = {
      observe: 'response',
      responseType: 'json',
      body: data
    };

    return this.httpClient.post<any>(url, {}, opts).map(response => {
      return response['body'];
    });
  }
}
