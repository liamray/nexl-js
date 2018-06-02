import {AfterViewInit, Component, HostListener, ViewChild} from '@angular/core';
import {jqxSplitterComponent} from 'jqwidgets-scripts/jqwidgets-ts/angular_jqxsplitter';
import {MESSAGE_TYPE, MessageService} from "../services/message.service";
import {LocalStorageService, SPLITTERS} from "../services/localstorage.service";

@Component({
  selector: '.app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements AfterViewInit {
  @ViewChild('horizontalSplitter')
  private horizontalSplitter: jqxSplitterComponent;

  @ViewChild('verticalSplitter')
  private verticalSplitter: jqxSplitterComponent;

  constructor(private messageService: MessageService) {
  }

  ngAfterViewInit(): void {
    this.resized();
    this.loadSplittersAndUpdate();
  }

  loadSplittersAndUpdate() {
    let splitters = this.loadSplitters();

    if (splitters.horizontal.panels) {
      this.horizontalSplitter.panels(splitters.horizontal.panels);
    }

    if (splitters.horizontal.collapsed) {
      this.horizontalSplitter.collapse();
    }

    if (splitters.vertical.panels) {
      this.verticalSplitter.panels(splitters.vertical.panels);
    }

    if (splitters.vertical.collapsed) {
      this.verticalSplitter.collapse();
    }
  }

  onResize() {
    this.sendResizeMessage();
    this.saveSplittersPos();
  }

  loadSplitters() {
    const splitters = LocalStorageService.loadObj(SPLITTERS);
    if (splitters.horizontal === undefined) {
      splitters.horizontal = {};
    }
    if (splitters.vertical === undefined) {
      splitters.vertical = {};
    }

    return splitters;
  }

  saveSplitters(splitters: any) {
    LocalStorageService.storeObj(SPLITTERS, splitters);
  }

  onHorizontalCollapsed() {
    const splitters = this.loadSplitters();
    splitters.horizontal.collapsed = true;
    this.saveSplitters(splitters);
  }

  onHorizontalExpanded() {
    const splitters = this.loadSplitters();
    splitters.horizontal.collapsed = false;
    this.saveSplitters(splitters);
  }

  onVerticalCollapsed() {
    const splitters = this.loadSplitters();
    splitters.vertical.collapsed = true;
    this.saveSplitters(splitters);
  }

  onVerticalExpanded() {
    const splitters = this.loadSplitters();
    splitters.vertical.collapsed = false;
    this.saveSplitters(splitters);
  }

  resolvePanels(splitter: jqxSplitterComponent) {
    const panels = splitter.panels();
    return [{size: panels[0].size}, {size: panels[1].size}];
  }

  saveSplittersPos() {
    const splitters = this.loadSplitters();
    splitters.horizontal.panels = this.resolvePanels(this.horizontalSplitter);
    splitters.vertical.panels = this.resolvePanels(this.verticalSplitter);
    this.saveSplitters(splitters);
  }

  private sendResizeMessage() {
    this.messageService.sendMessage(MESSAGE_TYPE.CONTENT_AREA_RESIZED);
  }

  @HostListener('window:resize', ['$event'])
  sizeChange(event) {
    this.resized();
  }

  private resized() {
    this.horizontalSplitter.height(window.innerHeight - 75);
    this.sendResizeMessage();
  }
}
