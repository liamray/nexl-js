import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

const NEXL_QUICK_START = 'https://www.youtube.com/embed/_xQOzdXt35E';
const NEXL_QUICK_START_AUTOPLAY = NEXL_QUICK_START + '?autoplay=1';

@Component({
  selector: 'app-quickstart',
  templateUrl: './quickstart.component.html',
  styleUrls: ['./quickstart.component.css']
})
export class QuickStartComponent {
  @ViewChild('quickStartWindow') quickStartWindow: jqxWindowComponent;
  @ViewChild('okButton') okButton: jqxButtonComponent;

  link: string = '';
  initContent = () => {
    this.okButton.createComponent();
  };

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(
      (message) => {
        switch (message.type) {
          case MESSAGE_TYPE.OPEN_QUICK_START: {
            this.open();
            return;
          }
        }
      });
  }

  getIFrame(): any {
    return document.getElementById('quickStartYoutubeIFrame');
  }

  open() {
    this.getIFrame().src = NEXL_QUICK_START_AUTOPLAY;
    this.quickStartWindow.open();
  }

  stopPlayingVideo() {
    this.getIFrame().src = NEXL_QUICK_START;
  }
}
