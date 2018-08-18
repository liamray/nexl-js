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

  mergeViewHeight(mergeView) {
    function editorHeight(editor) {
      if (!editor) return 0;
      return editor.getScrollInfo().height;
    }

    return Math.max(editorHeight(mergeView.leftOriginal()),
      editorHeight(mergeView.editor()),
      editorHeight(mergeView.rightOriginal()));
  }

  resize(mergeView) {
    let height = this.mergeViewHeight(mergeView);
    for (; ;) {
      if (mergeView.leftOriginal()) {
        mergeView.leftOriginal().setSize(null, height);
      }

      mergeView.editor().setSize(null, height);

      if (mergeView.rightOriginal()) {
        mergeView.rightOriginal().setSize(null, height);
      }

      const newHeight = this.mergeViewHeight(mergeView);
      if (newHeight >= height) {
        break;
      }
      else {
        height = newHeight;
      }
    }
    mergeView.wrap.style.height = height + "px";
  }


  onWindowResize() {
  }

  initContent = () => {
    this.applyChanges.createComponent();
    this.applyAndSave.createComponent();
    this.closeWindow.createComponent();
  };


  onWindowClose() {
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
      mode: "text/html",
      highlightDifferences: true,
      connect: "align",
      collapseIdentical: false,
      readOnly: false
    });

    this.resize(this.dv);
  }
}
