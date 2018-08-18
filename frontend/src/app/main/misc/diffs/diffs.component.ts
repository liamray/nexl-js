import {AfterViewInit, Component, OnInit, ViewChild} from "@angular/core";
import {MESSAGE_TYPE, MessageService} from "../../services/message.service";
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import * as $ from 'jquery';

@Component({
  selector: 'app-diffs',
  templateUrl: './diffs.component.html',
  styleUrls: ['./diffs.component.css']
})
export class DiffsComponent implements AfterViewInit {

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
    this.differ.getEditors().left.setOption('value', left);
    this.differ.getEditors().right.setOption('value', right);
    this.diffsWindows.open();
  }

  ngAfterViewInit(): void {
    // creating differ
    this.differ = new AceDiff({
      element: '#diff-container',
      mode: "ace/mode/javascript",

      left: {
        content: 'hello\nLiam',
        copyLinkEnabled: false,
        editable: true
      },

      right: {
        content: 'Liam\nRay',
        copyLinkEnabled: true,
        editable: false
      }
    });

    this.onWindowResize();
  }

  onWindowResize() {
    $('#diff-container').css('height', `${this.diffsWindows.height() - 90}px`);
    this.differ.getEditors().left.resize();
    this.differ.getEditors().right.resize();
  }

  initContent = () => {
    this.applyChanges.createComponent();
    this.applyAndSave.createComponent();
    this.closeWindow.createComponent();
  };

}
