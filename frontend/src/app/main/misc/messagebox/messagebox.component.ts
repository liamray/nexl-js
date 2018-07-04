import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import * as $ from 'jquery';
import {jqxCheckBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox";

@Component({
  selector: 'app-messagebox',
  templateUrl: './messagebox.component.html',
  styleUrls: ['./messagebox.component.css']
})
export class MessageBoxComponent implements OnInit {
  @ViewChild('window') window: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;
  @ViewChild('checkBox') checkBox: jqxCheckBoxComponent;

  opts: any = {};

  initContent = () => {
    this.okButton.createComponent();
  };

  constructor(private globalComponentsService: GlobalComponentsService) {
  }

  ngOnInit() {
    this.globalComponentsService.messageBox = this;
  }

  onClose() {
    if (this.opts.callback) {
      this.opts.callback(this.checkBox.val());
    }
  }

  open(opts: any) {
    this.checkBox.val(false);
    if (opts.checkBoxText !== undefined) {
      this.window.height(160);
      this.checkBox.elementRef.nativeElement.style.display = 'block';
    } else {
      this.window.height(130);
      this.checkBox.elementRef.nativeElement.style.display = 'none';
    }

    this.opts = opts;
    $('#messageBoxTitle').text(opts.title);
    this.window.open();
  }

  // todo : use it where needed !
  openSimple(title: string, text: string) {
    const opts = {
      title: title,
      label: text,
    };

    this.open(opts);
  }
}
