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
  @ViewChild('diffsWindow') diffsWindow: jqxWindowComponent;
  @ViewChild('applyChanges') applyChanges: jqxWindowComponent;
  @ViewChild('applyAndSave') applyAndSave: jqxWindowComponent;
  @ViewChild('closeWindow') closeWindow: jqxWindowComponent;

  private dv: any;

  constructor(private messageService: MessageService) {
    this.messageService.getMessage().subscribe(msg => {
      if (msg.type === MESSAGE_TYPE.SHOW_DIFFS) {
        this.showDiffs(msg.data);
      }
    });
  }

  private showDiffs(data: any) {
    this.diffsWindow.open();

    setTimeout(_ => {
      this.showDiffsInner(data);
    }, 100);
  }

  onWindowResize() {
    this.resize();
  }

  private showDiffsInner(data: any) {
    const left = data.left;
    const right = data.right;

    const target = document.getElementById('diff-container');
    target.innerHTML = "";

    this.dv = CodeMirror.MergeView(target, {
      value: left,
      orig: right,
      lineNumbers: true,
      mode: "javascript",
      highlightDifferences: true,
      collapseIdentical: false,
      readOnly: false,
      lineWrapping: false,
      viewportMargin: Infinity,
      revertButtons: true
    });

    this.resize();
  }

  initContent = () => {
    this.applyChanges.createComponent();
    this.applyAndSave.createComponent();
    this.closeWindow.createComponent();
  };

  onWindowClose() {
  }

  resize() {
    const height = this.diffsWindow.height() - 115;

    $('#diff-container').css('height', `${height}px`);

    this.dv.editor().setSize(null, height - 5);
    this.dv.rightOriginal().setSize(null, height - 5);
    this.dv.wrap.style.height = `${height - 5}px`;
  }
}
