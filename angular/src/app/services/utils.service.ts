import {environment} from '../../environments/environment';

export class UtilsService {
  static prefixUrl(url: string) {
    return environment.nexlRootUrl + url;
  }

  static isPositiveIneger(str) {
    return str.match(/^[0-9]+$/) !== null;
  }

  static arr2DS(arr, ds) {
    ds.localdata = [];

    for (let index in arr) {
      ds.localdata.push([arr[index]]);
    }
  }

  static arrFromDS(rows, key) {
    const result = [];
    for (let row in rows) {
      result.push(rows[row][key]);
    }

    return result;
  }
}
