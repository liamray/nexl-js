import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-security-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.css']
})
export class AdminsComponent implements OnInit {
  admins: string[] = ['liamr'];

  constructor() { }

  ngOnInit() {
  }
}
