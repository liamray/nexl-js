import {environment} from '../../environments/environment';

export class UtilsService {
  static SERVER_INFO: any;
  static IS_WIN: boolean;

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

  static isFileNameValid(value: string) {
    if (value.length < 1 || value.indexOf('/') >= 0) {
      return false;
    }

    if (!UtilsService.IS_WIN) {
      return true;
    }

    return value.match(/[<>:"\/\\|?*]/) === null && value.match(/^[\s.]+$/) === null;
  }

  static setServerInfo(serverInfo: any) {
    UtilsService.SERVER_INFO = serverInfo;
    UtilsService.IS_WIN = UtilsService.SERVER_INFO.OS.toLocaleLowerCase().indexOf('win') >= 0
  }

  static resolvePathOnly(label: string, relativePath: string) {
    return relativePath.substr(0, relativePath.length - label.length - 1)
  }

  static isPathEqual(path1: string, path2: string) {
    if (!UtilsService.IS_WIN) {
      return path1 === path2;
    }

    path1 = path1 ? path1.toLocaleLowerCase() : path1;
    path2 = path2 ? path2.toLocaleLowerCase() : path2;
    return path1 === path2;
  }

  static pathIndexOf(path1: string, path2: string) {
    if (!UtilsService.IS_WIN) {
      return path1.indexOf(path2);
    }

    path1 = path1 ? path1.toLocaleLowerCase() : path1;
    path2 = path2 ? path2.toLocaleLowerCase() : path2;
    return path1.indexOf(path2);
  }
}
