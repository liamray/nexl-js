import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {
  @ViewChild('httpTimeout')
  httpTimeout: any;

  @ViewChild('openPathButton')
  openPathButton: jqxButtonComponent;

  encodings = ['utf8', 'ascii'];

  rules = [
    {input: '#nexlSourcesDir', message: 'nexl sources dir is required', action: 'keyup, blur', rule: 'required'},
    {input: '#httpTimeout', message: 'HTTP time is required', action: 'keyup, blur', rule: 'required'},
    {
      input: '#httpTimeout',
      message: 'HTTP timeout must be a positive integer',
      action: 'keyup, blur',
      rule: (input: any, commit: any): any => {
        const val = this.httpTimeout.value();
        return val.match(/^[0-9]+$/) !== null;
      }
    }
  ];

  constructor() {
  }

  ngOnInit() {
  }

  createButtons() {
    this.openPathButton.createComponent();
  }
}
