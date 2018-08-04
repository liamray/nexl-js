import {UtilsService} from "./utils.service";
import {APPEARANCE, LocalStorageService} from "./localstorage.service";

export const THEMES = ['android', 'arctic', 'base', 'black', 'blackberry', 'bootstrap', 'classic', 'dark', 'darkblue', 'energyblue', 'flat', 'fresh', 'glacier', 'highcontrast', 'light', 'metro', 'metrodark', 'mobile', 'office', 'orange', 'shinyblack', 'summer', 'ui-darkness', 'ui-le-frog', 'ui-lightness', 'ui-overcast', 'ui-redmond', 'ui-smoothness', 'ui-start', 'ui-sunny', 'web', 'windowsphone'];

const APPEARANCE_DATA = {
  'font-size': {
    defVal: '12',
    isValid: (val) => {
      return UtilsService.isPositiveIneger(val);
    }
  },
  'theme': {
    defVal: THEMES[0],
    isValid: (val) => {
      return THEMES.indexOf(val) >= 0;
    }
  },
  'max-execution-history-items': {
    defVal: '25',
    isValid: (val) => {
      return UtilsService.isPositiveIneger(val);
    }
  }
};


export class AppearanceService {
  static load() {
    const appearanceData = LocalStorageService.loadObj(APPEARANCE);

    for (let key in APPEARANCE_DATA) {
      const val = appearanceData[key];
      if (!APPEARANCE_DATA[key].isValid(val)) {
        appearanceData[key] = APPEARANCE_DATA[key].defVal;
      }
    }

    return appearanceData;
  }

  static save(data: any) {
    LocalStorageService.storeObj(APPEARANCE, data);
  }

  static validate(item: string, val: any) {
    return APPEARANCE_DATA[item].isValid(val);
  }
}
