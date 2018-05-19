export const SAVE_NEXL_SOURCE_CONFIRM = 'nexl.confirmations.save-nexl-source';
export const CREDENTIALS = 'nexl.credentials';
export const SPLITTERS = 'nexl.ui.splitters';

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
