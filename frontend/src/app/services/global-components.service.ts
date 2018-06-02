import {jqxLoaderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxloader";
import {NotificationComponent} from "../main/misc/notification/notification.component";
import {InputBoxComponent} from "../main/misc/inputbox/inputbox.component";
import {ConfirmBoxComponent} from "../main/misc/confirmbox/confirmbox.component";

export class GlobalComponentsService {
  loader: jqxLoaderComponent;
  notification: NotificationComponent;
  inputBox: InputBoxComponent;
  confirmBox: ConfirmBoxComponent;
}
