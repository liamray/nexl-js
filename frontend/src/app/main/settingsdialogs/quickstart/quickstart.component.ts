import {Component, ViewChild} from '@angular/core';
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import {jqxButtonComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxbuttons";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";

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

  open() {
    this.quickStartWindow.open();
  }

  stopPlayingVideo() {
    const iFrame: any = document.getElementById('quickStartYoutubeIFrame');
    iFrame.src = iFrame.src;
  }
}
