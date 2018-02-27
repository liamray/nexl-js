import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent implements OnInit {
  encodings = ['utf8', 'ascii'];

  constructor() {
  }

  ngOnInit() {
  }

}
