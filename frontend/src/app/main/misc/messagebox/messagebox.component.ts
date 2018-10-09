import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {GlobalComponentsService} from "../../services/global-components.service";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {jqxCheckBoxComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxcheckbox";

export const ICONS = {
  INFO: {icon: 'msgBoxInfoIcon', title: 'Information'},
  WARNING: {icon: 'msgBoxWarningIcon', title: 'Warning'},
  ERROR: {icon: 'msgBoxErrorIcon', title: 'Error'},
};

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
    let title = '';
    if (opts.icon) {
      title += `<span class="${opts.icon} msgBoxIcons"></span>`;
    }

    this.checkBox.val(false);
    if (opts.checkBoxText !== undefined) {
      this.window.height(160);
      this.checkBox.elementRef.nativeElement.style.display = 'block';
    } else {
      this.window.height(130);
      this.checkBox.elementRef.nativeElement.style.display = 'none';
    }

    this.opts = opts;
    title += opts.title;
    this.window.title(title);
    this.window.open();
  }

  openSimple(type: any, text: string) {
    const opts = {
      title: type.title,
      label: text,
      icon: type.icon
    };

    this.open(opts);
  }
}
