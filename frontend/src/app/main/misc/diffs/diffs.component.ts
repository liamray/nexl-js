import {Component, OnInit, ViewChild} from "@angular/core";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import * as $ from 'jquery';

@Component({
  selector: 'app-diffs',
  templateUrl: './diffs.component.html',
  styleUrls: ['./diffs.component.css']
})
export class DiffsComponent {

  private differ: any;

  @ViewChild('diffsWindows') diffsWindows: jqxWindowComponent;
  @ViewChild('applyChanges') applyChanges: jqxWindowComponent;
  @ViewChild('applyAndSave') applyAndSave: jqxWindowComponent;
  @ViewChild('closeWindow') closeWindow: jqxWindowComponent;

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(msg => {
      if (msg.type === MESSAGE_TYPE.SHOW_DIFFS) {
        this.showDiffs(msg.data);
      }
    });
  }

  private showDiffs(data: any) {
    const left = data.left;
    const right = data.right;

    // creating differ
    this.differ = new AceDiff({
      element: '#diff-container',
      mode: "ace/mode/javascript",

      left: {
        content: left,
        copyLinkEnabled: false,
        editable: true
      },

      right: {
        content: right,
        copyLinkEnabled: true,
        editable: false
      }
    });

    this.onWindowResize();
    this.diffsWindows.open();
  }

  onWindowResize() {
    $('#diff-container').css('height', `${this.diffsWindows.height() - 120}px`);
    this.differ.getEditors().left.resize();
    this.differ.getEditors().right.resize();
  }

  initContent = () => {
    this.applyChanges.createComponent();
    this.applyAndSave.createComponent();
    this.closeWindow.createComponent();
  };


  onWindowClose() {
    this.differ.destroy();
  }
}
