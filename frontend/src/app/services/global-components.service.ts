import {jqxLoaderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxloader";
import {NotificationComponent} from "../main/globalcomponents/notification/notification.component";
import {InputBoxComponent} from "../main/globalcomponents/inputbox/inputbox.component";
import {ConfirmBoxComponent} from "../main/globalcomponents/confirmbox/confirmbox.component";

export class GlobalComponentsService {
  loader: jqxLoaderComponent;
  notification: NotificationComponent;
  inputBox: InputBoxComponent;
  confirmBox: ConfirmBoxComponent;
}
