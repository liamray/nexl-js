import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import jqxValidator = jqwidgets.jqxValidator;
import {MESSAGE_TYPE, MessageService} from "../../../services/message.service";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {jqxDropDownListComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxdropdownlist";
import {UtilsService} from "../../../services/utils.service";

@Component({
  selector: 'app-appearance',
  templateUrl: './appearance.component.html',
  styleUrls: ['./appearance.component.css']
})
export class AppearanceComponent {
  @ViewChild('appearanceWindow') appearanceWindow: jqxWindowComponent;
  @ViewChild('appearanceValidator') appearanceValidator: jqxValidator;
  @ViewChild('saveButton') saveButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  @ViewChild('font') font: jqxDropDownListComponent;
  @ViewChild('fontSize') fontSize: jqxInputComponent;
  @ViewChild('theme') theme: jqxDropDownListComponent;
  @ViewChild('notificationMessageDisappearTime') notificationMessageDisaapearTime: jqxInputComponent;

  isSaving = false;
  width = 190;
  themes = ['android', 'arctic', 'base', 'black', 'blackberry', 'bootstrap', 'classic', 'dark', 'darkblue', 'energyblue', 'flat', 'fresh', 'glacier', 'highcontrast', 'light', 'metro', 'metrodark', 'mobile', 'office', 'orange', 'shinyblack', 'summer', 'ui-darkness', 'ui-le-frog', 'ui-lightness', 'ui-overcast', 'ui-redmond', 'ui-smoothness', 'ui-start', 'ui-sunny', 'web', 'windowsphone'];
  fonts = ['Arial', 'Bookman', 'Comic Sans MS', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Palatino', 'Tahoma', 'Times New Roman', 'Verdana'];

  appearanceValidationRules =
    [
      {
        input: '#fontSize', message: 'Font size must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          const val = this.fontSize.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      },
      {
        input: '#notificationMessageDisappearTime', message: 'Notification message disappear time must be a positive integer', action: 'keyup, blur',
        rule: (): any => {
          const val = this.notificationMessageDisaapearTime.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      }
    ];

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.OPEN_APPEARANCE_WINDOW: {
            this.open();
            return;
          }
        }
      });
  }

  open() {
    this.isSaving = false;
    this.appearanceWindow.open();
  }

  initContent = () => {
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  };

  save() {
    this.isSaving = true;
    this.appearanceValidator.validate(document.getElementById('appearanceForm'));
  }

  onValidationSuccess() {
    if (!this.isSaving) {
      return;
    }

    // save goes here...

    this.appearanceWindow.close();
  }

  onValidationError() {
    this.isSaving = false;
  }

  onOpen() {
  }
}
