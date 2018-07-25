export const SAVE_JS_FILE_CONFIRM = 'nexl.confirmations.save-js-file';
export const OPEN_URL_WARNING_MESSAGE = 'nexl.confirmations.url-warning-message';
export const SPLITTERS = 'nexl.ui.splitters';
export const ARGS_WINDOW = 'nexl.ui.args-window';
export const APPEARANCE = 'nexl.ui.appearance';
export const SHOW_SPLASH_SCREEN = 'nexl.ui.show-splash-screen';
export const PRETTIFY_BUTTON_STATE = 'nexl.ui.prettify-button-state';
export const TABS = 'nexl.ui.tabs';

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

  static loadObj(key: string, defValue?: any): any {
    const result = JSON.parse(localStorage.getItem(key));
    if (result !== null) {
      return result;
    }

    if (defValue !== undefined) {
      return defValue;
    }

    return {};
  }
}
