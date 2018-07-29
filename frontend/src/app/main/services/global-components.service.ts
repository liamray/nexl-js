import {jqxLoaderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxloader";
import {InputBoxComponent} from "../misc/inputbox/inputbox.component";
import {ConfirmBoxComponent} from "../misc/confirmbox/confirmbox.component";
import {MessageBoxComponent} from "../misc/messagebox/messagebox.component";

export class GlobalComponentsService {
  loader: jqxLoaderComponent;
  inputBox: InputBoxComponent;
  confirmBox: ConfirmBoxComponent;
  messageBox: MessageBoxComponent;
}
