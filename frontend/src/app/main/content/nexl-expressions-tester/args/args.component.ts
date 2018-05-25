import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";

@Component({
  selector: 'app-args-window',
  templateUrl: './args.component.html',
  styleUrls: ['./args.component.css']
})
export class ArgsComponent implements OnInit {
  @ViewChild('argsWindow') argsWindow: jqxWindowComponent;

  constructor() {
  }

  ngOnInit() {
  }

  toggleOpen() {
    if (this.argsWindow.isOpen()) {
      this.argsWindow.close();
    } else {
      this.argsWindow.open();
    }
  }
}
