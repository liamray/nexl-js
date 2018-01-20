import {environment} from '../../environments/environment';

export class UtilsService {
  static prefixUrl(url: string) {
    return environment.nexlRootUrl + url;
  }
}
