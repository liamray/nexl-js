import {AfterViewInit, Component, OnInit, ViewChild} from "@angular/core";
import {jqxWindowComponent} from "jqwidgets-scripts/jqwidgets-ts/angular_jqxwindow";
import * as $ from 'jquery';
import {DIFFS_WINDOW, LocalStorageService} from "../../../services/localstorage.service";

@Component({
  selector: 'app-diffs',
  templateUrl: './diffs.component.html',
  styleUrls: ['./diffs.component.css']
})
export class DiffsComponent implements AfterViewInit, OnInit {
  @ViewChild('diffsWindow') diffsWindow: jqxWindowComponent;
  @ViewChild('applyChanges') applyChanges: jqxWindowComponent;
  @ViewChild('applyAndSave') applyAndSave: jqxWindowComponent;
  @ViewChild('closeWindow') closeWindow: jqxWindowComponent;

  private dv: any;
  private data: any;

  constructor() {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.loadWindowPos();
  }

  showDiffs(data: any) {
    this.data = data;
    this.diffsWindow.open();

    setTimeout(_ => {
      this.showDiffsInner();
    }, 100);
  }

  onWindowResize() {
    this.resize();
  }

  private showDiffsInner() {
    const target = document.getElementById('diff-container');
    target.innerHTML = "";

    this.dv = CodeMirror.MergeView(target, {
      value: this.data.left,
      orig: this.data.right,
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

  private loadWindowPos() {
    // loading from local storage
    const data = LocalStorageService.loadObj(DIFFS_WINDOW, {});

    if (data.offset && data.offset.top && data.offset.left) {
      this.diffsWindow.move(data.offset.left, data.offset.top);
    }

    this.diffsWindow.width(data.width || this.diffsWindow.width());
    this.diffsWindow.height(data.height || this.diffsWindow.height());
  }

  private onMoved() {
    const data = {
      offset: $('#diffsWindow').parent().offset(),
      width: this.diffsWindow.width(),
      height: this.diffsWindow.height()
    };

    console.log(data.offset);

    LocalStorageService.storeObj(DIFFS_WINDOW, data);
  }
}
