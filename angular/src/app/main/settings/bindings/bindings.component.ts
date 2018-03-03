import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-bindings',
  templateUrl: './bindings.component.html',
  styleUrls: ['./bindings.component.css']
})
export class BindingsComponent implements OnInit {
  rules = [
    {input: '#nexlSourcesDir', message: 'nexl sources dir is required', action: 'keyup, blur', rule: 'required'},
    {
      input: '#httpTimeout',
      message: 'HTTP timeout must be a positive integer',
      action: 'keyup, blur',
      rule: (input: any, commit: any): any => {
        return false;
      }
    }
  ];


  constructor() {
  }

  ngOnInit() {
  }

}
