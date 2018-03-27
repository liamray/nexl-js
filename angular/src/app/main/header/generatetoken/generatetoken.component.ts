import {Component, ViewChild} from '@angular/core';
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {LoaderService} from "../../../services/loader.service";
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";


@Component({
  selector: 'app-generate-token',
  templateUrl: './generatetoken.component.html',
  styleUrls: ['./generatetoken.component.css']
})
export class GenerateTokenComponent {
  @ViewChild('generateTokenWindow') generateTokenWindow: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;

  constructor(private loaderService: LoaderService) {
  }

  open() {
    this.generateTokenWindow.open();
  }


  initContent = () => {
    this.okButton.createComponent();
  }
}
