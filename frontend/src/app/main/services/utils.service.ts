import {environment} from '../../../environments/environment';

export class UtilsService {
  static SERVER_INFO: any;
  static IS_WIN: boolean;


  static prefixUrlObject(urlObject) {
    for (let key in urlObject.URLS) {
      // replacing url with full url
      urlObject.URLS[key] = environment.nexlRootUrl + '/' + urlObject.PREFIX + urlObject.URLS[key];
    }
  }

  static prefixRootlUrl(url: string) {
    return environment.rootUrl + url;
  }

  static isPositiveIneger(str) {
    return typeof str === 'string' && str.match(/^[0-9]+$/) !== null;
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

  static resolveFileName(filePath: string) {
    return filePath.replace(/^.*[\\/]/, '');
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

  private static textArea: any;

  static copy2Clipboard(txt: string) {
    function isOS() {
      return navigator.userAgent.match(/ipad|iphone/i);
    }

    function createTextArea(text) {
      UtilsService.textArea = document.createElement('textArea');
      UtilsService.textArea.value = text;
      document.body.appendChild(UtilsService.textArea);
    }

    function selectText() {
      var range,
        selection;

      if (isOS()) {
        range = document.createRange();
        range.selectNodeContents(UtilsService.textArea);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        UtilsService.textArea.setSelectionRange(0, 999999);
      } else {
        UtilsService.textArea.select();
      }
    }

    function copyToClipboard() {
      document.execCommand('copy');
      document.body.removeChild(UtilsService.textArea);
    }

    createTextArea(txt);
    selectText();
    copyToClipboard();
  }
}

UtilsService.prefixUrlObject(REST_URLS.USERS);
UtilsService.prefixUrlObject(REST_URLS.GENERAL);
UtilsService.prefixUrlObject(REST_URLS.STORAGE);
UtilsService.prefixUrlObject(REST_URLS.PERMISSIONS);
UtilsService.prefixUrlObject(REST_URLS.SETTINGS);
UtilsService.prefixUrlObject(REST_URLS.WEBHOOKS);
