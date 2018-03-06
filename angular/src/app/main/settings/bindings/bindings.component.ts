import {Component, OnInit, ViewChild} from '@angular/core';
import {jqxValidatorComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxvalidator";

@Component({
  selector: 'app-bindings',
  templateUrl: './bindings.component.html',
  styleUrls: ['./bindings.component.css']
})
export class BindingsComponent implements OnInit {
  @ViewChild('validator')
  validator: jqxValidatorComponent;

  @ViewChild('httpBinding')
  httpBinding: any;

  @ViewChild('httpPort')
  httpPort: any;

  @ViewChild('httpsBinding')
  httpsBinding: any;

  @ViewChild('httpsPort')
  httpsPort: any;

  @ViewChild('sslKeyLocation')
  sslKeyLocation: any;

  @ViewChild('sslCertLocation')
  sslCertLocation: any;

  width: 190;

  rules = [
    {input: '#httpBinding', message: 'HTTP binding required', action: 'keyup, blur', rule: 'required'},
    {
      input: '#httpPort',
      message: 'HTTP port must be a positive integer',
      action: 'keyup, blur',
      rule: (input: any, commit: any): any => {
        const val = this.httpPort.value();
        return val.match(/^[0-9]+$/) !== null;
      }
    }
  ];


  constructor() {
  }

  ngOnInit() {
  }

  validate() {
    return this.validator.validate(document.getElementById('bindingsForm'));
  }

  onSuccess(evnt) {
    console.log(evnt);
  }
}
