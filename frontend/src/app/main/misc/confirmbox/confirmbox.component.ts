import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxCheckBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox";

@Component({
  selector: 'app-confirmbox',
  templateUrl: './confirmbox.component.html',
  styleUrls: ['./confirmbox.component.css']
})
export class ConfirmBoxComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('checkBox') checkBox: jqxCheckBoxComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('cancelButton') cancelButton: jqxButtonComponent;

  label: string;
  isConfirmed: boolean;
  callback: (value: any) => void;
  checkBoxText: string;
  initContent = () => {
    this.okButton.createComponent();
    this.cancelButton.createComponent();
  };

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.confirmBox = this;
  }

  onOpen() {
    this.isConfirmed = false;
  }

  onClose() {
    this.callback({
      isConfirmed: this.isConfirmed,
      checkBoxVal: this.checkBox.val()
    });
  }

  open(opts: any) {
    this.checkBox.val(false);

    this.label = opts.label;
    this.callback = opts.callback;
    this.checkBoxText = opts.checkBoxText;
    this.window.title(opts.title);

    if (opts.checkBoxText !== undefined) {
      this.window.height(160);
      this.checkBox.elementRef.nativeElement.style.display = 'block';
    } else {
      this.window.height(130);
      this.checkBox.elementRef.nativeElement.style.display = 'none';
    }

    this.window.open();
  }
}
