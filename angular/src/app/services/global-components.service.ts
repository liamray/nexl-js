import {jqxLoaderComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxloader";
import {NotificationComponent} from "../main/globalcomponents/notification/notification.component";
import {InputboxComponent} from "../main/globalcomponents/inputbox/inputbox.component";

export class GlobalComponentsService {
  loader: jqxLoaderComponent;
  notification: NotificationComponent;
  inputBox: InputboxComponent
}
