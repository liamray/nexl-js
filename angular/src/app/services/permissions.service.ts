import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "./utils.service";
import 'rxjs/add/operator/map';

const GET_ADMINS = UtilsService.prefixUrl('/permissions/get-admins');

@Injectable()
export class PermissionsService {
  constructor(private httpClient: HttpClient) {
  }

  getAdmins() {
    const opts: any = {
      observe: 'response',
      responseType: 'json'
    };

    return this.httpClient.post<any>(GET_ADMINS, {}, opts).map(response => {
      return response['body'];
    });
  }
}
