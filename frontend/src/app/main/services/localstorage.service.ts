export const SAVE_JS_FILE_CONFIRM = 'nexl.confirmations.save-js-file';
export const OPEN_URL_WARNING_MESSAGE = 'nexl.confirmations.url-warning-message';

export const CREDENTIALS = 'nexl.credentials';
export const SPLITTERS = 'nexl.ui.splitters';
export const ARGS_WINDOW = 'nexl.ui.args-window';
export const APPEARANCE = 'nexl.ui.appearance';

export class LocalStorageService {
  static storeRaw(key, val) {
    localStorage.setItem(key, val);
  }

  static loadRaw(key): any {
    return localStorage.getItem(key);
  }

  static storeObj(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  static loadObj(key): any {
    return JSON.parse(localStorage.getItem(key)) || {};
  }
}
