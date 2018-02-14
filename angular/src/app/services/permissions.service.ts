import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';

export const ADMINS = UtilsService.prefixUrl('/permissions/get-admins');
export const GROUPS = UtilsService.prefixUrl('/permissions/get-groups');

@Injectable()
export class PermissionsService {
  constructor(private httpClient: HttpClient) {
  }

  get(what) {
    const opts: any = {
      observe: 'response',
      responseType: 'json'
    };

    return this.httpClient.post<any>(what, {}, opts).map(response => {
      return response['body'];
    });
  }
}
