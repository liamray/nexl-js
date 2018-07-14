import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {UtilsService} from "../services/utils.service";
import 'rxjs/Rx';

const LIST_JS_FILES_URL = UtilsService.prefixNexlUrl('/jsfiles/list-jsfiles');
const MAKE_DIR = UtilsService.prefixNexlUrl('/jsfiles/make-dir');
const DELETE_ITEM = UtilsService.prefixNexlUrl('/jsfiles/delete');
const RENAME_ITEM = UtilsService.prefixNexlUrl('/jsfiles/rename');
const MOVE_ITEM = UtilsService.prefixNexlUrl('/jsfiles/move');

const DIR_ICON = UI_CONSTANTS.DIR_ICON;
const FILE_ICON = UI_CONSTANTS.FILE_ICON;

@Injectable()
export class JSFilesService {
  constructor(private httpClient: HttpClient) {
  }

  static substIcon(item) {
    item.icon = item.value.isDir ? DIR_ICON : FILE_ICON;
  }

  static makeNewFileItem(relativePath: string, newFileName: string) {
    return {
      label: newFileName,
      icon: FILE_ICON,
      value: {
        relativePath: relativePath + UtilsService.SERVER_INFO.SLASH + newFileName,
        label: newFileName,
        isDir: false,
        isChanged: true,
        isNewFile: true
      }
    };
  }

  static makeEmptyDirItem(relativePath: string, newDirName: string) {
    return {
      label: newDirName,
      icon: DIR_ICON,
      items: [
        {
          label: "Loading...",
          disabled: true
        }
      ],
      value: {
        relativePath: relativePath,
        label: newDirName,
        mustLoadChildItems: true,
        isDir: true
      }
    };
  }

  static substIcons(json: any) {
    json.forEach((item) => {
      JSFilesService.substIcon(item);
    });
  }

  listJSFiles(relativePath?: string) {
    const params = {
      relativePath: relativePath || UtilsService.SERVER_INFO.SLASH
    };
    return this.httpClient.post<any>(LIST_JS_FILES_URL, params).map(
      (data) => {
        JSFilesService.substIcons(data);
        return data;
      }
    );
  }

  makeDir(relativePath: string) {
    const params = {
      relativePath: relativePath
    };

    return this.httpClient.post<any>(MAKE_DIR, params);
  }

  deleteItem(relativePath: string) {
    const params = {
      relativePath: relativePath
    };

    return this.httpClient.post<any>(DELETE_ITEM, params);
  }

  rename(relativePath: string, newRelativePath: string) {
    const params = {
      relativePath: relativePath,
      newRelativePath: newRelativePath
    };

    return this.httpClient.post<any>(RENAME_ITEM, params);
  }

  moveItem(source: string, dest: string) {
    const params = {
      source: source,
      dest: dest
    };

    return this.httpClient.post<any>(MOVE_ITEM, params);
  }
}
