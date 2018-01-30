import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";
import {UtilsService} from "../services/utils.service";
import 'rxjs/Rx';

const GET_NEXL_SOURCES_URL = UtilsService.prefixUrl('/sources/get-nexl-sources');

const DIR_ICON = './nexl/site/images/dir.png';
const FILE_ICON = './nexl/site/images/js-file.png';

@Injectable()
export class NexlSourcesService {
  constructor(private httpClient: HttpClient) {
  }

  substIcons(json: any) {
    json.forEach((item) => {
      item.icon = item.value.isDir ? DIR_ICON : FILE_ICON;
    });
  }

  getNexlSources(relativePath?: string) {
    const params = {
      relativePath: relativePath || '/'
    };
    return this.httpClient.post<any>(GET_NEXL_SOURCES_URL, params).map(
      (data) => {
        this.substIcons(data);
        return data;
      }
    );

  }
}
