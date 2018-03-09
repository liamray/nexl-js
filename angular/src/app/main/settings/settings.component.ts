import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxRibbonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxribbon";
import jqxValidator = jqwidgets.jqxValidator;
import {UtilsService} from "../../services/utils.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  @ViewChild('settingsWindow')
  settingsWindow: jqxWindowComponent;

  @ViewChild('ribbon')
  ribbon: jqxRibbonComponent;

  @ViewChild('validator')
  validator: jqxValidator;

  @ViewChild('httpPort')
  httpPort: any;

  @ViewChild('saveButton')
  saveButton: jqxButtonComponent;

  @ViewChild('cancelButton')
  cancelButton: jqxButtonComponent;

  isSaving: boolean;
  width = 190;
  encodings = ['utf8', 'ascii'];
  themes = ['android', 'arctic', 'base', 'black', 'blackberry', 'bootstrap', 'classic', 'dark', 'darkblue', 'energyblue', 'flat', 'fresh', 'glacier', 'highcontrast', 'light', 'metro', 'metrodark', 'mobile', 'office', 'orange', 'shinyblack', 'summer', 'ui-darkness', 'ui-le-frog', 'ui-lightness', 'ui-overcast', 'ui-redmond', 'ui-smoothness', 'ui-start', 'ui-sunny', 'web', 'windowsphone'];
  logLevels = ['fatal', 'error', 'info', 'debug', 'verbose'];
  rules =
    [
      {input: '#nexlSourcesDir', message: 'nexl sources dir is required!', action: 'keyup, blur', rule: 'required'},
      {input: '#httpBinding', message: 'HTTP bindings is required!', action: 'keyup, blur', rule: 'required'},
      {input: '#httpPort', message: 'HTTP port is required!', action: 'keyup, blur', rule: 'required'},
      {
        input: '#httpPort', message: 'HTTP port must be a positive integer', action: 'keyup, blur',
        rule: (input: any, commit: any): any => {
          const val = this.httpPort.val() || '';
          return UtilsService.isPositiveIneger(val);
        }
      }
    ];


  open() {
    this.settingsWindow.open();
  }

  initContent = () => {
    this.ribbon.createComponent();
    this.saveButton.createComponent();
    this.cancelButton.createComponent();
  }

  validate() {
    this.validator.validate(document.getElementById('settingsForm'));
  }

  save() {
    this.isSaving = true;
    this.validate();
  }

  onValidationSuccess(event) {
    if (this.isSaving) {
      this.settingsWindow.close();
    }
  }

  onValidationError(event) {
    this.isSaving = false;
  }
}
