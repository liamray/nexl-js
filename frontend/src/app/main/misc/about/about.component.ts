import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {UtilsService} from "../../services/utils.service";

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements AfterViewInit {
  @ViewChild('about') about: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;

  nexlVersion: string;

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message: any) => {
        if (message.type === MESSAGE_TYPE.OPEN_ABOUT_WINDOW) {
          this.about.open();
        }
      }
    );
  }

  ngAfterViewInit(): void {
  }

  initContent = () => {
    this.nexlVersion = UtilsService.SERVER_INFO.VERSION;
    this.okButton.createComponent();
  };
}
