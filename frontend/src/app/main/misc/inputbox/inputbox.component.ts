import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxInputComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxinput";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";

@Component({
  selector: 'app-inputbox',
  templateUrl: './inputbox.component.html',
  styleUrls: ['./inputbox.component.css']
})
export class InputBoxComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('input') input: jqxInputComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  label: string;
  callback: (value: string) => void;
  isValueSet: boolean;

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.inputBox = this;
  }

  onOpen() {
    this.isValueSet = false;
    this.input.focus();
  }

  onClose() {
    if (this.isValueSet) {
      this.callback(this.input.val());
    } else {
      this.callback(undefined);
    }
  }

  open(title: string, label: string, initialValue: string, callback: (value: string) => void) {
    this.label = label;
    this.input.val(initialValue);
    this.callback = callback;
    this.window.title(title);
    this.window.open();
  }

  onKeyPress(event) {
    if (event.keyCode === 13) {
      this.isValueSet = true;
      this.window.close();
    }
  }

  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  onOk() {
    if (this.input.val() === '') {
      return;
    }

    this.isValueSet = true;
    this.window.close();
  }
}
